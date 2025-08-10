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
      const filePath = req?.file?.path; // Excel file path from multer
      const { ptmDate } = req.body;

      console.log("filePath", filePath, ptmDate);
      const reportDataArray = await createReportFromExcelFile(
        filePath,
        ptmDate
      ); // returns [{ studentData, reportPath }]

      const results = [];

      for (const data of reportDataArray) {
        const { studentData, reportPath } = data;

        const uploadedUrl = await this.reportService.uploadReport(
          reportPath,
          studentData.name,
          studentData.rollNo
        );

        // Upsert student
        let student = await StudentModel.findOneAndUpdate(
          { rollNo: studentData.rollNo },
          {
            name: studentData.name,
            fatherName: studentData.fatherName,
            motherName: studentData.motherName,
            batch: studentData.batch,
            fatherContactNumber:
              studentData.fatherContactNumber || studentData.FATHER_CONTACT_NO,
            motherContactNumber:
              studentData.motherContactNumber || studentData.MOTHER_CONTACT_NO,
          },
          { upsert: true, new: true }
        );

        // Create report document
        await ReportCardModel.create({
          student: student._id,
          public_id: uploadedUrl.public_id,
          secure_url: uploadedUrl.secure_url,
          reportDate: ptmDate,
        });

        results.push({
          name: studentData.name,
          rollNo: studentData.rollNo,
          cloudinaryUrl: uploadedUrl,
        });

        await removeFileFormServer(reportPath);
        // const mobile = studentData.FATHER_CONTACT_NO || studentData.MOTHER_CONTACT_NO;
        // const name = studentData.NAME;

        // if (mobile) {
        //   await this.whatsAppService.sendReport(mobile, name, uploadedUrl);
        // }
      }

      await removeFileFormServer(filePath);

      console.log("result from PTMController", results);

      res.status(200).json({
        message: "Reports generated successfully",
        results,
      });
    } catch (err) {
      console.error("Error in PTMController:", err);
      res.status(500).json({  err });
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
