const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const generatePerformanceReportPDF = require("./generatePerformanceReportPDF");

const StudentModel = require("../models/Student.js");
const ReportCardModel = require("../models/ReportCard.js");

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
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, {
    raw: false,
    defval: "",
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
  for (const row of rows) {
    const rollNo = row["Roll No"];
    if (!rollNo) continue;
    const count = rollNoCounts.get(rollNo) || 0;
    rollNoCounts.set(rollNo, count + 1);
  }

  const duplicateRollNos = [...rollNoCounts.entries()]
    .filter(([_, count]) => count > 1)
    .map(([rollNo]) => rollNo);

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
    const attendance = [];

    const monthSet = new Set();

    // Step 1: Collect valid months from matching keys
    Object.keys(row).forEach((key) => {
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
      ...new Set(
        Object.keys(row).reduce((acc, k) => {
          if (
            (k.startsWith("Result_") || k.startsWith("Objective_Pattern_")) &&
            /_Phy|_Chem|_Maths|Math|_Bio|_Abs|_Tot|_Total|_Eng|_Phy\(10\)|_Chem\(10\)|_Bio\(10\)|_Math\(25\)|_Eng\(15\)|_SST\(30\)|_Total\(100\)|_SST/.test(
              k
            )
          ) {
            let part = null;
            if (k.startsWith("Result_")) {
              part = k.split("_")[1]; // "Result_2024_Phy" → "2024"
            } else if (k.startsWith("Objective_Pattern_")) {
              part = k.split("_")[2]; // "Objective_Pattern_2024_Phy(10)" → "2024"
            }
            if (part) acc.push(part);
          }
          return acc;
        }, [])
      ),
    ];

    resultDates.forEach((date) => {
      const entry = { date };
      subjectWiseData.labels.push(date);

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
        "Highest Marks": `Objective_Pattern_${date}_Highest_Marks`,
        "Total(100)": `Objective_Pattern_${date}_Total(100)`,
        "Total(120)": `Objective_Pattern_${date}_Total(120)`,
        Total: row[`Result_${date}_Total`]
          ? `Result_${date}_Total`
          : row[`Objective_Pattern_${date}_Total`]
          ? `Objective_Pattern_${date}_Total`
          : "-",
      };

      let hasValidSubject = false;

      for (const [label, key] of Object.entries(subjectsMap)) {
        if (row.hasOwnProperty(key)) {
          const value = row[key] ?? 0;
          entry[label?.replace(/ \(.*?\)/, "")] = value; // strip "(xx)" for main keys
          subjectWiseData[label]?.push(value);
          hasValidSubject = true;
        }
      }

      if (hasValidSubject) {
        const rankKey = row[`Result_${date}_Rank`]
          ? `Result_${date}_Rank`
          : row[`Objective_Pattern_${date}_Rank`]
          ? `Objective_Pattern_${date}_Rank`
          : "-";
        const totalKey = `Result_${date}_Total(120)` || `Result_${date}_Total`;
        const altTotalKey = `Result_${date}_Tot`;
        const highestKey =
          row[`Result_${date}_High`] !== undefined
            ? `Result_${date}_High`
            : row[`Result_${date}_Highest_Marks`] !== undefined
            ? `Result_${date}_Highest_Marks`
            : row[`Result_${date}_Highest Marks`] !== undefined
            ? `Result_${date}_Highest Marks`
            : row[`Result_${date}_Highest Marks`] !== undefined
            ? `Result_${date}_Highest Marks`
            : row[`Objective_Pattern_${date}_Highest_Marks`] !== undefined
            ? `Objective_Pattern_${date}_Highest_Marks`
            : "-";

        // const highestKey = `Result_${date}_High` || `Result_${date}_Highest Marks`;

        entry.rank = row[rankKey] || "-";
        entry.total = row[totalKey] || row[altTotalKey] || 0;
        entry.highest = row[highestKey] || 0;

        jeeMain.push(entry);
      }
    });

    const jeeAdv = [];

    const advDates = [
      ...new Set(
        Object.keys(row)
          .filter(
            (key) => key.startsWith("JEE_ADV_Result") && key.split("_")[3]
          )
          .map((key) => key.split("_")[3])
      ),
    ];

    advDates.forEach((date) => {
      const rankKey = `JEE_ADV_Result_${date}_Rank`;
      // const rankKey = `JEE_Advanced_Result_${date}`;
      const paper1 = {
        phy: row[`JEE_ADV_Result_Paper 1_Result_${date}_Phy`] ?? 0,
        chem: row[`JEE_ADV_Result_Paper 1_Result_${date}_Chem`] ?? 0,
        maths: row[`JEE_ADV_Result_Paper 1_Result_${date}_Maths`] ?? 0,
        total: row[`JEE_ADV_Result_Paper 1_Result_${date}_Total_Marks`] ?? 0,
      };
      // const paper1 = {
      //   phy: row[`JEE_Advanced_Result_${date}_P1`] ?? 0,
      //   chem: row[`JEE_Advanced_Result_${date}_C1`] ?? 0,
      //   maths: row[`JEE_Advanced_Result_${date}_M1`] ?? 0,
      //   total: row[`JEE_Advanced_Result_${date}_T1`] ?? 0,
      // };

      const paper2 = {
        phy: row[`JEE_ADV_Result_Paper 2_Result_${date}_Phy`] ?? 0,
        chem: row[`JEE_ADV_Result_Paper 2_Result_${date}_Chem`] ?? 0,
        maths: row[`JEE_ADV_Result_Paper 2_Result_${date}_Maths`] ?? 0,
        total: row[`JEE_ADV_Result_Paper 2_Result_${date}_Total_Marks`] ?? 0,
      };
      // const paper2 = {
      //   phy: row[`JEE_Advanced_Result_${date}_P2`] ?? 0,
      //   chem: row[`JEE_Advanced_Result_${date}_C2`] ?? 0,
      //   maths: row[`JEE_Advanced_Result_${date}_M2`] ?? 0,
      //   total: row[`JEE_Advanced_Result_${date}_T2`] ?? 0,
      // };

      const total = row[`JEE_ADV_Result_${date}_Grand_Total`] ?? 0;
      const highest =
        row[`JEE_ADV_Result_${date}_High`] ||
        row[`JEE_ADV_Result_${date}_Highest_Marks`];

      // Only push if at least one subject or total is present
      if (
        Object.values(paper1).some((v) => v !== 0) ||
        Object.values(paper2).some((v) => v !== 0) ||
        total !== 0 ||
        rankKey in row
      ) {
        jeeAdv.push({
          date,
          rank: row[rankKey] || "",
          paper1,
          paper2,
          total,
          highest,
        });
      }
    });

    const boardResult = [];

    Object.keys(row).forEach((key) => {
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

    const subjectiveDates = [
      ...new Set(
        Object.keys(row)
          .filter(
            (key) => key.startsWith("Subjective_Pattern_") && key.split("_")[1]
          )
          .map((key) => key.split("_")[2])
        // .map((key) => key.split("_")[2])
      ),
    ];

    subjectiveDates.forEach((date) => {
      console.log("Subjective data  ", row);

     const rankKey = `Subjective_Pattern_${date}_Rank`;
      const science = {
        "Phy(14)": row[`Subjective_Pattern_${date}_Phy(14)`] ?? "",
        "Phy(29)": row[`Subjective_Pattern_${date}_Phy(29)`] ?? "",
        "Chem(13)": row[`Subjective_Pattern_${date}_Chem(13)`] ?? "",
        "Chem(26)": row[`Subjective_Pattern_${date}_Chem(26)`] ?? "",
        "Bio(13)": row[`Subjective_Pattern_${date}_Bio(13)`] ?? "",
        "Bio(25)": row[`Subjective_Pattern_${date}_Bio(25)`] ?? "",
        "ScienceTotal(40)": row[`Subjective_Pattern_${date}_Total(40)`] ?? "",
        "ScienceTotal(80)": row[`Subjective_Pattern_${date}_Total(80)`] ?? "",
      };

      const maths = row[`Subjective_Pattern_${date}_Maths(20)`] ?? row[`Subjective_Pattern_${date}_Maths(80)`] ?? "";
      const english = row[`Subjective_Pattern_${date}_English(40)`] ?? "";
      // const sst = row[`Subjective_Pattern_${date}_SST(80)`] ?? "";
      const highest =
        row[`Subjective_Pattern_${date}_High`] ||
        row[`Subjective_Pattern_${date}_Highest_Marks`];

      // Only push if at least one subject or total is present
      if (
        Object.values(science).some((v) => v !== 0) ||
        maths !== 0 ||
        rankKey in row
      ) {
        subjecttivePattern.push({
          date,
          rank: row[rankKey] || "",
          science,
          maths,
          english,
          // sst,
          highest,
        });
      }
    });

    const subjects = [
      { key: "Physics", label: "Physics" },
      { key: "Phy.Chem.", label: "Physical Chemistry" },
      { key: "Physical Chemistry", label: "Physical Chemistry" },
      { key: "Physical_Chemistry", label: "Physical Chemistry" },
      { key: "Organic Chemistry", label: "Organic Chemistry" },
      { key: "Organic_Chemistry", label: "Organic Chemistry" },
      { key: "Inorg.Chem", label: "Inorganic Chemistry" },
      { key: "Inorg.Chem", label: "Inorganic Chemistry" },
      { key: "Inorganic Chemistry", label: "Inorganic Chemistry" },
      { key: "Inorg_Chemistry", label: "Inorganic Chemistry" },
      { key: "Org_Chemistry", label: "Organic Chemistry" },

      { key: "Mathematics", label: "Mathematics" },
      { key: "Math", label: "Maths" }, // Added variation if needed
      { key: "Maths", label: "Maths" }, // Added variation if needed
      { key: "Biology", label: "Biology" },
      { key: "Botany", label: "Botany" },
      { key: "Zoology", label: "Zoology" },

      { key: "Chemistry", label: "Chemistry" },
      { key: "Geography+Economics", label: "Geography + Economics" },
      { key: "Geography", label: "Geography" },
      { key: "Economics", label: "Economics" },
      { key: "English", label: "English" },
      { key: "History & Civics", label: "History & Civics" },
      { key: "Total", label: "Total" },
    ];
    // Construct Cloudinary image URL based on name and roll number

    const feedback = subjects.reduce((acc, { key, label }) => {
      const response = row[`${key}_CR`];
      const discipline = row[`${key}_D`];
      const attention = row[`${key}_CA`];
      const homework = row[`${key}_HW`];

      if (key === "Total") {
      }

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
    const imageName = `${(row["Name"] || row["NAME"] || "Unknown")
      .trim()
      .replace(/\s+/g, "_")}_${(row["Roll No"] || row["ROLL NO"] || "")
      .replace(/,/g, "")
      .toString()
      .trim()}`;

    // For fetch Image from cloudinary
    const photoUrl = await findImageInCloudinaryFolder(imageName);

    console.log("image name", imageName);
    // For take image from local storage
    // const photoUrl = `../assets/${imageName}.jpg`;

    console.log("PhotoUrl from createReportFormExcelFile", photoUrl);

    // const photoUrl = `${cloudinaryBase}/${imageName}.jpg`; // or .png if applicable

    const formatted = dayjs(ptmDate).format("DD-MM-YY"); // 'dddd' = full day name

    console.log("Formatted date", formatted);

    return {
      name: row["NAME"] || row["Name"] || row["Student Name"] || "Unnamed",
      rollNo: (
        row["ROLL NO"] ||
        row["Roll No"] ||
        row["Roll Number"] ||
        "Unknown"
      ).replace(/,/g, ""),
      batch: row["BATCH"] || row["Batch"] || "",
      motherName: row["M_N"] || row["Mother Name"] || "",
      fatherName: row["F_N"] || row["Father Name"] || "",
      fatherContactNumber:
        row["Father Contact No."] ||
        row["Father Contact No"] ||
        row["StudentContactNo"],
      motherContactNumber:
        row["Mother Contact No."] ||
        row["Mother Contact No"] ||
        row["FatherContactNo"],
      studentContactNumber:
        row["Student Contact No."] ||
        row["Student Contact No"] ||
        row["StudentContactNo"],
      batchStrength: row["Strength"] || row["STRENGTH"],
      // photo : `../photographs/${row["Name"]}_${row["Roll No"]}`,
      // photo: "../assets/profileImg.png",
      // photo: photoUrl,
      photo: 
      // studentExist
      //   ? studentExist.photoUrl
      //   : 
        photoUrl
        ? photoUrl.url
        : { url: "../assets/profileImg.png" },
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
  };

  function removeCommas(input) {
    if (typeof input !== "string") {
      input = String(input);
    }
    return input.replace(/,/g, "");
  }

  for (const row of rows) {
    const studentRollNo = removeCommas(row["Roll No"]);
    const studentName =
      row["NAME"] || row["Name"] || row["Student Name"] || "Unnamed";

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

      // Upsert student
      let student = await StudentModel.findOneAndUpdate(
        { rollNo: studentData.rollNo },
        {
          name: studentData.name,
          fatherName: studentData.fatherName,
          motherName: studentData.motherName,
          batch: studentData.batch,
          photoUrl: studentData?.photo?.url,
          fatherContact:
            removeCommas(studentData.fatherContactNumber) ||
            removeCommas(studentData.FATHER_CONTACT_NO),
          motherContact:
            removeCommas(studentData.motherContactNumber) ||
            removeCommas(studentData.MOTHER_CONTACT_NO),
        },
        { upsert: true, new: true }
      );

      const [dd, mm, yy] = studentData.ptmDate.split("-");
      const fullYear = `20${yy}`;
      const fullDate = new Date(`${fullYear}-${mm}-${dd}T00:00:00Z`);

      const reportData = await ReportCardModel.create({
        student: student._id,
        public_id: uploadedUrl.public_id,
        secure_url: uploadedUrl.secure_url,
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
