const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const generatePerformanceReportPDF = require("./generatePerformanceReportPDF");

const StudentModel = require("../models/Student.js");
const ReportCardModel = require("../models/ReportCard.js");
const { getAcademicSession } = require("./sessionUtils.js");

require("dotenv").config();

// const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const {
  findImageInCloudinaryFolder,
} = require("./cloudinary/cloudinaryFunctions.js");

const dayjs = require("dayjs");
const weekday = require("dayjs/plugin/weekday");
const localizedFormat = require("dayjs/plugin/localizedFormat");
const { checkIfReportCardExists } = require("./checkIfReportCardExists.js");
const { deleteOldAndGenerateNew } = require("./deleteOldAndGenerateNew.js");
const { removeFileFormServer } = require("./removeFileFormServer.js");
const { buildStudentPhotoBaseName } = require("./normalizeStudentPhotoFileName.js");
require("dayjs/locale/en");

dayjs.extend(weekday);
dayjs.extend(localizedFormat);


const createReportFromExcelFile = async (
  filePath,
  ptmDate,
  type,
  reportService,
  res // Pass the response object for streaming
) => {
  const workbook = xlsx.readFile(filePath, { raw: true });
  const rows = workbook.SheetNames.flatMap((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils
      .sheet_to_json(sheet, {
        raw: false,
        defval: "",
      })
      .filter((row) =>
        Object.values(row).some(
          (value) => value !== undefined && value !== null && String(value).trim() !== ""
        )
      )
      .map((row, rowIndex) => ({
        ...row,
        __sheetName: sheetName,
        __sheetRow: rowIndex + 2,
      }));
  });

  const outputDir = path.join(__dirname, "reports");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const reportResults = [];

  // Helper function to send progress updates
  // const sendProgress = (data) => {
  //   if (res && !res.writableEnded) {
  //     res.write(`data: ${JSON.stringify(data)}\n\n`);
  //   }
  // };

const sendProgress = (data) => {
  if (res && !res.writableEnded) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    res.write(message);
    
    // CRITICAL: Flush immediately to send data without buffering
    if (typeof res.flush === 'function') {
      res.flush();
    }
  }
};





  // Validation and duplicate check...
  const rollNoCounts = new Map();
  const getRowValue = (row, keys, fallback = "") => {
    const key = keys.find(
      (candidate) =>
        row[candidate] !== undefined && row[candidate] !== null && row[candidate] !== ""
    );
    return key ? row[key] : fallback;
  };

  for (const row of rows) {
    const rollNo = String(
      getRowValue(row, ["ROLL NO", "Roll No", "Roll Number", "ROLLNO", "RollNo"])
    )
      .replace(/,/g, "")
      .trim();
    if (!rollNo) continue;
    const occurrences = rollNoCounts.get(rollNo) || [];
    occurrences.push(`${row.__sheetName} row ${row.__sheetRow}`);
    rollNoCounts.set(rollNo, occurrences);
  }

  const duplicateRollNos = [...rollNoCounts.entries()]
    .filter(([_, occurrences]) => occurrences.length > 1)
    .map(([rollNo, occurrences]) => `${rollNo} (${occurrences.join(", ")})`);

  if (duplicateRollNos.length > 0) {
    throw new Error(
      `❌ Duplicate Roll No found: ${duplicateRollNos.join(", ")}`
    );
  }

  const totalStudents = rows.length;
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  // Send initial progress
  sendProgress({
    type: "start",
    total: totalStudents,
    message: "Starting report generation...",
  });

  const parseReportData = async (row, studentExist) => {
    console.log("Student Exist details ", studentExist);
    const hasValue = (value) =>
      value !== undefined && value !== null && value !== "" && value !== "-";

    const firstValue = (keys, fallback = "") => {
      const key = keys.find((candidate) => hasValue(row[candidate]));
      return key ? row[key] : fallback;
    };

    const firstKey = (keys) => keys.find((candidate) => row[candidate] !== undefined);
    const valueOrAbsent = (key) =>
      key && row[key] !== undefined ? (hasValue(row[key]) ? row[key] : "Absent") : undefined;
    const rowKeys = Object.keys(row).filter((key) => !key.startsWith("__"));

    const uniqueDatesForPrefix = (prefix) => [
      ...new Set(
        rowKeys
          .map((key) => key.match(new RegExp(`^${prefix}_(.+?)_(.+)$`))?.[1])
          .filter(Boolean)
      ),
    ];

    const escapeRegExp = (value) =>
      String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const attendance = [];

    const monthSet = new Set();

    // Step 1: Collect valid months from matching keys
    rowKeys.forEach((key) => {
      const match = key.match(/^Attendance_([A-Za-z]+)_+([PA])$/i);
      if (match) {
        monthSet.add(match[1]);
      }
    });

    // Step 2: Build the attendance array
    monthSet.forEach((month) => {
      const present =
        row[`Attendance_${month}_P`] || row[`Attendance_${month}__P`] || "-";
      const absent =
        row[`Attendance_${month}_A`] || row[`Attendance_${month}__A`] || "-";
      const percent =
        row[`Attendance_${month}_Per`] ||
        row[`Attendance_${month}_PER`] ||
        row[`Attendance_${month}_per`] ||
        "-";

      attendance.push({
        month,
        held: row[`Attendance_${month}`] || "-",
        present,
        absent,
        percent: `${percent}`,
      });
    });

    const jeeMain = [];
    const subjectWiseData = {
      labels: [],
      phy: [],
      chem: [],
      maths: [],
      bio: [],
      abs: [],
      Phy: [],
      Chem: [],
      Bio: [],
      "Phy(10)": [],
      "Chem(10)": [],
      "Bio(10)": [],
      "Maths(25)": [],
      "Eng(15)": [],
      "Eng(10)": [],
      "SST(30)": [],
      "Total(100)": [],
      "Total(120)": [],
      Total: [],
    };

    // const resultDates = [
    //   ...new Set(
    //     Object.keys(row)
    //       .filter(
    //         (k) =>
    //           (k.startsWith("Result_") || k.startsWith("Objective_Pattern_")) &&
    //           /_Phy|_Chem|_Maths|Math|_Bio|_Abs|_Tot|_Total|_Eng|_Phy(10)|_Chem(10)|_Bio(10)|_Math(25)|_Eng(15)|_SST(30)|_Total(100)|_Total|_SST/.test(
    //             k
    //           )
    //       )
    //       // .map((k) => k.split("_")[2])
    //     .map((k) => k.split("_")[1])
    //   ),
    // ];

    const resultDates = [
      ...new Set([
        ...uniqueDatesForPrefix("Result"),
        ...uniqueDatesForPrefix("Objective_Pattern"),
      ]),
    ];

    resultDates.forEach((date) => {
      const entry = { date };

      console.log("Date from resultDates", date);

      const subjectsMap = {
        phy: row[`Result_${date}_Physics`]
          ? `Result_${date}_Physics`
          : `Result_${date}_Phy`,
        // phy: `Result_${date}_Physics`,
        chem: row[`Result_${date}_Chemistry`]
          ? `Result_${date}_Chemistry`
          : `Result_${date}_Chem`,
        // chem: `Result_${date}_Chemistry`,
        maths: `Result_${date}_Maths`,
        math: `Result_${date}_Math`,
        bio: row[`Result_${date}_Bio`]
          ? `Result_${date}_Bio`
          : `Result_${date}_Biology`,
        abs: `Result_${date}_Abs`,
        "Phy(10)": `Objective_Pattern_${date}_Phy(10)`,
        "Chem(10)": `Objective_Pattern_${date}_Chem(10)`,
        "Bio(10)": `Objective_Pattern_${date}_Bio(10)`,
        "Maths(25)": `Objective_Pattern_${date}_Math(25)`,
        "Eng(15)": `Objective_Pattern_${date}_Eng(15)`,
        "Eng(10)": `Objective_Pattern_${date}_Eng(10)`,
        "SST(30)": `Objective_Pattern_${date}_SST(30)`,
        "Total(100)": `Objective_Pattern_${date}_Total(100)`,
        "Total(120)": `Objective_Pattern_${date}_Total(120)`,
        Total:
          firstKey([
            `Result_${date}_Total`,
            `Result_${date}_Tot`,
            `Result_${date}_Total(120)`,
            `Objective_Pattern_${date}_Total`,
            `Objective_Pattern_${date}_Total(100)`,
            `Objective_Pattern_${date}_Total(120)`,
          ]) || "-",
      };

      let hasTestColumn = false;

      for (const [label, key] of Object.entries(subjectsMap)) {
        if (row.hasOwnProperty(key)) {
          const value = valueOrAbsent(key);
          entry[label?.replace(/ \(.*?\)/, "")] = value; // strip "(xx)" for main keys
          subjectWiseData[label]?.push(value);
          hasTestColumn = true;
        }
      }

      if (hasTestColumn) {
        const rankKey = firstKey([
          `Result_${date}_Rank`,
          `Objective_Pattern_${date}_Rank`,
        ]);
        const totalKey = firstKey([
          `Result_${date}_Total(120)`,
          `Result_${date}_Total`,
          `Result_${date}_Tot`,
          `Objective_Pattern_${date}_Total(120)`,
          `Objective_Pattern_${date}_Total(100)`,
          `Objective_Pattern_${date}_Total`,
        ]);
        const highestKey = firstKey([
          `Result_${date}_High`,
          `Result_${date}_Highest_Marks`,
          `Result_${date}_Highest Marks`,
          `Objective_Pattern_${date}_High`,
          `Objective_Pattern_${date}_Highest_Marks`,
          `Objective_Pattern_${date}_Highest Marks`,
        ]);

        // const highestKey = `Result_${date}_High` || `Result_${date}_Highest Marks`;

        entry.rank = rankKey ? row[rankKey] || "Absent" : "Absent";
        entry.total = totalKey ? row[totalKey] || "Absent" : "Absent";
        entry.highest = highestKey ? row[highestKey] || "-" : "-";

        jeeMain.push(entry);
      }
    });

    const graphKeys = [
      ...new Set(
        jeeMain.flatMap((entry) =>
          Object.keys(entry).filter((key) => !["date", "rank", "highest"].includes(key))
        )
      ),
    ];
    subjectWiseData.labels = jeeMain.map((entry) => entry.date);
    graphKeys.forEach((key) => {
      subjectWiseData[key] = jeeMain.map((entry) => entry[key] ?? null);
    });

    const jeeAdv = [];

    const advDates = [
      ...new Set(
        rowKeys
          .map(
            (key) =>
              key.match(/^JEE_(?:ADV|Advanced)(?:_Result)?_Paper[ _]([12])_Result_(.+?)_(.+)$/)?.[2] ||
              key.match(/^JEE_(?:ADV|Advanced)_Result_(.+?)_(Rank|High|Highest_Marks|Highest Marks)$/)?.[1] ||
              key.match(/^JEE_(?:ADV|Advanced)_Result_Grand_Total_(.+)$/)?.[1] ||
              key.match(/^JEE_(?:ADV|Advanced)_Result_(.+?)_Grand_Total$/)?.[1]
          )
          .filter(Boolean)
      ),
    ];

    advDates.forEach((date) => {
      const rankKey = `JEE_ADV_Result_${date}_Rank`;
      // const rankKey = `JEE_Advanced_Result_${date}`;
      const paper1 = {
        phy: firstValue([`JEE_ADV_Result_Paper 1_Result_${date}_Phy`, `JEE_Advanced_Paper_1_Result_${date}_Phy`], "Absent"),
        chem: firstValue([`JEE_ADV_Result_Paper 1_Result_${date}_Chem`, `JEE_Advanced_Paper_1_Result_${date}_Chem`], "Absent"),
        maths: firstValue([`JEE_ADV_Result_Paper 1_Result_${date}_Maths`, `JEE_ADV_Result_Paper 1_Result_${date}_Math`, `JEE_Advanced_Paper_1_Result_${date}_Maths`, `JEE_Advanced_Paper_1_Result_${date}_Math`], "Absent"),
        total: firstValue([`JEE_ADV_Result_Paper 1_Result_${date}_Total_Marks`, `JEE_ADV_Result_Paper 1_Result_${date}_Total`, `JEE_Advanced_Paper_1_Result_${date}_Total_Marks`, `JEE_Advanced_Paper_1_Result_${date}_Total`], "Absent"),
      };
      // const paper1 = {
      //   phy: row[`JEE_Advanced_Result_${date}_P1`] ?? 0,
      //   chem: row[`JEE_Advanced_Result_${date}_C1`] ?? 0,
      //   maths: row[`JEE_Advanced_Result_${date}_M1`] ?? 0,
      //   total: row[`JEE_Advanced_Result_${date}_T1`] ?? 0,
      // };

      const paper2 = {
        phy: firstValue([`JEE_ADV_Result_Paper 2_Result_${date}_Phy`, `JEE_Advanced_Paper_2_Result_${date}_Phy`], "Absent"),
        chem: firstValue([`JEE_ADV_Result_Paper 2_Result_${date}_Chem`, `JEE_Advanced_Paper_2_Result_${date}_Chem`], "Absent"),
        maths: firstValue([`JEE_ADV_Result_Paper 2_Result_${date}_Maths`, `JEE_ADV_Result_Paper 2_Result_${date}_Math`, `JEE_Advanced_Paper_2_Result_${date}_Maths`, `JEE_Advanced_Paper_2_Result_${date}_Math`], "Absent"),
        total: firstValue([`JEE_ADV_Result_Paper 2_Result_${date}_Total_Marks`, `JEE_ADV_Result_Paper 2_Result_${date}_Total`, `JEE_Advanced_Paper_2_Result_${date}_Total_Marks`, `JEE_Advanced_Paper_2_Result_${date}_Total`], "Absent"),
      };
      // const paper2 = {
      //   phy: row[`JEE_Advanced_Result_${date}_P2`] ?? 0,
      //   chem: row[`JEE_Advanced_Result_${date}_C2`] ?? 0,
      //   maths: row[`JEE_Advanced_Result_${date}_M2`] ?? 0,
      //   total: row[`JEE_Advanced_Result_${date}_T2`] ?? 0,
      // };

      const total = firstValue([
        `JEE_ADV_Result_${date}_Grand_Total`,
        `JEE_ADV_Result_Grand_Total_${date}`,
        `JEE_ADV_Result_${date}_Total`,
        `JEE_Advanced_Result_${date}_Grand_Total`,
        `JEE_Advanced_Result_Grand_Total_${date}`,
        `JEE_Advanced_Result_${date}_Total`,
      ], "Absent");
      const highest = firstValue([
        `JEE_ADV_Result_${date}_High`,
        `JEE_ADV_Result_${date}_Highest_Marks`,
        `JEE_ADV_Result_${date}_Highest Marks`,
        `JEE_Advanced_Result_${date}_High`,
        `JEE_Advanced_Result_${date}_Highest_Marks`,
        `JEE_Advanced_Result_${date}_Highest Marks`,
      ], "");

      jeeAdv.push({
        date,
        rank: firstValue([rankKey, `JEE_Advanced_Result_${date}_Rank`], "Absent"),
        paper1,
        paper2,
        total,
        highest,
      });
    });

    const boardResult = [];

    rowKeys.forEach((key) => {
      const match = key.match(/^Board_Result_(.+?)_(.+)$/);

      if (match) {
        const [_, dateRaw, fieldRaw] = match;
        const date = dateRaw.trim();
        const field = fieldRaw.trim();

        // Skip rank and highest marks for now; handle below
        if (
          field.toLowerCase() === "rank" ||
          field.toLowerCase() === "highest marks" ||
          field.toLowerCase() === "highest_marks"
        ) {
          return;
        }

        // Construct related keys
        const subject = field;
        const rank = row[`Board_Result_${date}_Rank`] || "-";
        const highestMarks =
          row[`Board_Result_${date}_Highest marks`] ||
          row[`Board_Result_${date}_Highest_Marks`] ||
          row[`Board_Result_${date}_Highest Marks`] ||
          "-";
        const marksObtained = row[key] ?? "-";

        boardResult.push({
          examDate: date,
          subject,
          rank,
          highestMarks,
          marksObtained,
        });
      }
    });

    const subjecttivePattern = [];

    const subjectiveDates = uniqueDatesForPrefix("Subjective_Pattern");

    subjectiveDates.forEach((date) => {
      console.log("Subjective data  ", row);

      const rankKey = `Subjective_Pattern_${date}_Rank`;
      const fieldsForDate = rowKeys
        .map((key) => key.match(new RegExp(`^Subjective_Pattern_${escapeRegExp(date)}_(.+)$`))?.[1])
        .filter(Boolean);

      const science = {};
      fieldsForDate.forEach((field) => {
        const normalizedField = field.toLowerCase();
        if (
          normalizedField.startsWith("phy") ||
          normalizedField.startsWith("chem") ||
          normalizedField.startsWith("bio") ||
          normalizedField.startsWith("total")
        ) {
          const reportKey = normalizedField.startsWith("total")
            ? `ScienceTotal${field.match(/\(.+\)$/)?.[0] || ""}`
            : field;
          science[reportKey] = hasValue(row[`Subjective_Pattern_${date}_${field}`])
            ? row[`Subjective_Pattern_${date}_${field}`]
            : "Absent";
        }
      });

      const mathsKey = firstKey(fieldsForDate.filter((field) => /^maths?/i.test(field)).map((field) => `Subjective_Pattern_${date}_${field}`));
      const englishKey = firstKey(fieldsForDate.filter((field) => /^eng(lish)?/i.test(field)).map((field) => `Subjective_Pattern_${date}_${field}`));
      const sstKey = firstKey(fieldsForDate.filter((field) => /^sst/i.test(field)).map((field) => `Subjective_Pattern_${date}_${field}`));
      const maths = mathsKey ? row[mathsKey] || "Absent" : "";
      const english = englishKey ? row[englishKey] || "Absent" : "";
      const sst = sstKey ? row[sstKey] || "Absent" : "";
      const highest =
        row[`Subjective_Pattern_${date}_High`] ||
        row[`Subjective_Pattern_${date}_Highest_Marks`] ||
        row[`Subjective_Pattern_${date}_Highest Marks`];

      subjecttivePattern.push({
        date,
        rank: row[rankKey] || "Absent",
        science,
        maths,
        mathsLabel: mathsKey?.replace(`Subjective_Pattern_${date}_`, ""),
        english,
        englishLabel: englishKey?.replace(`Subjective_Pattern_${date}_`, ""),
        sst,
        sstLabel: sstKey?.replace(`Subjective_Pattern_${date}_`, ""),
        highest,
      });
    });

    const feedbackSubjectLabels = {
      "Phy.Chem.": "Physical Chemistry",
      Physical_Chemistry: "Physical Chemistry",
      Organic_Chemistry: "Organic Chemistry",
      Org_Chemistry: "Organic Chemistry",
      "Inorg.Chem": "Inorganic Chemistry",
      Inorg_Chemistry: "Inorganic Chemistry",
      Math: "Maths",
      "Geography+Economics": "Geography + Economics",
    };

    const feedbackSubjects = [
      ...new Set(
        rowKeys
          .map((key) => key.match(/^(.+)_(CR|D|CA|HW)$/)?.[1])
          .filter(Boolean)
      ),
    ];

    const feedback = feedbackSubjects.reduce((acc, key) => {
      const label = feedbackSubjectLabels[key] || key.replace(/_/g, " ");
      const response = row[`${key}_CR`];
      const discipline = row[`${key}_D`];
      const attention = row[`${key}_CA`];
      const homework = row[`${key}_HW`];

      // Add feedback only if at least one field is present
      if (
        response !== undefined ||
        discipline !== undefined ||
        attention !== undefined ||
        homework !== undefined
      ) {
        acc.push({
          subject: label,
          response: response ?? "-",
          discipline: discipline ?? "-",
          attention: attention ?? "-",
          homework: homework ?? "-",
        });
      }

      return acc;
    }, []);

    // const cloudinaryBase = `https://res.cloudinary.com/${cloud_name}/image/upload/PTM_Document/Student_Images`; // update as needed
    const imageName = buildStudentPhotoBaseName(
      firstValue(["NAME", "Name", "Student Name"], "Unknown"),
      firstValue(["ROLL NO", "Roll No", "Roll Number", "ROLLNO", "RollNo"], "")
    );

    // For fetch Image from cloudinary
    const photoUrl = await findImageInCloudinaryFolder(imageName);

    console.log("image name", imageName);
    // For take image from local storage
    // const photoUrl = `../assets/${imageName}.jpg`;

    console.log("PhotoUrl from createReportFormExcelFile", photoUrl);

    // const photoUrl = `${cloudinaryBase}/${imageName}.jpg`; // or .png if applicable

    const formatted = dayjs(ptmDate).format("DD-MM-YY"); // 'dddd' = full day name

    console.log("Formatted date", formatted);
    const fallbackPhoto = "../assets/profileImg.png";
    const studentPhoto = studentExist?.photoUrl || photoUrl?.url || fallbackPhoto;

const data =  {
      name: firstValue(["NAME", "Name", "Student Name"], "Unnamed"),
      rollNo: (
        firstValue(["ROLL NO", "Roll No", "Roll Number", "ROLLNO", "RollNo"], "Unknown")
      ).toString().replace(/,/g, ""),
      batch: firstValue(["BATCH", "Batch"], ""),
      motherName: firstValue(["M_N", "Mother Name", "MotherName"], ""),
      fatherName: firstValue(["F_N", "Father Name", "FatherName"], ""),
      fatherContactNumber:
        firstValue(["Father Contact No.", "Father Contact No", "Father Contact Number", "FatherContactNo"], ""),
      motherContactNumber:
        firstValue(["Mother Contact No.", "Mother Contact No", "Mother Contact Number", "MotherContactNo"], ""),
      studentContactNumber:
        firstValue(["Student Contact No.", "Student Contact No", "Students Contact No.", "StudentContactNo"], ""),
      batchStrength: firstValue(["Strength", "STRENGTH"], ""),
      // photo : `../photographs/${row["Name"]}_${row["Roll No"]}`,
      // photo: "../assets/profileImg.png",
      // photo: photoUrl,
      photo: studentPhoto,
      ptmDate: formatted,
      // photo: "../assets/student.png",
      headerImage: "../assets/headerImage.png",
      // headerImage: "../assets/StudentPerformanceReportHeader.png",
      subjectWiseData,
      jeeMain,
      jeeAdv,
      boardResult,
      subjecttivePattern,
      attendance,
      feedback,
    };

    console.log("Data frim the createReport From ")

    return data
  };

  function removeCommas(input) {
    if (typeof input !== "string") {
      input = String(input);
    }
    return input.replace(/,/g, "");
  }

  for (const row of rows) {
    const studentRollNo = removeCommas(
      getRowValue(row, ["ROLL NO", "Roll No", "Roll Number", "ROLLNO", "RollNo"], "")
    );
    const studentName =
      getRowValue(row, ["NAME", "Name", "Student Name"], "Unnamed");

    try {
      sendProgress({
        type: "processing",
        current: processedCount + 1,
        total: totalStudents,
        percentage: Math.round(((processedCount + 1) / totalStudents) * 100),
        studentName: studentName,
        rollNo: studentRollNo,
        message: `Processing ${studentName} (${studentRollNo})...`,
      });
          await new Promise(resolve => setTimeout(resolve, 10));


      const studentExist = await StudentModel.findOne({
        rollNo: studentRollNo,
      });
      const studentData = await parseReportData(row, studentExist);

      const { exists, report } = await checkIfReportCardExists(
        studentRollNo,
        ptmDate
      );

      if (exists && type === "generate") {
        skippedCount++;
        sendProgress({
          type: "skipped",
          current: processedCount + 1,
          total: totalStudents,
          percentage: Math.round(((processedCount + 1) / totalStudents) * 100),
          studentName: studentName,
          rollNo: studentRollNo,
          message: `Skipped ${studentName} - Report already exists`,
        });
        processedCount++;
        continue;
      } else if (exists && type === "regenerate") {
        await deleteOldAndGenerateNew(ptmDate, studentData.rollNo);
      }

      const safeName = (studentData.name || "Student").replace(/\s+/g, "_");
      const fileName = `${safeName}_${studentData.rollNo}.pdf`;
      const reportPath = path.join(outputDir, fileName);

      await generatePerformanceReportPDF(studentData, reportPath);

	      const uploadedUrl = await reportService.uploadReport(
	        reportPath,
	        studentData.name,
	        studentData.rollNo,
	        studentData.ptmDate.split(" ")[0]
	      );

	      const [dd, mm, yy] = studentData.ptmDate.split("-");
	      const fullYear = `20${yy}`;
	      const fullDate = new Date(`${fullYear}-${mm}-${dd}T00:00:00Z`);
	      const session = getAcademicSession(fullDate);

	      // Upsert student
	      let student = await StudentModel.findOneAndUpdate(
        { rollNo: studentData.rollNo },
        {
          name: studentData.name,
          fatherName: studentData.fatherName,
          motherName: studentData.motherName,
          batch: studentData.batch,
          session,
          photoUrl: studentData?.photo,
          fatherContact:
            removeCommas(studentData.fatherContactNumber) ||
            removeCommas(studentData.FATHER_CONTACT_NO),
          motherContact:
            removeCommas(studentData.motherContactNumber) ||
            removeCommas(studentData.MOTHER_CONTACT_NO),
        },
        { upsert: true, new: true }
      );

	      const reportData = await ReportCardModel.create({
        student: student._id,
        public_id: uploadedUrl.public_id,
        secure_url: uploadedUrl.secure_url,
        batch: studentData.batch,
        session,
        reportDate: fullDate,
      });

      await removeFileFormServer(reportPath);

      successCount++;
      reportResults.push({
        name: studentData.name,
        rollNo: studentData.rollNo,
        cloudinaryUrl: uploadedUrl,
      });

      sendProgress({
      type: "success",
      current: processedCount + 1,
      total: totalStudents,
      percentage: Math.round(((processedCount + 1) / totalStudents) * 100),
      studentName: studentName,
      rollNo: studentRollNo,
      message: `✅ Generated report for ${studentName}`,
    });
    
    // Add a tiny delay after success message
    await new Promise(resolve => setTimeout(resolve, 10));
    } catch (err) {
      errorCount++;
      sendProgress({
        type: "error",
        current: processedCount + 1,
        total: totalStudents,
        percentage: Math.round(((processedCount + 1) / totalStudents) * 100),
        studentName: studentName,
        rollNo: studentRollNo,
        message: `❌ Error for ${studentName}: ${err.message}`,
        error: err.message,
      });
    }

    processedCount++;
  }

  // Send completion summary
  sendProgress({
    type: "complete",
    total: totalStudents,
    processed: processedCount,
    success: successCount,
    errors: errorCount,
    skipped: skippedCount,
    message: `Completed! ${successCount} reports generated, ${errorCount} errors, ${skippedCount} skipped.`,
  });

  return reportResults;
};

module.exports = createReportFromExcelFile;
