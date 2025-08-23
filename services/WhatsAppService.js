// src/services/WhatsAppService.js

const axios = require("axios");

class WhatsAppService {
  async sendReport(mobileNumbers, studentName, fileUrl) {
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

    // const pdfUrl =
    //   "https://res.cloudinary.com/dtytgoj3f/raw/upload/v1755693287/PTM_Document/PTM_Report/Abhijeet_Singh_2025130088.pdf";
    const pdfUrl = fileUrl;
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const message_id = 4554;

    console.log("pdfUrl", fileUrl);

    for (const mobileNumber of mobileNumbers) {
      const formattedNumber = `91${mobileNumber}`;

      const sendMessage = await axios.get(
        `https://www.fast2sms.com/dev/whatsapp?authorization=${WHATSAPP_TOKEN}&message_id=${message_id}&numbers=${formattedNumber}&variables_values=${studentName}&media_url=${pdfUrl}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("sendMessage ", sendMessage);
    }
  }
}

module.exports = WhatsAppService;
