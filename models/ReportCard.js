const mongoose = require("mongoose");

const reportCardSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
    secure_url: {
      type: String,
      required: true,
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },

    sendStatus: {
      type: Object,
      default: {
        father: {
          time: null,
          deliveryReport: null,
        },
        mother: {
         
          time: null,
          deliveryReport: null,
        },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Result", reportCardSchema);

// default: {
//       father: {
//         number: null,
//         status: "not_sent",
//         time: null,
//         deliveryReport: null,
//       },
//       mother: {
//         number: null,
//         status: "not_sent",
//         time: null,
//         deliveryReport: null,
//       },
//     },
