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

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      console.log("filePath", filePath, ptmDate);
      const reportDataArray = await createReportFromExcelFile(
        filePath,
        ptmDate,
        type,
        this.reportService,
        res
      ); // returns [{ studentData, reportPath }]

      console.log("reportDateArray from handleArray", reportDataArray);

      // res.status(200).json({
      //   message: "Reports generated successfully",
      //   results: reportDataArray,
      // });
      res.end();
    } catch (error) {
      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            message: error.message,
          })}\n\n`
        );
        res.end();
      }
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
