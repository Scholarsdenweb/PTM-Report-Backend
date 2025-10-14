// src/services/ReportService.js
// const cloudinary = require('cloudinary').v2;
const puppeteer = require("puppeteer");
require("dotenv").config();
const cloudinary = require("../utils/cloudinary/cloudinarySetup.js");

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

const DELIVERY_MODE = process.env.REPORT_DELIVERY_MODE || "secure"; // 'secure' or 'public'

class ReportService {
  async generatePDF(htmlContent, pdfPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.pdf({ path: pdfPath, format: "A4" });
    await browser.close();
  }

  async uploadReport(filePath, studentName, rollNumber, ptmDate) {
    const sanitizedStudentName = studentName.replace(/[^a-z0-9_\-]/gi, "_");
    const sanitizedRollNumber = rollNumber
      .toString()
      .replace(/[^a-z0-9_\-]/gi, "_");
    const uniqueFileName = `${sanitizedStudentName}_${sanitizedRollNumber}`;
    // const uniqueFileName = `${sanitizedStudentName}_${sanitizedRollNumber}_${ptmDate}`;

    const uploadOptions = {
      folder: "PTM_Document/PTM_Report",
      public_id: uniqueFileName,
      resource_type: "raw",
      overwrite: true,
      type: DELIVERY_MODE === "secure" ? "authenticated" : "upload", // 'authenticated' for secure, 'upload' for public
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    console.log("result from cloudinary", result);

    return {
      public_id: result.public_id,
      secure_url: result.secure_url, // useful for public delivery
    };
  }

  async getReportAccessUrl(publicId, expiresInSeconds = 3600) {
    if (DELIVERY_MODE === "secure") {
      const url = cloudinary.url(publicId, {
        type: "authenticated",
        resource_type: "raw",
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
      });
      return url;
    } else {
      // Public access (already secure_url available)
      return cloudinary.url(publicId, {
        resource_type: "raw",
      });
    }
  }
}

module.exports = ReportService;
