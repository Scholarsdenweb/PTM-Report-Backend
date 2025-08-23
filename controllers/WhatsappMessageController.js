// // src/controllers/WhatsappMessageController.js

const path = require("path");

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

  async handleSend(req, res) {
    try {
      const { rollNo, reportDate } = req.body;

      console.log("req.body ", req.body);
      console.log("rollNo, reportDate ", rollNo);

      if (!rollNo || !reportDate) {
        return res
          .status(400)
          .json({ message: "rollNo and reportDate are required" });
      }

      const findStudent = await Student.find({ rollNo });

      console.log("findStudent from whatsappMessageConsoller", findStudent);

      const startOfDay = new Date(reportDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(reportDate);
      endOfDay.setHours(23, 59, 59, 999);

      console.log("startDate and endDate", startOfDay, endOfDay);

      const findReportCard = await ReportCardModel.findOne({
        // student: findStudent._id,
        // reportDate: { $gte: startOfDay, $lte: endOfDay },
      });



      


    //    const reports = await ReportCardModel.aggregate([
    //         {
    //           $match: {
    //             reportDate: { $gte: dateStart, $lt: dateEnd },
    //           },
    //         },
    //         {
    //           $lookup: {
    //             from: "students", // collection name (usually lowercase plural of model)
    //             localField: "student",
    //             foreignField: "_id",
    //             as: "student",
    //           },
    //         },
    //         {
    //           $unwind: "$student",
    //         },
    //         {
    //           $match: {
    //             "student.batch": batch,
    //           },
    //         },
    //       ]);

      console.log("findReportCard", findReportCard);

      const mobileNumbers = ["7903956216"];

    //   const sendMessageOnWhatsapp = await this.whatsAppService.sendReport(
    //     mobileNumbers,
    //     findStudent.name,
    //     findReportCard.secure_url
    //   );

    //   console.log("sendMessageOnWhatsapp", sendMessageOnWhatsapp);

      const results = [];

      res.status(200).json({
        message: "Reports generated and sent successfully",
        results,
      });
    } catch (err) {
      console.error("Error in WhatsappMessageController:", err);
      res
        .status(500)
        .json({ error: "Internal server error", details: err.message });
    }
  }
}

module.exports = WhatsappMessageController;
