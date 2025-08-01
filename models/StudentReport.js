const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
    },
    reportName: {
      type: String,
      required: true,
    },
    reportCardUrl: {
      type: String,
      required: true,
    },
   fatherName: {
    type: String,
    required
   },
    reportDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
