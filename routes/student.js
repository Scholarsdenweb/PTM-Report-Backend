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

// router.post(
//   "/bulk-upload-photos",
//   upload.array("photos", 100),
//   async (req, res) => {
//     const uploaded = [];
//     const failed = [];

//     const uploadPromises = req.files.map((file) => {
//       return new Promise((resolve) => {
//         try {
//           console.log("File.originalName", file.originalname);
//           const [rawName, rollNoWithExt] = file.originalname.split("_");
//           const rollNo = rollNoWithExt?.split(".")[0];
//           const name = rawName.replace(/([A-Z])/g, " $1").trim(); // e.g., RiyaSharma → Riya Sharma

//           const fileName = `${name.replace(/\s+/g, "_")}_${rollNo}`; // → Riya_Sharma_1234

//           const bufferStream = new stream.PassThrough();
//           bufferStream.end(file.buffer);

//           const cloudStream = cloudinary.uploader.upload_stream(
//             {
//               folder: "PTM_Document/Student_Images",
//               public_id: fileName, // Save as name_rollNo.jpg
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





// Store active SSE connections
const sseClients = new Map();

// SSE endpoint to stream progress
router.get("/bulk-upload-photos-stream", (req, res) => {
  const clientId = Date.now() + Math.random();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders();

  sseClients.set(clientId, res);
  console.log(`SSE Client connected: ${clientId}`);

  // Send a connected message
  res.write("data: " + JSON.stringify({ type: "connected", message: "Connected to upload stream" }) + "\n\n");

  req.on("close", () => {
    sseClients.delete(clientId);
    console.log(`SSE Client disconnected: ${clientId}`);
  });

  req.on("error", (err) => {
    console.error(`SSE Error for client ${clientId}:`, err);
    sseClients.delete(clientId);
  });
});

// Helper function to broadcast SSE messages
function broadcastProgress(data) {
  console.log("Broadcasting:", data);
  sseClients.forEach((client) => {
    try {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      console.error("Error writing to SSE client:", err);
    }
  });
}

