const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    rollNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    photoUrl: String,
    batch: String,
    fatherName: String,
    motherName: String,
    fatherContact: String,
    motherContact: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
