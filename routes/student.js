// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const cloudinary = require("../utils/cloudinary");
// const Student = require("../models/Student");
// const stream = require("stream");

// // Use memory storage for buffer upload to Cloudinary
// const upload = multer({ storage: multer.memoryStorage() });

// router.post(
//   "/bulk-upload-photos",
//   upload.array("photos", 100), // Accept up to 100 files
//   async (req, res) => {
//     const uploaded = [];
//     const failed = [];

//     const uploadPromises = req.files.map((file) => {
//       return new Promise((resolve) => {
//         try {
//           const [rawName, rollNoWithExt] = file.originalname.split("_");
//           const rollNo = rollNoWithExt?.split(".")[0];
//           const name = rawName.replace(/([A-Z])/g, " $1").trim(); // "RiyaSharma" -> "Riya Sharma"

//           const bufferStream = new stream.PassThrough();
//           bufferStream.end(file.buffer);

//           const cloudStream = cloudinary.uploader.upload_stream(
//             {
//               folder: "PTM_Document/Student_Images",
//               public_id: rollNo,
//               resource_type: "image",
//             },
//             async (error, result) => {
//               if (error) {
//                 failed.push({ file: file.originalname, error: error.message });
//                 return resolve();
//               }

//               try {
//                 const student = await Student.findOneAndUpdate(
//                   { rollNo },
//                   {
//                     name,
//                     rollNo,
//                     photoUrl: result.secure_url,
//                   },
//                   { new: true, upsert: true }
//                 );

//                 uploaded.push({
//                   rollNo,
//                   name: student.name,
//                   url: result.secure_url,
//                 });
//               } catch (err) {
//                 failed.push({
//                   file: file.originalname,
//                   error: "DB error: " + err.message,
//                 });
//               }

//               resolve();
//             }
//           );

//           bufferStream.pipe(cloudStream);
//         } catch (err) {
//           failed.push({ file: file.originalname, error: err.message });
//           resolve();
//         }
//       });
//     });

//     await Promise.all(uploadPromises);

//     console.log("✅ Uploaded:", uploaded);
//     console.log("❌ Failed:", failed);

//     res.json({ uploaded, failed });
//   }
// );

// module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../utils/cloudinary/cloudinarySetup.js");
const Student = require("../models/Student");
const stream = require("stream");

const upload = multer({ storage: multer.memoryStorage() });

// const Student = require("../models/Student");
const Result = require("../models/ReportCard");
const ReportCard = require("../models/ReportCard");





// GET /students/search
router.get("/search", async (req, res) => {
  const { batch, rollNo } = req.query;

  try {
    const query = {
      batch: batch,
    };

    if (rollNo) {
      query.rollNo = { $regex: rollNo, $options: "i" };
    }

    const students = await Student.find(query).limit(50);
    res.json({ students });
  } catch (error) {
    console.error("Error searching students:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});





router.post("/student-by-batch", async (req, res) => {
  try {
    const { batch } = req.body;

    // const fetchAllStudentByBatch = await Student.find({ batch: batch });
    const fetchAllStudentByBatch = await Student.find({ batch: batch }).select(
      "rollNo name photoUrl"
    );
    console.log("fetchAllStudentByBatch", fetchAllStudentByBatch);

    return res.status(200).json({ student: fetchAllStudentByBatch });
  } catch (error) {
    console.log("error frpm student-by-batch", error);
    return res.status(500).json({ message: "Server Error" });
  }
});

router.post("/get-all-student-reports", async (req, res) => {
  try {
    console.log("req body", req.body);
    const { rollNo } = req.body;

    console.log("rollNo from get-all-student-reports", rollNo);

    const getStudentID = await Student.findOne({ rollNo });

    console.log("getStudentID", getStudentID);

    const getStudentAllReports = await ReportCard.find({
      student: getStudentID,
    }).populate("student");

    console.log("getStudentAllReports", getStudentAllReports);

    return res.status(200).json({ reports: getStudentAllReports });
  } catch (error) {
    console.log("error form get-all-student-reports", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/delete/:rollNo", async (req, res) => {
  try {
    const { rollNo } = req.params;

    // Find the student
    const student = await Student.findOne({ rollNo });
    if (!student) {
      return res
        .status(404)
        .json({ message: `Student with rollNo ${rollNo} not found.` });
    }

    // Delete all report cards for that student
    await Result.deleteMany({ student: student._id });

    // Delete the student
    await Student.deleteOne({ _id: student._id });

    res.status(200).json({
      message: `Student ${rollNo} and their reports deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting student and reports:", error);
    res.status(500).json({
      message: "Failed to delete student and reports",
      error: error.message,
    });
  }
});

router.delete("/delete-all", async (req, res) => {
  try {
    await Result.deleteMany({});
    await Student.deleteMany({});

    res
      .status(200)
      .json({ message: "All reports and students deleted successfully" });
  } catch (error) {
    console.error("Error deleting all data:", error);
    res
      .status(500)
      .json({ message: "Failed to delete all data", error: error.message });
  }
});

router.post(
  "/bulk-upload-photos",
  upload.array("photos", 100),
  async (req, res) => {
    const uploaded = [];
    const failed = [];

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve) => {
        try {
          console.log("File.originalName", file.originalname);
          const [rawName, rollNoWithExt] = file.originalname.split("_");
          const rollNo = rollNoWithExt?.split(".")[0];
          const name = rawName.replace(/([A-Z])/g, " $1").trim(); // e.g., RiyaSharma → Riya Sharma

          const fileName = `${name.replace(/\s+/g, "_")}_${rollNo}`; // → Riya_Sharma_1234

          const bufferStream = new stream.PassThrough();
          bufferStream.end(file.buffer);

          const cloudStream = cloudinary.uploader.upload_stream(
            {
              folder: "PTM_Document/Student_Images",
              public_id: fileName, // Save as name_rollNo.jpg
              resource_type: "image",
            },
            async (error, result) => {
              if (error) {
                failed.push({ file: file.originalname, error: error.message });
                return resolve();
              }

              try {
                const student = await Student.findOneAndUpdate(
                  { rollNo },
                  {
                    name,
                    rollNo,
                    photoUrl: result.secure_url,
                  },
                  { new: true, upsert: true }
                );

                uploaded.push({
                  rollNo,
                  name: student.name,
                  url: result.secure_url,
                });
              } catch (err) {
                failed.push({
                  file: file.originalname,
                  error: "DB error: " + err.message,
                });
              }

              resolve();
            }
          );

          bufferStream.pipe(cloudStream);
        } catch (err) {
          failed.push({ file: file.originalname, error: err.message });
          resolve();
        }
      });
    });

    await Promise.all(uploadPromises);

    console.log("✅ Uploaded:", uploaded);
    console.log("❌ Failed:", failed);

    res.json({ uploaded, failed });
  }
);

module.exports = router;
