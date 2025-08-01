
// src/services/ReportService.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const cloudinary = require('cloudinary').v2;

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

  async uploadReport(filePath) {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'ptm_reports',
      resource_type: 'raw',
    });
    return result.secure_url;
  }
}

module.exports = ReportService;

