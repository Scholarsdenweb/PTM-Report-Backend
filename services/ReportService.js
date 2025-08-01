
// src/services/ReportService.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const cloudinary = require('cloudinary').v2;
require("dotenv").config();



console.log("cloud_nam process.env.CLOUDINARY_CLOUD_NAME,process.env.CLOUDINARY_API_KEY,process.env.CLOUDINARY_API_SECRET,", process.env.CLOUDINARY_CLOUD_NAME,
process.env.CLOUDINARY_API_KEY,
process.env.CLOUDINARY_API_SECRET,)

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class ReportService {
  async generatePDF(htmlContent, pdfPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.pdf({ path: pdfPath, format: 'A4' });
    await browser.close();
  }

  // async uploadReport(filePath) {
  //   const result = await cloudinary.uploader.upload(filePath, {
  //     folder: 'PTM_Document/PTM_Report',
  //     resource_type: 'raw',
  //   });
  //   return result.secure_url;
  // }


async uploadReport(filePath, studentName, rollNumber) {
  const sanitizedStudentName = studentName.replace(/[^a-z0-9_\-]/gi, '_');
  const sanitizedRollNumber = rollNumber.toString().replace(/[^a-z0-9_\-]/gi, '_');

  const uniqueFileName = `${sanitizedStudentName}_${sanitizedRollNumber}`;

  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'PTM_Document/PTM_Report',
    public_id: uniqueFileName,
    resource_type: 'raw',
    overwrite: true, 
  });

  return result.secure_url;
}


}

module.exports = ReportService;

