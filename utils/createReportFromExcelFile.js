const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const generatePerformanceReportPDF = require("./generatePerformanceReportPDF");

require('dotenv').config();


  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;







const createReportFromExcelFile = async (filePath) => {
  const workbook = xlsx.readFile(filePath, { raw: true });
  // const workbook = xlsx.readFile(filePath, { raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, {
    raw: false,
    defval: "",
  });

  const outputDir = path.join(__dirname, "reports");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const reportResults = [];

  // Extract student data row by row
  const parseReportData = (row) => {
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
      const present = Number(
        row[`Attendance_${month}_P`] || row[`Attendance_${month}__P`] || 0
      );

      const absent = Number(
        row[`Attendance_${month}_A`] || row[`Attendance_${month}__A`] || 0
      );

      const percent =
        row[`Attendance_${month}_Per`] ||
        row[`Attendance_${month}_PER`] ||
        row[`Attendance_${month}_per`] ||
        0;

      attendance.push({
        month,
        held: present + absent,
        present,
        absent,
        percent: `${percent}%`,
      });
    });

    const jeeMain = [];
    const subjectWiseData = {
      labels: [],
      phy: [],
      chem: [],
      math: [],
      bio: [],
      abs: [],
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
              /_Phy|_Chem|_Maths|_Bio|_Abs|_Tot|_Total|_Eng|_Phy(10)|_Chem(10)|_Bio(10)|_Math(25)|_Eng(15)|_SST(30)|_Total(100)|_Total|_SST/.test(
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
        phy: `Result_${date}_Phy`,
        chem: `Result_${date}_Chem`,
        math: `Result_${date}_Maths`,
        bio: `Result_${date}_Bio`,
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
          entry[label.replace(/ \(.*?\)/, "")] = value; // strip "(xx)" for main keys
          subjectWiseData[label].push(value);
          hasValidSubject = true;
        }
      }

      if (hasValidSubject) {
        const rankKey = `Result_${date}`;
        const totalKey = `Result_${date}_Total`;
        const altTotalKey = `Result_${date}_Tot`;
        const highestKey = `Result_${date}_High`;

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
            (key) => key.startsWith("AdvancedResult_") && key.split("_")[1]
          )
          .map((key) => key.split("_")[1])
      ),
    ];

    advDates.forEach((date) => {
      const rankKey = `AdvancedResult_${date}`;
      const paper1 = {
        phy: row[`AdvancedResult_${date}_P1`] ?? 0,
        chem: row[`AdvancedResult_${date}_C1`] ?? 0,
        maths: row[`AdvancedResult_${date}_M1`] ?? 0,
        total: row[`AdvancedResult_${date}_T1`] ?? 0,
      };

      const paper2 = {
        phy: row[`AdvancedResult_${date}_P2`] ?? 0,
        chem: row[`AdvancedResult_${date}_C2`] ?? 0,
        maths: row[`AdvancedResult_${date}_M2`] ?? 0,
        total: row[`AdvancedResult_${date}_T2`] ?? 0,
      };

      const total = row[`AdvancedResult_${date}_GT`] ?? 0;
      const highest = row[`AdvancedResult_${date}_High`] ?? "";

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
      const highest = row[`SubjectiveResult_${date}_High`] ?? "";

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
      { key: "Inorg.Chem.", label: "Inorganic Chemistry" },
      { key: "Mathematics", label: "Mathematics" },
      { key: "Maths", label: "Maths" }, // Added variation if needed
      { key: "Biology", label: "Biology" },
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


    const cloudinaryBase = `https://res.cloudinary.com/${cloud_name}/image/upload/PTM_Document/Student_Images`; // update as needed
const imageName = `${(row["Name"] || "Unknown").trim().replace(/\s+/g, "_")}_${(row["Roll No."] || "").toString().trim()}`;
const photoUrl = `${cloudinaryBase}/${imageName}.jpg`; // or .png if applicable



console.log("photoUrl imageUrl cloudinaryBase", photoUrl, imageName, cloudinaryBase);

    return {
      name: row["NAME"] || row["Name"] || "Unnamed",
      rollNo: (row["ROLL NO"] || row["Roll No."] || "Unknown").replace(
        /,/g,
        ""
      ),
      batch: row["BATCH"] || row["Batch"] || "",
      motherName: row["M_N"] || "",
      fatherName: row["F_N"] || "",
      batchStrength: 50,
      // photo : `../photographs/${row["Name"]}_${row["Roll No."]}`,
      photo: photoUrl,
      // photo: "../assets/st/udent.png",
      headerImage: "../assets/headerImage.png",
      subjectWiseData,
      jeeMain,
      jeeAdv,
      subjecttivePattern,
      attendance,
      feedback,
    };
  };

  // Output directory

  // Generate PDFs

  console.log("Generating reports...");
  for (const row of rows) {
    const studentData = parseReportData(row);
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
