// src/services/WhatsAppService.js

const axios = require("axios");

require("dotenv").config();

class WhatsAppService {
  async sendReport(mobileNumbers, studentName, fileUrl, fileName) {
    console.log("pdfUrl", fileUrl);

    const results = [];
    // const pdfUrl =
    //   "https://res.cloudinary.com/dtytgoj3f/raw/upload/v1755693287/PTM_Document/PTM_Report/Abhijeet_Singh_2025130088.pdf";

    const whatsappApi = process.env.WHATSAPP_API;


    console.log(
      "mobileNumbers , studentName, fileUrl, fileName ",
      mobileNumbers,
      studentName,
      fileUrl,
      fileName
    );

    for (const mobileNumber of mobileNumbers) {
      const formattedNumber = `91${mobileNumber}`;

      let result = {
        number: formattedNumber,
        status: "failed",
        responseCode: null,
        error: null,
      };

      console.log("mobile Number", formattedNumber);

      try {
        const sendWhatsappMessage = await axios.post(
          "https://backend.api-wa.co/campaign/myoperator/api/v2",
          {
            apiKey: `${whatsappApi}`,
            campaignName: "PTM_Report_Campaign",
            destination: formattedNumber,
            userName: "Scholars Den",
            templateParams: [studentName],
            source: "new-landing-page form",
            media: {
              url: fileUrl,
              filename: `${fileName}`,
            },
            buttons: [],
            carouselCards: [],
            location: {},
            attributes: {},
          }
        );

        result.status = "sent";
        result.responseCode = sendWhatsappMessage.status;
      } catch (error) {
        console.log("error from whatsAppservice", error);
      }
      results.push(result);

      // console.log("sendMessage ", sendWhatsappMessage);cl
    }
    return results;
  }
}

module.exports = WhatsAppService;

// For directly form meta business
// await axios.post(
//   "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages",
//   {
//     messaging_product: "whatsapp",
//     to: formattedNumber,
//     type: "template",
//     template: {
//       name: "ptm_report_template",
//       language: {
//         code: "en_US",
//       },
//       components: [
//         {
//           type: "body",
//           parameters: [
//             {
//               type: "text",
//               text: studentName,
//             },
//             {
//               type: "text",
//               text: "Example parameter 2",
//             },
//             // Add more parameters if your template needs them
//           ],
//         },
//       ],
//     },
//   },
//   {
//     headers: {
//       Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
//       "Content-Type": "application/json",
//     },
//   }
// );

// Whatsapp call for fast2sms
// const sendMessage = await axios.get(
//   `https://www.fast2sms.com/dev/whatsapp?authorization=${WHATSAPP_TOKEN}&message_id=${message_id}&numbers=${formattedNumber}&variables_values=${studentName}&media_url=${pdfUrl}`,
//   {
//     headers: {
//       "Content-Type": "application/json",
//     },
//   }
// );
