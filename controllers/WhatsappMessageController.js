// // src/controllers/WhatsappMessageController.js

const path = require("path");
const mongoose = require("mongoose");

const WhatsAppService = require("../services/WhatsAppService");
const createReportFromExcelFile = require("../utils/createReportFromExcelFile");
const { removeFileFormServer } = require("../utils/removeFileFormServer");
const StudentModel = require("../models/Student");
const ReportCardModel = require("../models/ReportCard");
const Student = require("../models/Student");

class WhatsappMessageController {
  constructor() {
    this.whatsAppService = new WhatsAppService();
  }

  //   async handleSend(req, res) {
  //     try {
  //       const {} = req.body;

  //       for (const data of reportDataArray) {
  //         const { studentData, reportPath } = data;

  //         const uploadedUrl = await this.whatsAppService.sendReport(
  //           mobileNumber, studentName, fileUrl
  //         );

  //         // Upsert student
  //         let student = await StudentModel.findOneAndUpdate(
  //           { rollNo: studentData.rollNo },
  //           {
  //             name: studentData.name,
  //             fatherName: studentData.fatherName,
  //             motherName: studentData.motherName,
  //             batch: studentData.batch,
  //             fatherContactNumber:
  //               studentData.fatherContactNumber || studentData.FATHER_CONTACT_NO,
  //             motherContactNumber:
  //               studentData.motherContactNumber || studentData.MOTHER_CONTACT_NO,
  //           },
  //           { upsert: true, new: true }
  //         );

  //         // Create report document
  //         await ReportCardModel.create({
  //           student: student._id,
  //           public_id: uploadedUrl.public_id,
  //           secure_url: uploadedUrl.secure_url,
  //           reportDate: ptmDate,
  //         });

  //         results.push({
  //           name: studentData.name,
  //           rollNo: studentData.rollNo,
  //           cloudinaryUrl: uploadedUrl,
  //         });

  //         await removeFileFormServer(reportPath);
  //         // const mobile = studentData.FATHER_CONTACT_NO || studentData.MOTHER_CONTACT_NO;
  //         // const name = studentData.NAME;

  //         // if (mobile) {
  //         //   await this.whatsAppService.sendReport(mobile, name, uploadedUrl);
  //         // }
  //       }

  //       await removeFileFormServer(filePath);

  //       console.log("result from PTMController", results);

  //       res.status(200).json({
  //         message: "Reports generated successfully",
  //         results,
  //       });
  //     } catch (err) {
  //       console.error("Error in PTMController:", err);
  //       res.status(500).json({ err });
  //     }
  //   }

  //   async handleSend(req, res) {
  //     try {
  //       console.log("req.body ", req.body);

  //       // if (!rollNo || !reportDate) {
  //       //   return res
  //       //     .status(400)
  //       //     .json({ message: "rollNo and reportDate are required" });
  //       // }

  // const { reportIds } = req.body;

  // const students = await Student.find({ _id: { $in: reportIds } });

  //       console.log("findStudent from whatsappMessageConsoller", students);

  //       const startOfDay = new Date(reportDate);
  //       startOfDay.setHours(0, 0, 0, 0);

  //       const endOfDay = new Date(reportDate);
  //       endOfDay.setHours(23, 59, 59, 999);

  //       console.log("startDate and endDate", startOfDay, endOfDay);

  //       const findReportCard = await ReportCardModel.findOne({
  //         // student: findStudent._id,
  //         // reportDate: { $gte: startOfDay, $lte: endOfDay },
  //       });

  //       //    const reports = await ReportCardModel.aggregate([
  //       //         {
  //       //           $match: {
  //       //             reportDate: { $gte: dateStart, $lt: dateEnd },
  //       //           },
  //       //         },
  //       //         {
  //       //           $lookup: {
  //       //             from: "students", // collection name (usually lowercase plural of model)
  //       //             localField: "student",
  //       //             foreignField: "_id",
  //       //             as: "student",
  //       //           },
  //       //         },
  //       //         {
  //       //           $unwind: "$student",
  //       //         },
  //       //         {
  //       //           $match: {
  //       //             "student.batch": batch,
  //       //           },
  //       //         },
  //       //       ]);

  //       console.log("findReportCard", findReportCard);
  //       console.log("findReportCard.name", findStudent[0].name);

  //       const mobileNumbers = ["9719706242"];

  //       const fileName = findReportCard.secure_url.split("/").pop();

  //       console.log("fileName", fileName);

  //       const sendMessageOnWhatsapp = await this.whatsAppService.sendReport(
  //         mobileNumbers,
  //         findStudent[0].name,
  //         findReportCard.secure_url,
  //         fileName
  //       );

  //       console.log("sendMessageOnWhatsapp", sendMessageOnWhatsapp);

  //       const results = [];

  //       res.status(200).json({
  //         message: "Reports generated and sent successfully",
  //         results,
  //       });
  //     } catch (err) {
  //       console.error("Error in WhatsappMessageController:", err);
  //       res
  //         .status(500)
  //         .json({ error: "Internal server error", details: err.message });
  //     }
  //   }

  async handleSend(req, res) {
    try {
      console.log("req.body ", req.body);

      const { reportIds, date: reportDate } = req.body;

      console.log("data from req.body", reportDate);

      if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
        return res.status(400).json({ message: "reportIds are required" });
      }

      if (!reportDate) {
        return res.status(400).json({ message: "reportDate is required" });
      }

      const objectIds = reportIds.map((id) => new mongoose.Types.ObjectId(id));

      console.log("objectIds", objectIds);

      const students = await Student.find({ _id: { $in: objectIds } });

      console.log("students found:", students);

      const startOfDay = new Date(reportDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(reportDate);
      endOfDay.setHours(23, 59, 59, 999);

      console.log("startDate and endDate", startOfDay, endOfDay);

      const results = [];

      console.log("StartOfDay and endOfDay", startOfDay, endOfDay);

      for (const student of students) {
        const report = await ReportCardModel.findOne({
          student: student._id,
          reportDate: { $gte: startOfDay, $lte: endOfDay },
        });

        if (!report || !report.secure_url) {
          console.warn(`No report found for student ${student.name}`);
          results.push({
            student: student.name,
            status: "No report found",
          });
          continue;
        }
        console.log("student from whatsmessageController", student);
       const mobileNumbers = [student.fatherContact, student.motherContact].filter(Boolean);

        // const mobileNumber = student.mobile || student.whatsappNumber;

        console.log("mobileNumber", mobileNumbers);

        // if (!mobileNumber) {
        //   console.warn(`No mobile number found for student ${student.name}`);
        //   results.push({
        //     student: student.name,
        //     status: "No mobile number",
        //   });
        //   continue;
        // }

        const fileName = report.secure_url.split("/").pop();

        const sendResult = await this.whatsAppService.sendReport(
          mobileNumbers,
          student.name,
          report.secure_url,
          fileName
        );

        results.push({
          student: student.name,
          mobile: mobileNumbers,
          status: "Sent",
          messageId: sendResult?.messageId || null,
        });
      }

      res.status(200).json({
        message: "Reports processed",
        results,
      });
    } catch (err) {
      console.log("Error in WhatsappMessageController:", err);
      res.status(500).json({
        error: "Internal server error",
        details: err.message,
      });
    }
  }
}

module.exports = WhatsappMessageController;
