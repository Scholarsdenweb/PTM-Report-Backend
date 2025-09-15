// // src/controllers/WhatsappMessageController.js

const path = require("path");
const mongoose = require("mongoose");

const WhatsAppService = require("../services/WhatsAppService");
const createReportFromExcelFile = require("../utils/createReportFromExcelFile");
const { removeFileFormServer } = require("../utils/removeFileFormServer");
const StudentModel = require("../models/Student");
const ReportCardModel = require("../models/ReportCard");
const Student = require("../models/Student");
const { report } = require("process");

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

  // async handleSend(req, res) {
  //   try {
  //     console.log("req.body ", req.body);

  //     const { reportIds, date: reportDate } = req.body;

  //     console.log("data from req.body", reportDate);

  //     if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
  //       return res.status(400).json({ message: "reportIds are required" });
  //     }

  //     if (!reportDate) {
  //       return res.status(400).json({ message: "reportDate is required" });
  //     }

  //     const objectIds = reportIds.map((id) => new mongoose.Types.ObjectId(id));

  //     console.log("objectIds", objectIds);

  //     const students = await Student.find({ _id: { $in: objectIds } });

  //     console.log("students found:", students);

  //     const startOfDay = new Date(reportDate);
  //     startOfDay.setHours(0, 0, 0, 0);

  //     const endOfDay = new Date(reportDate);
  //     endOfDay.setHours(23, 59, 59, 999);

  //     console.log("startDate and endDate", startOfDay, endOfDay);

  //     const results = [];

  //     console.log("StartOfDay and endOfDay", startOfDay, endOfDay);

  //     for (const student of students) {
  //       const report = await ReportCardModel.find({
  //         student: student._id,
  //         reportDate: { $gte: startOfDay, $lte: endOfDay },
  //       });

  //       if (!report || !report.secure_url) {
  //         console.warn(`No report found for student ${student.name}`);
  //         results.push({
  //           student: student.name,
  //           status: "No report found",
  //         });
  //         continue;
  //       }
  //       console.log("student from whatsmessageController", student);
  //       //  const mobileNumbers = [student.fatherContact, student.motherContact].filter(Boolean);
  //       const mobileNumbers = ["9719706242"];

  //       // const mobileNumber = student.mobile || student.whatsappNumber;

  //       console.log("mobileNumber", mobileNumbers);

  //       // if (!mobileNumber) {
  //       //   console.warn(`No mobile number found for student ${student.name}`);
  //       //   results.push({
  //       //     student: student.name,
  //       //     status: "No mobile number",
  //       //   });
  //       //   continue;
  //       // }

  //       const fileName = report.secure_url.split("/").pop();

  //       const sendResult = await this.whatsAppService.sendReport(
  //         mobileNumbers,
  //         student.name,
  //         report.secure_url,
  //         fileName
  //       );

  //       results.push({
  //         student: student.name,
  //         mobile: mobileNumbers,
  //         status: "Sent",
  //         messageId: sendResult?.messageId || null,
  //       });
  //     }

  //     res.status(200).json({
  //       message: "Reports processed",
  //       results,
  //     });
  //   } catch (err) {
  //     console.log("Error in WhatsappMessageController:", err);
  //     res.status(500).json({
  //       error: "Internal server error",
  //       details: err.message,
  //     });
  //   }
  // }

  // async handleSend(req, res) {
  //   try {
  //     console.log("req.body ", req.body);

  //     const { reportIds, params } = req.body;
  //     const reportDate = params?.date;

  //     console.log("reportDate from handleSend", reportDate);

  //     if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
  //       return res.status(400).json({ message: "reportIds are required" });
  //     }

  //     const objectIds = reportIds.map((id) => new mongoose.Types.ObjectId(id));

  //     const students = await Student.find({ _id: { $in: objectIds } });

  //     const results = [];

  //     for (const student of students) {
  //       let reports = [];

  //       if (reportDate) {
  //         const startOfDay = new Date(reportDate);
  //         startOfDay.setHours(0, 0, 0, 0);

  //         const endOfDay = new Date(reportDate);
  //         endOfDay.setHours(23, 59, 59, 999);

  //         console.log("starting and ending date", startOfDay, endOfDay);

  //         reports = await ReportCardModel.find({
  //           student: student._id,
  //           reportDate: { $gte: startOfDay, $lte: endOfDay },
  //         });
  //       } else {
  //         console.log("ReportDate is undefined");
  //         reports = await ReportCardModel.find({
  //           student: student._id,
  //         });
  //       }

  //       if (!reports.length) {
  //         console.warn(`No reports found for student ${student.name}`);
  //         results.push({
  //           student: student.name,
  //           status: "No reports found",
  //         });
  //         continue;
  //       }

  //       // You can replace this with actual contact logic
  //       const mobileNumbers = [
  //         student.fatherContact,
  //         student.motherContact,
  //       ].filter(Boolean);

  //       // const mobileNumbers = ["9719706242"]; // Or: [student.fatherContact, student.motherContact].filter(Boolean)

  //       for (const report of reports) {
  //         const fileName = report.secure_url.split("/").pop();

  //         const sendResult = await this.whatsAppService.sendReport(
  //           mobileNumbers,
  //           student.name,
  //           report.secure_url,
  //           fileName
  //         );

  //         results.push({
  //           student: student.name,
  //           mobile: mobileNumbers,
  //           status: "Sent",
  //           messageId: sendResult?.messageId || null,
  //           reportDate: report.reportDate,
  //         });
  //       }
  //     }

  //     res.status(200).json({
  //       message: "Reports processed",
  //       results,
  //     });
  //   } catch (err) {
  //     console.log("Error in WhatsappMessageController:", err);
  //     res.status(500).json({
  //       error: "Internal server error",
  //       details: err.message,
  //     });
  //   }
  // }





  async handleSend(req, res) {
  try {
    const { params } = req.body;
    const { batchId, date, rollNo } = params;

    if (!batchId && !rollNo) {
      return res.status(400).json({ message: "batchId or rollNo is required" });
    }

    const students = rollNo
      ? await Student.find({ rollNo })
      : await Student.find({ batch: batchId });

    if (!students.length) {
      return res.status(404).json({ message: "No students found" });
    }

    const startOfDay = date ? new Date(date) : null;
    const endOfDay = date ? new Date(date) : null;

    if (date) {
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay.setHours(23, 59, 59, 999);
    }

    const results = [];

    for (const student of students) {
      const reportQuery = {
        student: student._id,
      };

      if (date) {
        reportQuery.reportDate = { $gte: startOfDay, $lte: endOfDay };
      }

      const reports = await ReportCardModel.find(reportQuery);

      if (!reports.length) {
        results.push({
          student: student.name,
          status: "No reports found",
        });
        continue;
      }

      const mobileNumbers = [student.fatherContact, student.motherContact].filter(Boolean);

      for (const report of reports) {
        // Avoid duplicate sending
        const alreadySentFather = report.sendStatus?.father?.status === "sent";
        const alreadySentMother = report.sendStatus?.mother?.status === "sent";

        if (alreadySentFather && alreadySentMother) {
          results.push({
            student: student.name,
            reportId: report._id,
            status: "Already sent",
          });
          continue;
        }

        const fileName = report.secure_url.split("/").pop();

        const sendResult = await this.whatsAppService.sendReport(
          mobileNumbers,
          student.name,
          report.secure_url,
          fileName
        );

        // Update send status for each parent
        const now = new Date();

        const updatedSendStatus = {
          father: {
            status: student.fatherContact ? "sent" : "not_sent",
            number: student.fatherContact || null,
            time: student.fatherContact ? now : null,
            deliveryReport: sendResult?.number || null,
          },
          mother: {
            status: student.motherContact ? "sent" : "not_sent",
            number: student.motherContact || null,
            time: student.motherContact ? now : null,
            deliveryReport: sendResult?.number || null,
          },
        };

        report.sendStatus = updatedSendStatus;
        await report.save();

        results.push({
          student: student.name,
          reportId: report._id,
          mobile: mobileNumbers,
          status: "Sent",
          reportDate: report.reportDate,
        });
      }
    }

    return res.status(200).json({
      message: "Reports processed",
      results,
    });
  } catch (err) {
    console.error("handleSend error:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
}









}

module.exports = WhatsappMessageController;
