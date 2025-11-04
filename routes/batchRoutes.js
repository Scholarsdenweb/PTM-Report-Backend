const express = require("express");
const router = express.Router();
const User = require("../models/User");

const PTMController = require("../controllers/PTMController");

const StudentModel = require("../models/Student");
const ReportCardModel = require("../models/ReportCard");

const archiver = require("archiver");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const Student = require("../models/Student");

// GET /batches
router.get("/", async (req, res) => {
  try {
    const batches = await StudentModel.distinct("batch");
    res.json({ batches });
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ message: "Failed to fetch batches" });
  }
});

// GET /batches/:batch/dates
router.get("/:batch/dates", async (req, res) => {
  const { batch } = req.params;

  try {
    const dates = await ReportCardModel.aggregate([
      {
        $lookup: {
          from: "students", // collection name in MongoDB
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      { $match: { "student.batch": batch } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$reportDate" },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const distinctDates = dates.map((d) => d._id);
    res.json({ dates: distinctDates });
  } catch (err) {
    console.error("Error fetching dates:", err);
    res.status(500).json({ message: "Failed to fetch report dates" });
  }
});

// GET /api/batches/reports?batch=NX4&date=2025-08-01&search=John&page=1&limit=10
// router.get("/reports", async (req, res) => {
//   try {
//     const { batch, date, name ="", rollNo ="", page = 1, limit = 10 } = req.query;

//     if (!batch || !date) {
//       return res.status(400).json({ error: "Batch and date are required." });
//     }

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // First, find students in that batch whose name or roll matches search
//     const studentFilter = {
//       batch,
//       $or: [
//         { name: { $regex: name, $options: "i" } },
//         { rollNumber: { $regex: rollNo, $options: "i" } },
//       ],
//     };
//     const matchedStudents = await StudentModel.find(studentFilter).select(
//       "_id"
//     );

//     console.log("matchedStudents", matchedStudents);

//     if (matchedStudents.length === 0) {
//       return res.status(404).json({ error: "No matching students found." });
//     }

//     const startOfDay = new Date(date);
//     const endOfDay = new Date(date);
//     endOfDay.setUTCHours(23, 59, 59, 999);

//     const reportFilter = {
//       student: { $in: matchedStudents.map((s) => s._id) },
//       reportDate: { $gte: startOfDay, $lte: endOfDay },
//     };

//     // Now fetch reports for those students on that date
//     // const reportFilter = {
//     //   student: { $in: matchedStudents.map(s => s._id) },
//     //   reportDate: date,
//     // };

//     const totalReports = await ReportCardModel.countDocuments(reportFilter);

//     console.log("totalReports", totalReports);
//     const reports = await ReportCardModel.find(reportFilter)
//       .populate("student")
//       .sort({ "student.name": 1 }) // Optional: alphabetically
//       .skip(skip)
//       .limit(parseInt(limit));

//     res.json({
//       reports,
//       totalPages: Math.ceil(totalReports / limit),
//       currentPage: parseInt(page),
//       totalReports,
//     });
//   } catch (err) {
//     console.error("Error in /batches/reports:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// router.get("/reports", async (req, res) => {
//   try {
//     const {
//       batch,
//       date,
//       name = "",
//       rollNo = "",
//       page = 1,
//       limit = 9,
//     } = req.query;

//     if (!batch || !date) {
//       return res.status(400).json({ error: "Batch and date are required." });
//     }

//     const pageNumber = parseInt(page);
//     const limitNumber = parseInt(limit);
//     const skip = (pageNumber - 1) * limitNumber;

//     // Build student filter
//     const studentFilter = {
//       batch,
//       ...(name || rollNo
//         ? {
//             $and: [
//               name ? { name: { $regex: name, $options: "i" } } : {},
//               rollNo
//                 ? { rollNo: { $regex: rollNo, $options: "i" } }
//                 : {},
//             ],
//           }
//         : {}),
//     };

//     const matchedStudents = await StudentModel.find(studentFilter).select(
//       "_id"
//     );

//     if (matchedStudents.length === 0) {
//       return res.json({
//         reports: [],
//         totalPages: 1,
//         currentPage: 1,
//         totalReports: 0,
//       });
//     }

//     const startOfDay = new Date(date);
//     startOfDay.setUTCHours(0, 0, 0, 0);
//     const endOfDay = new Date(date);
//     endOfDay.setUTCHours(23, 59, 59, 999);

//     const reportFilter = {
//       student: { $in: matchedStudents.map((s) => s._id) },
//       reportDate: { $gte: startOfDay, $lte: endOfDay },
//     };

//     const totalReports = await ReportCardModel.countDocuments(reportFilter);

//     const reports = await ReportCardModel.find(reportFilter)
//       .populate("student")
//       .sort({ "student.name": 1 })
//       .skip(skip)
//       .limit(limitNumber);

//    return res.json({
//       reports,
//       totalPages: Math.ceil(totalReports / limitNumber) || 1,
//       currentPage: pageNumber,
//       totalReports,
//     });
//   } catch (err) {
//     console.error("Error in /batches/reports:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

router.get("/reports", async (req, res) => {
  try {
    const {
      batch,
      date,
      name = "",
      rollNo = "",
      page = 1,
      limit = 9,
    } = req.query;

    if (!batch || !date) {
      return res.status(400).json({ error: "Batch and date are required." });
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build student filter
    const studentFilter = {
      batch,
      ...(name || rollNo
        ? {
            $and: [
              name ? { name: { $regex: name, $options: "i" } } : {},
              rollNo ? { rollNo: { $regex: rollNo, $options: "i" } } : {},
            ],
          }
        : {}),
    };

    // Find only IDs of matched students
    const matchedStudents = await StudentModel.find(studentFilter).select(
      "_id"
    );

    if (matchedStudents.length === 0) {
      return res.json({
        reports: [],
        totalPages: 1,
        currentPage: 1,
        totalReports: 0,
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const reportFilter = {
      student: { $in: matchedStudents.map((s) => s._id) },
      reportDate: { $gte: startOfDay, $lte: endOfDay },
    };

    // Total count for pagination
    const totalReports = await ReportCardModel.countDocuments(reportFilter);

    // Aggregation pipeline (with $lookup to populate student)
    const reports = await ReportCardModel.aggregate([
      { $match: reportFilter },
      {
        $lookup: {
          from: "students", // MongoDB collection name for StudentModel
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      { $sort: { "student.name": 1, _id: 1 } }, // stable sort
      { $skip: skip },
      { $limit: limitNumber },
    ]);

    return res.json({
      reports,
      totalPages: Math.ceil(totalReports / limitNumber) || 1,
      currentPage: pageNumber,
      totalReports,
    });
  } catch (err) {
    console.error("Error in /batches/reports:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// router.get("/reports/download", async (req, res) => {
//   try {
//     const { batch, date, name = "", rollNo = "" } = req.query;
//     if (!batch || !date) {
//       return res.status(400).json({ error: "Batch and date are required." });
//     }

//     // Build student filter based on query
//     const studentFilter = {
//       batch,
//       ...(name || rollNo
//         ? {
//             $and: [
//               name
//                 ? { name: { $regex: name, $options: "i" } }
//                 : {},
//               rollNo
//                 ? { rollNo: { $regex: rollNo, $options: "i" } }
//                 : {},
//             ],
//           }
//         : {}),
//     };

//     const students = await StudentModel.find(studentFilter).select("_id name rollNo");

//     if (!students.length) {
//       return res.status(404).json({ error: "No matching students." });
//     }

//     const start = new Date(date);
//     start.setUTCHours(0, 0, 0, 0);
//     const end = new Date(date);
//     end.setUTCHours(23, 59, 59, 999);

//     const reports = await ReportCardModel.find({
//       student: { $in: students.map((s) => s._id) },
//       reportDate: { $gte: start, $lte: end },
//     }).populate("student");

//     if (!reports.length) {
//       return res.status(404).json({ error: "No reports found." });
//     }

//     // Set headers for ZIP streaming
//     res.setHeader("Content-Type", "application/zip");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=PTM_Reports_${batch}_${date}.zip`
//     );

//     const archive = archiver("zip", { zlib: { level: 9 } });
//     archive.on("error", (err) => {
//       console.error("Archive error:", err);
//       res.status(500).end();
//     });
//     archive.pipe(res);

//     // Add remote PDF streams to zip
//     for (const report of reports) {
//       try {
//         const stream = await axios.get(report.secure_url, { responseType: "stream" });
//         const safeName = `${report.student.rollNo}-${report.student.name}`.replace(/[\/\\:*?"<>| ]+/g, "_");
//         archive.append(stream.data, { name: `reports/${safeName}.pdf` });
//       } catch (err) {
//         console.error("Error fetching PDF for", report.student.name, err);
//       }
//     }

//     await archive.finalize();
//   } catch (err) {
//     console.error("Download route error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// router.get("/reports/download", async (req, res) => {
//   try {
//     const { batch, date, name = "", rollNo = "" } = req.query;

//     if (!batch || !date) {
//       return res.status(400).json({ error: "Batch and date are required." });
//     }

//     const studentFilter = {
//       batch,
//       ...(name || rollNo
//         ? {
//             $and: [
//               name ? { name: { $regex: name, $options: "i" } } : {},
//               rollNo ? { rollNo: { $regex: rollNo, $options: "i" } } : {},
//             ],
//           }
//         : {}),
//     };

//     const students = await StudentModel.find(studentFilter).select("_id name rollNo");
//     if (!students.length) {
//       return res.status(404).json({ error: "No matching students." });
//     }

//     const start = new Date(date);
//     start.setUTCHours(0, 0, 0, 0);
//     const end = new Date(date);
//     end.setUTCHours(23, 59, 59, 999);

//     const reports = await ReportCardModel.find({
//       student: { $in: students.map((s) => s._id) },
//       reportDate: { $gte: start, $lte: end },
//     }).populate("student");

//     if (!reports.length) {
//       return res.status(404).json({ error: "No reports found." });
//     }

//     // Pre-fetch all report files into memory as buffers
//     const files = [];

//     for (const report of reports) {
//       try {
//         const pdfResponse = await axios.get(report.secure_url, {
//           responseType: "arraybuffer",
//         });

//         const safeName = `${report.student.rollNo}-${report.student.name}`
//           .replace(/[\/\\:*?"<>| ]+/g, "_");

//         files.push({
//           buffer: pdfResponse.data,
//           name: `reports/${safeName}.pdf`,
//         });
//       } catch (err) {
//         console.error("Error fetching PDF for", report.student?.name, err.message);
//         // Skip this file
//       }
//     }

//     // ❌ No valid PDFs fetched
//     if (!files.length) {
//       return res.status(500).json({ error: "No valid reports to download." });
//     }

//     // ✅ Start ZIP stream
//     res.setHeader("Content-Type", "application/zip");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=PTM_Reports_${batch}_${date}.zip`
//     );

//     const archive = archiver("zip", { zlib: { level: 9 } });

//     archive.on("error", (err) => {
//       console.error("Archiver error:", err);
//       res.status(500).end();
//     });

//     archive.pipe(res);

//     // ✅ Append each buffer to archive
//     for (const file of files) {
//       archive.append(file.buffer, { name: file.name });
//     }

//     await archive.finalize();
//   } catch (err) {
//     console.error("Server error during download:", err);
//     if (!res.headersSent) {
//       res.status(500).json({ error: "Server error during report download." });
//     } else {
//       res.end();
//     }
//   }
// });

// router.get("/reports/download", async (req, res) => {
//   try {
//     const { batch, date, name = "", rollNo = "" } = req.query;

//     if (!batch || !date) {
//       return res.status(400).json({ error: "Batch and date are required." });
//     }

//     const studentFilter = {
//       batch,
//       ...(name || rollNo
//         ? {
//             $and: [
//               name ? { name: { $regex: name, $options: "i" } } : {},
//               rollNo ? { rollNo: { $regex: rollNo, $options: "i" } } : {},
//             ],
//           }
//         : {}),
//     };

//     const students = await StudentModel.find(studentFilter).select("_id name rollNo");
//     if (!students.length) {
//       return res.status(404).json({ error: "No matching students." });
//     }

//     const start = new Date(date);
//     start.setUTCHours(0, 0, 0, 0);
//     const end = new Date(date);
//     end.setUTCHours(23, 59, 59, 999);

//     const reports = await ReportCardModel.find({
//       student: { $in: students.map((s) => s._id) },
//       reportDate: { $gte: start, $lte: end },
//     }).populate("student");

//     if (!reports.length) {
//       return res.status(404).json({ error: "No reports found." });
//     }

//     // Pre-fetch all report files into memory as buffers
//     const files = [];

//     for (const report of reports) {
//       try {
//         const pdfResponse = await axios.get(report.secure_url, {
//           responseType: "arraybuffer",
//         });

//         const safeName = `${report.student.rollNo}-${report.student.name}`
//           .replace(/[\/\\:*?"<>| ]+/g, "_");

//         files.push({
//           buffer: pdfResponse.data,
//           name: `reports/${safeName}.pdf`,
//         });
//       } catch (err) {
//         console.error("Error fetching PDF for", report.student?.name, err.message);
//         // Skip this file
//       }
//     }

//     // ❌ No valid PDFs fetched
//     if (!files.length) {
//       return res.status(500).json({ error: "No valid reports to download." });
//     }

//     // ✅ Start ZIP stream
//     res.setHeader("Content-Type", "application/zip");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=PTM_Reports_${batch}_${date}.zip`
//     );

//     const archive = archiver("zip", { zlib: { level: 9 } });

//     archive.on("error", (err) => {
//       console.error("Archiver error:", err);
//       res.status(500).end();
//     });

//     archive.pipe(res);

//     // ✅ Append each buffer to archive
//     for (const file of files) {
//       archive.append(file.buffer, { name: file.name });
//     }

//     await archive.finalize();
//   } catch (err) {
//     console.error("Server error during download:", err);
//     if (!res.headersSent) {
//       res.status(500).json({ error: "Server error during report download." });
//     } else {
//       res.end();
//     }
//   }
// });

// router.get("/admin/reports/download", async (req, res) => {
//   const { batch, date, rollNo } = req.query;

//   console.log("Received download request for batch:", batch, "and date:", date);

//   if (!batch || !date) {
//     console.log("Missing batch or date in query");
//     return res.status(400).json({ error: "Batch and date are required." });
//   }

//   try {
//     const dateStart = new Date(date);
//     const dateEnd = new Date(date);
//     dateEnd.setDate(dateEnd.getDate() + 1);

//     console.log("Searching reports from", dateStart, "to", dateEnd);
//     const reports = await ReportCardModel.aggregate([
//       {
//         $match: {
//           reportDate: { $gte: dateStart, $lt: dateEnd },
//         },
//       },
//       {
//         $lookup: {
//           from: "students", // collection name (usually lowercase plural of model)
//           localField: "student",
//           foreignField: "_id",
//           as: "student",
//         },
//       },
//       {
//         $unwind: "$student",
//       },
//       {
//         $match: {
//           "student.batch": batch,
//         },
//       },
//     ]);

//     console.log("Found reports:", reports.length);

//     if (!reports.length) {
//       console.log("No reports found for given date and batch");
//       return res
//         .status(404)
//         .json({ error: "No reports found for given date and batch." });
//     }

//     res.attachment(`PTM_Reports_${batch}_${date}.zip`);
//     const archive = archiver("zip", { zlib: { level: 9 } });

//     archive.on("error", (err) => {
//       console.error("Archiver error:", err);
//       res.status(500).end();
//     });

//     archive.pipe(res);

//     for (let i = 0; i < reports.length; i++) {
//       const report = reports[i];
//       console.log(
//         `Fetching report [${i + 1}/${reports.length}] for`,
//         report.student.name,
//         report.student.rollNo
//       );

//       try {
//         const response = await axios.get(report.secure_url, {
//           responseType: "arraybuffer",
//         });
//         const fileName = `${report.student.name}_${report.student.rollNo}.pdf`;
//         archive.append(response.data, { name: fileName });
//         console.log(`Appended ${fileName} to archive`);
//       } catch (downloadErr) {
//         console.error(
//           `Failed to fetch PDF for ${report.student.name} (${report.student.rollNo}):`,
//           downloadErr.message
//         );
//       }
//     }

//     archive.finalize();
//     console.log("Archive finalized and sent to client");
//   } catch (error) {
//     console.error("Download error:", error.message);
//     res.status(500).json({ error: "Failed to download reports." });
//   }
// });

// const archiver = require("archiver");
// const axios = require("axios");

// router.get("/admin/reports/download", async (req, res) => {
//   const { batch, date, rollNo } = req.query;

//   try {
//     let reports = [];

//     // 🔹 Case 1: Download by rollNo (individual student)
//     if (rollNo) {
//       const student = await Student.findOne({ rollNo });

//       if (!student) {
//         return res.status(404).json({ error: "Student not found." });
//       }

//       reports = await ReportCardModel.find({ student: student._id }).populate(
//         "student"
//       );

//       if (!reports.length) {
//         return res
//           .status(404)
//           .json({ error: "No reports found for this student." });
//       }

//       res.attachment(`PTM_Reports_RollNo_${rollNo}.zip`);
//     }

//     // 🔹 Case 2: Download by batch + date
//     else if (batch && date) {
//       const dateStart = new Date(date);
//       const dateEnd = new Date(date);
//       dateEnd.setDate(dateEnd.getDate() + 1);

//       reports = await ReportCardModel.aggregate([
//         {
//           $match: {
//             reportDate: { $gte: dateStart, $lt: dateEnd },
//           },
//         },
//         {
//           $lookup: {
//             from: "students",
//             localField: "student",
//             foreignField: "_id",
//             as: "student",
//           },
//         },
//         { $unwind: "$student" },
//         { $match: { "student.batch": batch } },
//       ]);

//       if (!reports.length) {
//         return res
//           .status(404)
//           .json({ error: "No reports found for given batch and date." });
//       }

//       res.attachment(`PTM_Reports_Batch_${batch}_Date_${date}.zip`);
//     }

//     // 🔴 Invalid: No valid params
//     else {
//       return res
//         .status(400)
//         .json({ error: "Provide either rollNo or batch and date." });
//     }

//     // 🔹 Create zip archive
//     const archive = archiver("zip", { zlib: { level: 9 } });
//     archive.on("error", (err) => {
//       console.error("Archiver error:", err);
//       res.status(500).end();
//     });

//     archive.pipe(res);

//     for (let i = 0; i < reports.length; i++) {
//       const report = reports[i];
//       const student = report.student;

//       try {
//         const response = await axios.get(report.secure_url, {
//           responseType: "arraybuffer",
//         });

//         const fileName = `${student.name}_${student.rollNo}.pdf`;
//         archive.append(response.data, { name: fileName });

//         console.log(`Appended: ${fileName}`);
//       } catch (err) {
//         console.error(
//           `Failed to download PDF for ${student.name} (${student.rollNo}):`,
//           err.message
//         );
//       }
//     }

//     archive.finalize();
//     console.log("Zip archive finalized and sent");
//   } catch (err) {
//     console.error("Download route error:", err.message);
//     res.status(500).json({ error: "Server error during download." });
//   }
// });

router.get("/admin/reports/download", async (req, res) => {
  console.log("batchId from req.params", req.params);
  const { batchId, date, rollNo } = req.query;

  try {
    let reports = [];

    // 🔹 Case 1: Download by rollNo (individual student)
    if (rollNo) {
      const student = await Student.findOne({ rollNo });

      if (!student) {
        return res.status(404).json({ error: "Student not found." });
      }

      reports = await ReportCardModel.find({ student: student._id }).populate(
        "student"
      );

      if (!reports.length) {
        return res
          .status(404)
          .json({ error: "No reports found for this student." });
      }

      res.attachment(`PTM_Reports_RollNo_${rollNo}.zip`);
    }

    // 🔹 Case 2: Download by batchId + date
    else if (batchId && date) {
      const dateStart = new Date(date);
      const dateEnd = new Date(date);
      dateEnd.setDate(dateEnd.getDate() + 1);

      reports = await ReportCardModel.aggregate([
        {
          $match: {
            reportDate: { $gte: dateStart, $lt: dateEnd },
          },
        },
        {
          $lookup: {
            from: "students",
            localField: "student",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: "$student" },
        { $match: { "student.batch": batchId } },
      ]);

      if (!reports.length) {
        return res
          .status(404)
          .json({ error: "No reports found for given batchId and date." });
      }

      res.attachment(`PTM_Reports_Batch_${batchId}_Date_${date}.zip`);
    }

    // 🔴 Invalid: No valid params
    else {
      return res
        .status(400)
        .json({ error: "Provide either rollNo or batch and date." });
    }

    // 🔹 Create zip archive
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      console.error("Archiver error:", err);
      res.status(500).end();
    });

    archive.pipe(res);

    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      const student = report.student;

      try {
        const response = await axios.get(report.secure_url, {
          responseType: "arraybuffer",
        });

        const fileName = `${student.name}_${student.rollNo}.pdf`;
        archive.append(response.data, { name: fileName });

        console.log(`Appended: ${fileName}`);
      } catch (err) {
        console.error(
          `Failed to download PDF for ${student.name} (${student.rollNo}):`,
          err.message
        );
      }
    }

    archive.finalize();
    console.log("Zip archive finalized and sent");
  } catch (err) {
    console.error("Download route error:", err.message);
    res.status(500).json({ error: "Server error during download." });
  }
});

router.post("/fetchDataByRollNo", async (req, res) => {
  const { rollNo } = req.body;
  const findStudentDetails = await Student.find({ rollNo });
  console.log("FIndStudentDetails", findStudentDetails);
});



router.post("/changeBatchName", async (req, res) => {
  try {
    const { currentBatch, newBatchName } = req.body;

    if (!currentBatch || !newBatchName) {
      return res.status(400).json({ message: "Both currentBatch and newBatchName are required." });
    }

    const result = await StudentModel.updateMany(
      { batch: currentBatch },          // filter
      { $set: { batch: newBatchName } } // update operation
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "No students found with the given batch name." });
    }

    res.json({
      message: `Batch name updated successfully from '${currentBatch}' to '${newBatchName}'.`,
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error("Error changing batch name:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});






module.exports = router;
