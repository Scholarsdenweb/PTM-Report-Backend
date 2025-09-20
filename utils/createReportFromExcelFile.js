const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const generatePerformanceReportPDF = require("./generatePerformanceReportPDF");

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
require("dayjs/locale/en");

dayjs.extend(weekday);
dayjs.extend(localizedFormat);

const createReportFromExcelFile = async (filePath, ptmDate, type) => {
  console.log("filePath, ptmDate, type", filePath, ptmDate, type);
  const workbook = xlsx.readFile(filePath, { raw: true });

  console.log("sheet from createReportFromExcelFile", workbook);

  // const workbook = xlsx.readFile(filePath, { raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  console.log("sheet from createReportFromExcelFile", sheet);
  const rows = xlsx.utils.sheet_to_json(sheet, {
    raw: false,
    defval: "",
  });

  console.log("sheet from createReportFromExcelFile", rows);

  const outputDir = path.join(__dirname, "reports");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const reportResults = [];

  // Extract student data row by row
  const parseReportData = async (row) => {
    console.log("row from parseReportData", row);

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
        row[`Attendance_${month}_P`] || row[`Attendance_${month}__P`] || 0;
      const absent =
        row[`Attendance_${month}_A`] || row[`Attendance_${month}__A`] || "-";
      const percent =
        row[`Attendance_${month}_Per`] ||
        row[`Attendance_${month}_PER`] ||
        row[`Attendance_${month}_per`];

      attendance.push({
        month,
        held: row[`Attendance_${month}`],
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
      "SST(30)": [],
      "Total(100)": [],
      Total: [],
    };

    const resultDates = [
      ...new Set(
        Object.keys(row)
          .filter(
            (k) =>
              k.startsWith("Result_") &&
              /_Phy|_Chem|_Maths|Math|_Bio|_Abs|_Tot|_Total|_Eng|_Phy(10)|_Chem(10)|_Bio(10)|_Math(25)|_Eng(15)|_SST(30)|_Total(100)|_Total|_SST/.test(
                k
              )
          )
          .map((k) => k.split("_")[1])
      ),
    ];

    resultDates.forEach((date) => {
      const entry = { date };
      subjectWiseData.labels.push(date);

      const subjectsMap = {
        phy: `Result_${date}_Physics`,
        // phy: `Result_${date}_Physics`,
        chem: `Result_${date}_Chemistry`,
        // chem: `Result_${date}_Chemistry`,
        maths: `Result_${date}_Maths`,
        math: `Result_${date}_Math`,
        bio: row[`Result_${date}_Bio`] ? `Result_${date}_Bio` : `Result_${date}_Biology`,
        abs: `Result_${date}_Abs`,
        "Phy(10)": `Result_${date}_Phy(10)`,
        "Chem(10)": `Result_${date}_Chem(10)`,
        "Bio(10)": `Result_${date}_Bio(10)`,
        "Maths(25)": `Result_${date}_Math(25)`,
        "Eng(15)": `Result_${date}_Eng(15)`,
        "SST(30)": `Result_${date}_SST(30)`,
        "Total(100)": `Result_${date}_Total(100)`,
        Total: `Result_${date}_Total`,
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
        const rankKey = `Result_${date}_Rank`;
        const totalKey = `Result_${date}_Total`;
        const altTotalKey = `Result_${date}_Tot`;
        const highestKey =
          row[`Result_${date}_High`] !== undefined
            ? `Result_${date}_High`
            : row[`Result_${date}_Highest_Marks`] !== undefined
            ? `Result_${date}_Highest_Marks`
            : row[`Result_${date}_Highest Marks`] !== undefined
            ? `Result_${date}_Highest Marks`
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
            (key) => key.startsWith("JEE_Advanced_Result_") && key.split("_")[3]
          )
          .map((key) => key.split("_")[3])
      ),
    ];

    console.log("advDates", advDates);
    advDates.forEach((date) => {
      const rankKey = `JEE_Advanced_Result_${date}_Rank`;
      // const rankKey = `JEE_Advanced_Result_${date}`;
      const paper1 = {
        phy: row[`JEE_Advanced_Paper_1_Result_${date}_Phy`] ?? 0,
        chem: row[`JEE_Advanced_Paper_1_Result_${date}_Chem`] ?? 0,
        maths: row[`JEE_Advanced_Paper_1_Result_${date}_Math`] ?? 0,
        total: row[`JEE_Advanced_Paper_1_Result_${date}_Total_Marks`] ?? 0,
      };
      // const paper1 = {
      //   phy: row[`JEE_Advanced_Result_${date}_P1`] ?? 0,
      //   chem: row[`JEE_Advanced_Result_${date}_C1`] ?? 0,
      //   maths: row[`JEE_Advanced_Result_${date}_M1`] ?? 0,
      //   total: row[`JEE_Advanced_Result_${date}_T1`] ?? 0,
      // };

      const paper2 = {
        phy: row[`JEE_Advanced_Paper_2_Result_${date}_Phy`] ?? 0,
        chem: row[`JEE_Advanced_Paper_2_Result_${date}_Chem`] ?? 0,
        maths: row[`JEE_Advanced_Paper_2_Result_${date}_Math`] ?? 0,
        total: row[`JEE_Advanced_Paper_2_Result_${date}_Total_Marks`] ?? 0,
      };
      // const paper2 = {
      //   phy: row[`JEE_Advanced_Result_${date}_P2`] ?? 0,
      //   chem: row[`JEE_Advanced_Result_${date}_C2`] ?? 0,
      //   maths: row[`JEE_Advanced_Result_${date}_M2`] ?? 0,
      //   total: row[`JEE_Advanced_Result_${date}_T2`] ?? 0,
      // };

      const total = row[`JEE_Advanced_Result_Grand_Total_${date}`] ?? 0;
      const highest =
        row[`JEE_Advanced_Result_${date}_High`] ||
        row[`JEE_Advanced_Result_${date}_Highest_Marks`];

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

    console.log("JEE MAIN", jeeMain);
    console.log("JEE ADV", jeeAdv);

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
            (key) => key.startsWith("SubjectiveResult_") && key.split("_")[1]
          )
          .map((key) => key.split("_")[1])
      ),
    ];

    subjectiveDates.forEach((date) => {
      const rankKey = `SubjectiveResult_${date}`;
      const science = {
        "Phy(14)": row[`SubjectiveResult_${date}_Phy(14)`] ?? "",
        "Chem(13)": row[`SubjectiveResult_${date}_Chems(13)`] ?? "",
        "Bio(13)": row[`SubjectiveResult_${date}_Bio(13)`] ?? "",
        "ScienceTotal(40)":
          row[`SubjectiveResult_${date}_ScienceTotal(40)`] ?? "",
      };

      const maths = row[`SubjectiveResult_${date}_Math(20)`] ?? "";
      const highest =
        row[`SubjectiveResult_${date}_High`] ||
        row[`SubjectiveResult_${date}_Highest Marks`];

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
      { key: "Inorganic_Chemistry", label: "Inorganic Chemistry" },
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
      { key: "Economics", label: "Economics" },
      { key: "English", label: "English" },
      { key: "History+Civics", label: "History + Civics" },
      { key: "Total", label: "Total" },
    ];
    // Construct Cloudinary image URL based on name and roll number

    const feedback = subjects.reduce((acc, { key, label }) => {
      const response = row[`${key}_CR`];
      const discipline = row[`${key}_OD`];
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
    const imageName = `${(row["Name"] || row["NAME"] || "Unknown")
      .trim()
      .replace(/\s+/g, "_")}_${(row["Roll No"] || row["ROLL NO"] || "")
      .replace(/,/g, "")
      .toString()
      .trim()}`;

    const photoUrl = await findImageInCloudinaryFolder(imageName);

    console.log("PhotoUrl from createReportFormExcelFile", photoUrl);
    // const photoUrl = `${cloudinaryBase}/${imageName}.jpg`; // or .png if applicable

    const formatted = dayjs(ptmDate).format("DD-MM-YY dddd"); // 'dddd' = full day name

    console.log("photoUrl imageUrl cloudinaryBase", photoUrl, imageName);

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
      fatherContactNumber: row["Father Contact No."],
      motherContactNumber: row["Mother Contact No."],
      studentContactNumber: row["Students Contact No."],
      batchStrength: row["Strength"],
      // photo : `../photographs/${row["Name"]}_${row["Roll No"]}`,
      // photo: "../assets/profileImg.png",
      photo: photoUrl ? photoUrl : "../assets/profileImg.png",
      ptmDate: formatted,
      // photo: "../assets/student.png",
      headerImage: "../assets/headerImage.png",
      subjectWiseData,
      jeeMain,
      jeeAdv,
      boardResult,
      subjecttivePattern,
      attendance,
      feedback,
    };
  };

  // Output directory

  // Generate PDFs

  const rollNoCounts = new Map();

  // Count occurrences of each Roll No
  for (const row of rows) {
    const rollNo = row["Roll No"];
    if (!rollNo) continue;

    const count = rollNoCounts.get(rollNo) || 0;
    rollNoCounts.set(rollNo, count + 1);
  }

  // Detect duplicates
  const duplicateRollNos = [...rollNoCounts.entries()]
    .filter(([_, count]) => count > 1)
    .map(([rollNo]) => rollNo);

  if (duplicateRollNos.length > 0) {
    throw new Error(
      `❌ Duplicate Roll No found: ${duplicateRollNos.join(", ")}`
    );
  }

  console.log("Generating reports...");
  for (const row of rows) {
    const studentData = await parseReportData(row);

    const { exists, report } = await checkIfReportCardExists(
      row["Roll No"]?.replace(/,/g, ""),
      ptmDate
    );

    console.log("exists, report", exists, report);

    if (exists && type === "generate") {
      console.log("exists from parseReportData", exists);
      continue;
    } else if (exists && type === "regenerate") {
      console.log("EXISTS REPORT", exists, report);
      const data = await deleteOldAndGenerateNew(ptmDate, studentData.rollNo);

      console.log("data from createReportFromExcelFile", data);
    }
    const safeName = (studentData.name || "Student").replace(/\s+/g, "_");
    const fileName = `${safeName}_${studentData.rollNo}.pdf`;
    const reportPath = path.join(outputDir, fileName);

    try {
      await generatePerformanceReportPDF(studentData, reportPath);

      reportResults.push({ studentData, reportPath });

      console.log(`✅ PDF generated: ${fileName}`);
    } catch (err) {
      console.log(`❌ Error for ${studentData.name}: ${err}`);
    }
  }
  return reportResults;
};

module.exports = createReportFromExcelFile;
