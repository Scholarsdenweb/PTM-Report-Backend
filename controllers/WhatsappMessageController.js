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
      console.log(
        "Step 1 of handle function check data is available",
        req.body
      );

      const { params } = req.body;
      const { batchId, date, rollNo } = params;

      if (!batchId && !rollNo) {
        return res
          .status(400)
          .json({ message: "batchId or rollNo is required" });
      }

      const students = rollNo
        ? await Student.find({ rollNo })
        : await Student.find({ batch: batchId });

      console.log("Step 2 of check student list", students);

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

      // const testdata = [students[0]];
      // for (const student of testdata) {

      for (const student of students) {
        const reportQuery = {
          student: student._id,
        };

        if (date) {
          reportQuery.reportDate = { $gte: startOfDay, $lte: endOfDay };
        }

        console.log("Step 3 to check reportQuery", reportQuery);

        const reports = await ReportCardModel.find(reportQuery);
        console.log("Step 4 to check resports", reports);

        if (!reports.length) {
          results.push({
            student: student.name,
            status: "No reports found",
          });
          continue;
        }

        // const mobileNumbers = [
        //   student.fatherContact,
        //   student.motherContact,
        // ].filter(Boolean);

        const mobileNumbers = ["9719706242", "7037550621"];

        for (const report of reports) {
          console.log("Step 5 report details", report);
          // console.log("Step 5 report details", report.sendStatus?.father?.deliveryReport);
          // Avoid duplicate sending
          const alreadySentFather =
            report.sendStatus?.father?.deliveryReport?.status === "sent";
          const alreadySentMother =
            report.sendStatus?.mother?.deliveryReport?.status === "sent";

          if (alreadySentFather && alreadySentMother) {
            results.push({
              student: student.name,
              reportId: report._id,
              status: "Already sent",
            });
            continue;
          }

          const fileName = report.secure_url.split("/").pop();

          console.log("Data from sendResult function", [
            mobileNumbers,
            student.name,
            report.secure_url,
            fileName,
          ]);

          const sendResults = await this.whatsAppService.sendReport(
            mobileNumbers,
            student.name,
            report.secure_url,
            fileName
          );

          console.log(
            "Step 6 check data come from whatsappService",
            sendResults
          );

          // Update send status for each parent
          const now = new Date();

          // const fatherResult = sendResults.find(
          //   (r) => r.number === `919719706242`
          // );
          // const motherResult = sendResults.find(
          //   (r) => r.number === `917037550621`
          // );
          const fatherResult = sendResults.find(
            (r) => r.number === `91${student.fatherContact}`
          );
          const motherResult = sendResults.find(
            (r) => r.number === `91${student.motherContact}`
          );

          const updatedSendStatus = {
            father: {
              time: student.fatherContact ? now : null,
              deliveryReport: fatherResult || null,
            },
            mother: {
              time: student.motherContact ? now : null,
              deliveryReport: motherResult || null,
            },
          };

          console.log("STep 7 data saved in report table ", updatedSendStatus);

          report.sendStatus = updatedSendStatus;
          await report.save();

          const wasFatherSent = fatherResult?.status === "sent";
          const wasMotherSent = motherResult?.status === "sent";

          let status = "Failed";
          if (wasFatherSent || wasMotherSent) {
            status = "Partially Sent";
          }
          if (wasFatherSent && wasMotherSent) {
            status = "Sent";
          }

          results.push({
            student: student.name,
            reportId: report._id,
            mobile: mobileNumbers,
            status,
            reportDate: report.reportDate,
          });

          // results.push({
          //   student: student.name,
          //   reportId: report._id,
          //   mobile: mobileNumbers,
          //   status: "Sent",
          //   reportDate: report.reportDate,
          // });
        }
      }

      console.log("STep 8 final results", results);

      return res.status(200).json({
        message: "Reports processed",
        results,
      });
    } catch (err) {
      console.error("handleSend error:", err);
      return res
        .status(500)
        .json({ error: "Internal Server Error", details: err.message });
    }
  }

  // async sendSingleMessage(req, res) {
  //   const { rollNo, date } = req.body;

  //   console.log("rollNo date from sendSingleMessage", rollNo, date);

  //   const student = await Student.find({ rollNo });
  //   const report = await Results.find({ rollNo, date });

  //   console.log("findStudent from sendSingleMessage", findStudent);

  //   console.log("findReport from sendSigleMessage ", findReport);
  //   const fileName = report.secure_url.split("/").pop();

  //   console.log("Data from sendResult function", [
  //     mobileNumbers,
  //     student.name,
  //     report.secure_url,
  //     fileName,
  //   ]);

  //   // const sendResults = await this.whatsAppService.sendReport(
  //   //   mobileNumbers,
  //   //   student.name,
  //   //   report.secure_url,
  //   //   fileName
  //   // );

  //   // console.log("sendResults from sendSingleMessaqge ", sendResults);
  // }

  async sendSingleMessage(req, res) {
    try {
      const { rollNo, date } = req.body;

      console.log("rollNo and date from sendSingleMessage:", rollNo, date);

      if (!rollNo || !date) {
        return res.status(400).json({
          message: "rollNo and date are required",
        });
      }

      const student = await Student.findOne({ rollNo });

      if (!student) {
        return res.status(404).json({
          message: "Student not found",
        });
      }

      const reportDate = new Date(date);
      const startOfDay = new Date(reportDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(reportDate.setHours(23, 59, 59, 999));

      const report = await ReportCardModel.findOne({
        student: student._id,
        reportDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

      console.log("report from sendSingleMessage", report);

      if (!report) {
        return res.status(404).json({
          message: "Report not found for the given date",
        });
      }

      const fileName = report.secure_url.split("/").pop();
      console.log("report from sendSingleMessage", fileName);

      const mobileNumbers = ["9719706242"].filter(Boolean);
      // const mobileNumbers = [student.fatherContact, student.motherContact].filter(Boolean);

      if (!mobileNumbers.length) {
        return res.status(400).json({
          message: "No contact numbers found for the student",
        });
      }

      console.log("Sending report to:", {
        mobileNumbers,
        studentName: student.name,
        secureUrl: report.secure_url,
        fileName,
      });

      const sendResults = await this.whatsAppService.sendReport(
        mobileNumbers,
        student.name,
        report.secure_url,
        fileName
      );

      console.log("sendResults from sendSingleMessage:", sendResults);

      return res.status(200).json({
        message: "Report sent",
        student: student.name,
        reportId: report._id,
        status: sendResults,
      });
    } catch (err) {
      console.error("sendSingleMessage error:", err);
      return res.status(500).json({
        error: "Internal Server Error",
        details: err.message,
      });
    }
  }
}

module.exports = WhatsappMessageController;
