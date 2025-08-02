const express = require('express');
const router = express.Router();
const User = require('../models/User');



const PTMController = require('../controllers/PTMController');

const StudentModel = require("../models/Student");
const ReportCardModel = require("../models/ReportCard");





// GET /batches
router.get('/', async (req, res) => {
  try {
    const batches = await StudentModel.distinct("batch");
    res.json({ batches });
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ message: "Failed to fetch batches" });
  }
});





// GET /batches/:batch/dates
router.get('/:batch/dates', async (req, res) => {
  const { batch } = req.params;

  try {
    const dates = await ReportCardModel.aggregate([
      {
        $lookup: {
          from: "students", // collection name in MongoDB
          localField: "student",
          foreignField: "_id",
          as: "student",
        }
      },
      { $unwind: "$student" },
      { $match: { "student.batch": batch } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$reportDate" }
          }
        }
      },
      { $sort: { "_id": -1 } }
    ]);

    const distinctDates = dates.map(d => d._id);
    res.json({ dates: distinctDates });

  } catch (err) {
    console.error("Error fetching dates:", err);
    res.status(500).json({ message: "Failed to fetch report dates" });
  }
});



// GET /batches/:batch/reports
// router.get('/:batch/reports', async (req, res) => {
//   const { batch } = req.params;
//   const { date, name, rollNo, page = 1, limit = 10 } = req.query;

//   const studentQuery = { batch };

//   if (name) studentQuery.name = { $regex: name, $options: 'i' };
//   if (rollNo) studentQuery.rollNo = { $regex: rollNo, $options: 'i' };

//   const students = await StudentModel.find(studentQuery).select('_id');

//   const reportQuery = {
//     student: { $in: students.map(s => s._id) }
//   };

//   if (date) {
//     const start = new Date(date);
//     const end = new Date(date);
//     end.setHours(23, 59, 59, 999);
//     reportQuery.reportDate = { $gte: start, $lte: end };
//   }

//   const total = await ReportCardModel.countDocuments(reportQuery);

//   const reports = await ReportCardModel.find(reportQuery)
//     .populate("student")
//     .sort({ reportDate: -1 })
//     .skip((page - 1) * limit)
//     .limit(Number(limit));

//   res.json({
//     total,
//     page: Number(page),
//     totalPages: Math.ceil(total / limit),
//     reports
//   });
// });




// GET /api/batches/reports?batch=NX4&date=2025-08-01&search=John&page=1&limit=10
router.get('/reports', async (req, res) => {
  try {
    const { batch, date, search = '', page = 1, limit = 10 } = req.query;

    if (!batch || !date) {
      return res.status(400).json({ error: "Batch and date are required." });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // First, find students in that batch whose name or roll matches search
    const studentFilter = {
      batch,
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ]
    };
    const matchedStudents = await StudentModel.find(studentFilter).select('_id');


    console.log("matchedStudents", matchedStudents);


    if (matchedStudents.length === 0) {
      return res.status(404).json({ error: "No matching students found." });
    }



    const startOfDay = new Date(date);
const endOfDay = new Date(date);
endOfDay.setUTCHours(23, 59, 59, 999);

const reportFilter = {
  student: { $in: matchedStudents.map(s => s._id) },
  reportDate: { $gte: startOfDay, $lte: endOfDay }
};



    // Now fetch reports for those students on that date
    // const reportFilter = {
    //   student: { $in: matchedStudents.map(s => s._id) },
    //   reportDate: date,
    // };

    const totalReports = await ReportCardModel.countDocuments(reportFilter);


    console.log("totalReports", totalReports);
    const reports = await ReportCardModel.find(reportFilter)
      .populate('student')
      .sort({ 'student.name': 1 }) // Optional: alphabetically
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      reports,
      totalPages: Math.ceil(totalReports / limit),
      currentPage: parseInt(page),
      totalReports,
    });
  } catch (err) {
    console.error("Error in /batches/reports:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;



module.exports = router;
