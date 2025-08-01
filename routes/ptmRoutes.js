const express = require('express');
const router = express.Router();
const PTMController = require('../controllers/PTMController');
const upload = require('../middlewares/upload'); // ⬅️ This is your multer middleware

router.post('/upload', upload.single("csvFile"), PTMController.uploadPTMReport);




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
