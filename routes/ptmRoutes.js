const express = require("express");
const router = express.Router();
const PTMController = require("../controllers/PTMController");
const WhatsappMessageController = require("../controllers/WhatsappMessageController");
const upload = require("../middlewares/upload"); // ⬅️ This is your multer middleware
const ptmController = new PTMController();

const whatsappMessageConsoller = new WhatsappMessageController();
const authMiddleware = require("../middlewares/authMiddleware");
const isAdmin = require("../middlewares/isAdmin");
const Student = require("../models/Student");
const ReportCard = require("../models/ReportCard");

router.post(
  "/upload",
  upload.single("csvFile"),
  ptmController.handleUpload.bind(ptmController)
);
router.post(
  "/regenrate",
  upload.single("csvFile"),
  ptmController.handleUpload.bind(ptmController)
);
router.post(
  "/send-whatsapp-message",
  whatsappMessageConsoller.handleSend.bind(whatsappMessageConsoller)
);

// DELETE all reports of students in a particular batch
router.delete("/batch/:batchId", async (req, res) => {
  const { batchId } = req.params;

  try {
    // 1. Find all students in the given batch
    const students = await Student.find({ batch: batchId }).select("_id");

    if (!students.length) {
      return res
        .status(404)
        .json({ message: "No students found for this batch." });
    }

    // 2. Extract student IDs
    const studentIds = students.map((student) => student._id);

    // 3. Delete all reports with those student IDs
    const deleteResult = await ReportCard.deleteMany({ student: { $in: studentIds } });

    res.status(200).json({
      message: "Reports deleted successfully.",
      batch: batchId,
      deletedCount: deleteResult.deletedCount,
    });

    // res.status(200).json(studentIds);
  } catch (error) {
    console.error("Error deleting reports:", error);
    res.status(500).json({ message: "Server error while deleting reports." });
  }
});

router.get(
  "/admin/reports",
  authMiddleware,
  isAdmin,
  ptmController.getAllReports.bind(ptmController)
);

router.post(
  "/send-single-message-on-whatsapp",
  whatsappMessageConsoller.sendSingleMessage.bind(whatsappMessageConsoller)
);

// Debug route to confirm file received
router.post("/debug-upload", upload.single("csvFile"), (req, res) => {
  console.log("------ Incoming Request ------");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("File:", req.file);

  res.send({
    received: !!req.file,
    file: req.file,
    body: req.body,
  });
});

module.exports = router;
