// src/services/WhatsAppService.js

const axios = require("axios");

class WhatsAppService {
  async sendReport(mobileNumber, studentName, fileUrl) {
    const formattedNumber = `91${mobileNumber}`;

    const message = `Dear Parent,\n\nPlease find the PTM report for ${studentName} here: ${fileUrl}\n\nRegards,\nTeam`;

    await axios.post(
      "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages",
      {
        messaging_product: "whatsapp",
        to: formattedNumber,
        type: "template",
        template: {
          name: "ptm_report_template", 
          language: {
            code: "en_US", 
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: studentName,
                },
                {
                  type: "text",
                  text: "Example parameter 2",
                },
                // Add more parameters if your template needs them
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  }
}

module.exports = WhatsAppService;