// Main upload endpoint
router.post("/bulk-upload-photos", upload.array("photos", 100), async (req, res) => {
  const uploaded = [];
  const failed = [];
  const skipped = [];
  const total = req.files?.length || 0;

  console.log(`Starting upload of ${total} files`);

  if (!req.files || req.files.length === 0) {
    broadcastProgress({
      type: "error",
      message: "No files uploaded",
    });
    return res.status(400).json({
      message: "No files uploaded",
      uploaded: [],
      failed: [],
      skipped: [],
    });
  }

  // Broadcast start message
  broadcastProgress({
    type: "start",
    total,
    message: `Starting upload of ${total} files`,
  });

  try {
    // Process files sequentially
    for (let fileIndex = 0; fileIndex < req.files.length; fileIndex++) {
      const file = req.files[fileIndex];

      // Broadcast file processing started
      broadcastProgress({
        type: "file_start",
        fileIndex,
        fileName: file.originalname,
        message: `Processing: ${file.originalname}`,
        completed: fileIndex,
        total,
      });

      await new Promise((resolve) => {
        try {
          console.log("Processing file:", file.originalname);
          const [rawName, rollNoWithExt] = file.originalname.split("_");
          const rollNo = rollNoWithExt?.split(".")[0];

          if (!rollNo) {
            failed.push({
              file: file.originalname,
              error: "Invalid filename format. Expected: Name_RollNo.jpg",
            });

            broadcastProgress({
              type: "file_error",
              fileIndex,
              fileName: file.originalname,
              message: `Invalid filename format`,
              completed: fileIndex + 1,
              total,
            });

            return resolve();
          }

          const name = rawName.replace(/([A-Z])/g, " $1").trim();
          const fileName = `${name.replace(/\s+/g, "_")}_${rollNo}`;

          // Check if student already has a photo
          Student.findOne({ rollNo })
            .then((existingStudent) => {
              if (existingStudent && existingStudent.photoUrl) {
                console.log(`⏭️  Skipped: ${rollNo} (photo already exists)`);
                skipped.push({
                  rollNo,
                  file: file.originalname,
                  reason: "Photo already exists",
                });

                broadcastProgress({
                  type: "file_skipped",
                  fileIndex,
                  fileName: file.originalname,
                  rollNo,
                  message: `Skipped: ${name} (photo already exists)`,
                  completed: fileIndex + 1,
                  total,
                });

                return resolve();
              }

              // Broadcast uploading to cloudinary
              broadcastProgress({
                type: "file_uploading",
                fileIndex,
                fileName: file.originalname,
                message: `Uploading to Cloudinary: ${name}`,
                completed: fileIndex,
                total,
              });

              // No photo exists, upload to Cloudinary
              const bufferStream = new stream.PassThrough();
              bufferStream.end(file.buffer);

              const cloudStream = cloudinary.uploader.upload_stream(
                {
                  folder: "PTM_Document/Student_Images",
                  public_id: fileName,
                  resource_type: "image",
                  quality: "auto",
                  fetch_format: "auto",
                  flags: "progressive",
                  transformation: [
                    {
                      quality: 60,
                      fetch_format: "auto",
                      width: 800,
                      height: 800,
                      crop: "fit",
                      dpr: "auto",
                    },
                  ],
                },
                async (error, result) => {
                  if (error) {
                    console.error("Cloudinary error:", error);
                    failed.push({
                      file: file.originalname,
                      rollNo,
                      error: error.message,
                    });

                    broadcastProgress({
                      type: "file_error",
                      fileIndex,
                      fileName: file.originalname,
                      message: `Cloudinary error: ${error.message}`,
                      completed: fileIndex + 1,
                      total,
                    });

                    return resolve();
                  }

                  try {
                    // Broadcast saving to database
                    broadcastProgress({
                      type: "file_processing",
                      fileIndex,
                      fileName: file.originalname,
                      message: `Saving to database: ${name}`,
                      completed: fileIndex,
                      total,
                    });

                    // Create or update student with photo URL
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

                    console.log(`✅ Uploaded: ${file.originalname}`);

                    // Broadcast file success
                    broadcastProgress({
                      type: "file_success",
                      fileIndex,
                      fileName: file.originalname,
                      rollNo,
                      name: student.name,
                      message: `✅ Uploaded: ${name}`,
                      completed: fileIndex + 1,
                      total,
                    });
                  } catch (err) {
                    console.error("Database error:", err);
                    failed.push({
                      file: file.originalname,
                      rollNo,
                      error: "DB error: " + err.message,
                    });

                    broadcastProgress({
                      type: "file_error",
                      fileIndex,
                      fileName: file.originalname,
                      message: `Database error: ${err.message}`,
                      completed: fileIndex + 1,
                      total,
                    });
                  }
                  resolve();
                }
              );

              bufferStream.pipe(cloudStream);
            })
            .catch((err) => {
              console.error("Database lookup error:", err);
              failed.push({
                file: file.originalname,
                rollNo,
                error: "DB lookup error: " + err.message,
              });

              broadcastProgress({
                type: "file_error",
                fileIndex,
                fileName: file.originalname,
                message: `Database lookup error: ${err.message}`,
                completed: fileIndex + 1,
                total,
              });

              resolve();
            });
        } catch (err) {
          console.error("File processing error:", err);
          failed.push({
            file: file.originalname,
            error: err.message,
          });

          broadcastProgress({
            type: "file_error",
            fileIndex,
            fileName: file.originalname,
            message: err.message,
            completed: fileIndex + 1,
            total,
          });

          resolve();
        }
      });
    }

    console.log("✅ Uploaded:", uploaded.length);
    console.log("⏭️  Skipped:", skipped.length);
    console.log("❌ Failed:", failed.length);

    // Broadcast completion
    broadcastProgress({
      type: "complete",
      uploaded: uploaded.length,
      skipped: skipped.length,
      failed: failed.length,
      message: `Upload complete: ${uploaded.length} uploaded, ${skipped.length} skipped, ${failed.length} failed`,
    });

   return res.json({
      uploaded,
      skipped,
      failed,
      message: `${uploaded.length} photos uploaded, ${skipped.length} skipped (already have photo), ${failed.length} failed`,
      stats: {
        uploadedCount: uploaded.length,
        skippedCount: skipped.length,
        failedCount: failed.length,
        totalProcessed: uploaded.length + skipped.length + failed.length,
      },
    });
  } catch (err) {
    console.error("Upload endpoint error:", err);

    broadcastProgress({
      type: "error",
      message: `Server error: ${err.message}`,
    });

   return res.status(500).json({
      message: "Server error during upload",
      uploaded: [],
      skipped: [],
      failed: [],
      error: err.message,
    });
  }
});

module.exports = router;
