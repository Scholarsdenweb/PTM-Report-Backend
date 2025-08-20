const express = require('express');
const router = express.Router();
const PTMController = require('../controllers/PTMController');
const upload = require('../middlewares/upload'); // ⬅️ This is your multer middleware
const ptmController = new PTMController();
const authMiddleware = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdmin');


router.post('/upload', upload.single("csvFile"), ptmController.handleUpload.bind(ptmController));
// router.post('/regenrate', upload.single("csvFile"), ptmController.handleUpload.bind(ptmController));

router.get("/admin/reports", authMiddleware, isAdmin, ptmController.getAllReports.bind(ptmController));




// Debug route to confirm file received
router.post("/debug-upload", upload.single("csvFile"), (req, res) => {
  console.log("------ Incoming Request ------");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("File:", req.file);

  res.send({
    received: !!req.file,
    file: req.file,
    body: req.body
  });
});

module.exports = router;
