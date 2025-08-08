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
const cloudinary = require("../utils/cloudinary/cloudinarySetup");
const Student = require("../models/Student");
const stream = require("stream");

const upload = multer({ storage: multer.memoryStorage() });

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
