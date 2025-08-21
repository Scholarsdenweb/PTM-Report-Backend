// utils/checkIfReportCardExists.js

const ReportCard = require("../models/ReportCard.js");
const Student = require("../models/Student.js");
const dayjs = require("dayjs");

// async function deleteOldAndGenerateNew(ptmDate, rollNo) {
//   console.log(
//     "rollNo ptmDate in deleteOldAndGenerateNew :",
//     typeof rollNo,
//     ptmDate);

//   // Step 1: Find student by roll number
//   const allStudent = await Student.find();
//   console.log("allStudent", allStudent);

//   const student = await Student.find({ rollNo });
//   console.log("Student found:", student);

//   if (!student) {
//     return { exists: false, reason: "Student not found" };
//   }

//   // Step 2: Define date range for the same day
//   const startOfDay = dayjs(ptmDate).startOf("day").toDate();
//   const endOfDay = dayjs(ptmDate).endOf("day").toDate();

//   // Step 3: Find and delete all reports on that date
//   const oldReports = await ReportCard.find({
//     student: student._id,
//     reportDate: {
//       $gte: startOfDay,
//       $lte: endOfDay,
//     },
//   });

//   console.log("OldReports from deleteIldReportAndGenerateNew", oldReports);

//   if (oldReports.length > 0) {
//     console.log(`Deleting ${oldReports.length} old report(s)...`);
//     await ReportCard.deleteMany({
//       student: student._id,
//       reportDate: {
//         $gte: startOfDay,
//         $lte: endOfDay,
//       },
//     });

//     return {
//       deleted: true,
//       count: oldReports.length,
//       message: "Old report(s) deleted",
//     };
//   }

//   return {
//     deleted: false,
//     message: "No old reports found to delete",
//   };
// }

const dayjs = require("dayjs");
const ReportCard = require("../models/ReportCard");
const Student = require("../models/Student");

async function deleteOldAndGenerateNew(rollNo, ptmDate) {
  const cleanedRollNo = String(rollNo).replace(/,/g, "").trim();
  const student = await Student.findOne({ rollNo: cleanedRollNo });

  if (!student) {
    return { exists: false, reason: "Student not found" };
  }

  const startOfDay = dayjs(ptmDate).startOf("day").toDate();
  const endOfDay = dayjs(ptmDate).endOf("day").toDate();

  // Find all reports of that day for that student
  const oldReports = await ReportCard.find({
    student: student._id,
    reportDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  if (oldReports.length > 0) {
   const deletedReport =  await ReportCard.deleteMany({
      student: student._id,
      reportDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });



    console.log("deletedReport from deleteOl")

    return {
      deleted: true,
      count: oldReports.length,
      message: "Deleted existing reports for this date",
    };
  }

  return {
    deleted: false,
    message: "No reports found on this date for this student",
  };
}

module.exports = { deleteOldAndGenerateNew };
