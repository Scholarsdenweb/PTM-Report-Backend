// // src/controllers/PTMController.js

// At the top of your file




const path = require("path");
const ExcelService = require("../services/ExcelService");
const ReportService = require("../services/ReportService");
const WhatsAppService = require("../services/WhatsAppService");
const createReportFromExcelFile = require("../utils/createReportFromExcelFile");
const { removeFileFormServer } = require("../utils/removeFileFormServer");

class PTMController {
  constructor() {
    this.excelService = new ExcelService();
    this.reportService = new ReportService();
    this.whatsAppService = new WhatsAppService();
  }



  async handleUpload(req, res) {
    try {
      const filePath = req.file.path; // Excel file path from multer

      console.log("filePath", filePath);
      const reportDataArray = await createReportFromExcelFile(filePath); // returns [{ studentData, reportPath }]

      const results = [];

      for (const data of reportDataArray) {
        const { studentData, reportPath } = data;

        console.log("StudentData", studentData);

        // const uploadedUrl = await this.reportService.uploadReport(reportPath);
        const uploadedUrl = await this.reportService.uploadReport(
          reportPath,
          studentData.name,
          studentData.rollNo
        );

        console.log("uploadedURL from handleUpload", uploadedUrl);

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

      res.status(200).json({
        message: "Reports generated successfully",
        results,
      });
    } catch (err) {
      console.error("Error in PTMController:", err);
      res
        .status(500)
        .json({ message: "An error occurred while processing reports." });
    }
  }
}

module.exports = PTMController;

// const createReportFromExcelFile = require("../utils/createReportFromExcelFile");
// const WhatsAppService = require("../services/WhatsAppService");

// module.exports = {
//   uploadPTMReport: async (req, res) => {
//     try {
//       console.log("req.file", req.file);
//       if (!req.file) {
//         return res.status(400).json({ error: "No file uploaded." });
//       }

//       const filePath = req.file.path;
//       const reportResults = await createReportFromExcelFile(filePath);

//       for (const data of reportResults) {
//         const { studentData, reportPath } = data;

//         const uploadedUrl = await ReportService.uploadReport(reportPath);

//         console.log("uploadedUrl", uploadedUrl);
//         // const mobile =
//         //   studentData.FATHER_CONTACT_NO || studentData.MOTHER_CONTACT_NO;
//         // const name = studentData.NAME;

//         // if (mobile) {
//         //   await this.whatsAppService.sendReport(mobile, name, uploadedUrl);
//         // }
//       }

//       // Optional: send reports over WhatsApp
//       // for (const report of reportResults) {
//       //   const phone = report.studentData.fatherContact || report.studentData.phone || '';
//       //   if (phone) {
//       //     await WhatsAppService.sendReport(phone, report.reportPath, report.studentData.name);
//       //   }
//       // }

//       res.status(200).json({
//         message: "Reports generated successfully",
//         results: reportResults.map((r) => ({
//           name: r.studentData.name,
//           file: r.reportPath,
//         })),
//       });
//     } catch (error) {
//       console.error("Upload error:", error);
//       res.status(500).json({ error: "Failed to process Excel file" });
//     }
//   },
// };
