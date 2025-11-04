// // src/controllers/PTMController.js

// At the top of your file

const path = require("path");
const ExcelService = require("../services/ExcelService");
const ReportService = require("../services/ReportService");
const WhatsAppService = require("../services/WhatsAppService");
const createReportFromExcelFile = require("../utils/createReportFromExcelFile");
const { removeFileFormServer } = require("../utils/removeFileFormServer");
const StudentModel = require("../models/Student");
const ReportCardModel = require("../models/ReportCard");

class PTMController {
  constructor() {
    this.excelService = new ExcelService();
    this.reportService = new ReportService();
    this.whatsAppService = new WhatsAppService();
  }

  async handleUpload(req, res) {
    try {
      console.log("req.file.path", req.file.path);
      const filePath = req?.file?.path; // Excel file path from multer
      const { ptmDate, type } = req.body;

      console.log("filePath", filePath, ptmDate);
      const reportDataArray = await createReportFromExcelFile(
        filePath,
        ptmDate,
        type,
        this.reportService,
        res
      ); // returns [{ studentData, reportPath }]

      console.log("reportDateArray from handleArray", reportDataArray);

      // const results = [];

      // function removeCommas(input) {
      //   if (typeof input !== "string") {
      //     input = String(input); // ensure it's a string
      //   }
      //   return input.replace(/,/g, "");
      // }

      // for (const data of reportDataArray) {
      //   const { studentData, reportPath } = data;

      //   console.log("studentData from handleLoad", studentData);

      //   const uploadedUrl = await this.reportService.uploadReport(
      //     reportPath,
      //     studentData.name,
      //     studentData.rollNo,
      //     studentData.ptmDate.split(" ")[0]
      //     // studentData.results
      //   );

      //   console.log("uploadedUrl", uploadedUrl);

      //   console.log("studentData", studentData);

      //   // Upsert student
      //   let student = await StudentModel.findOneAndUpdate(
      //     { rollNo: studentData.rollNo },
      //     {
      //       name: studentData.name,
      //       fatherName: studentData.fatherName,
      //       motherName: studentData.motherName,
      //       batch: studentData.batch,
      //       photoUrl: studentData?.photo?.url,
      //       fatherContact:
      //         removeCommas(studentData.fatherContactNumber) ||
      //         removeCommas(studentData.FATHER_CONTACT_NO),
      //       motherContact:
      //         removeCommas(studentData.motherContactNumber) ||
      //         removeCommas(studentData.MOTHER_CONTACT_NO),
      //     },
      //     { upsert: true, new: true }
      //   );

      //   console.log("Student from handleUpload", student);
      //   console.log("Student from handleUpload", studentData);
      //   console.log("studentData.ptmDate.split",studentData.ptmDate.split(" ")[0]);
      //   console.log(
      //     "studentData.ptmDate.split",
      //     new Date(studentData.ptmDate.split(" ")[0])
      //   );
      //   // const [dd, mm, yy] = studentData.ptmDate.split("-");
      //   // const fullDate = new Date(`${dd}-${mm}-${yy}`); // e.g., "2025-10-11"

      //   // console.log("fullDate from handleUpload", fullDate);

      //   const [dd, mm, yy] = studentData.ptmDate.split("-");
      //   const fullYear = `20${yy}`; // Convert "25" → "2025"
      //   const fullDate = new Date(`${fullYear}-${mm}-${dd}T00:00:00Z`);

      //   // Create report document
      //   const reportData = await ReportCardModel.create({
      //     student: student._id,
      //     public_id: uploadedUrl.public_id,
      //     secure_url: uploadedUrl.secure_url,
      //     reportDate: fullDate,
      //   });

      //   console.log("reportData", reportData);

       

      //   await removeFileFormServer(reportPath);
      //   // const mobile = studentData.FATHER_CONTACT_NO || studentData.MOTHER_CONTACT_NO;
      //   // const name = studentData.NAME;

      //   // if (mobile) {
      //   //   await this.whatsAppService.sendReport(mobile, name, uploadedUrl);
      //   // }
      // }

      // await removeFileFormServer(filePath);




      res.status(200).json({
        message: "Reports generated successfully",
        results : reportDataArray,
      });
    } catch (err) {
      console.error("Error in PTMController:", err);
      res.status(500).json({ err });
    }
  }

  async getAllReports(req, res) {
    try {
      const reports = await ReportCardModel.find().populate("student");

      const results = await Promise.all(
        reports.map(async (report) => {
          const accessUrl = await this.reportService.getReportAccessUrl(
            report.reportCardUrl
          );
          return {
            name: report.student.name,
            rollNo: report.student.rollNo,
            batch: report.student.batch,
            uploadedAt: report.reportDate,
            downloadUrl: accessUrl,
          };
        })
      );

      res.json({
        count: results.length,
        reports: results,
      });
    } catch (err) {
      console.error("Error fetching all reports:", err);
      res
        .status(500)
        .json({ message: "An error occurred while fetching reports." });
    }
  }

  // async getAllReports(req, res) {
  //   try {
  //     const isSecure = req.query.secure === "true"; // switch via query param
  //     const reports = await ReportCardModel.find()
  //       .populate("student")
  //       .sort({ reportDate: -1 }); // latest first

  //     const formattedReports = reports.map((report) => {
  //       const publicId = report.reportCardUrl
  //         .split("/")
  //         .slice(-2)
  //         .join("/")
  //         .replace(".pdf", ""); // Extract public_id from URL

  //       const finalUrl = isSecure
  //         ? this.reportService.generateSignedUrl(publicId)
  //         : report.reportCardUrl;
  //       return {
  //         name: report.student.name,
  //         rollNo: report.student.rollNo,
  //         batch: report.student.batch,
  //         reportDate: report.reportDate,
  //         downloadUrl: finalUrl,
  //       };
  //     });

  //     res.status(200).json({
  //       message: "All reports fetched successfully",
  //       reports: formattedReports,
  //     });
  //   } catch (err) {
  //     console.error("Error fetching reports:", err);
  //     res.status(500).json({ message: "Failed to fetch reports" });
  //   }
  // }
}

module.exports = PTMController;
