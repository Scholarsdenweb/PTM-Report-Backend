// // Filename: generatePerformanceReportPDF.js

// const fs = require("fs");
// const puppeteer = require("puppeteer");
// const path = require("path");

// const puppeteerCore = require("puppeteer-core");
// const chromium = require("@sparticuz/chromium-min");

// require("dotenv").config();

// const generatePerformanceReportPDF = async (data, filePath) => {
//   console.log("data form generatePerformanceReportPDF", data);
//   console.log("data.photo form generatePerformanceReportPDF", data.photo);

//   function convertScoreToPerformance(score) {
//     // console.log("Score from convertScoreToPerformance", score);
//     if (score >= 9 && score <= 10) {
//       return "Excellent";
//     } else if (score >= 7 && score < 9) {
//       return "Good";
//     } else if (score >= 5 && score < 7) {
//       return "Needs Improvement";
//     } else {
//       return "Poor";
//     }
//   }

//   function evaluateScores(total, length) {
//     // console.log("Total evaluateScores", total, length);
//     const average = total / length;

//     // console.log("average from evaluateScores", average);
//     const performance = convertScoreToPerformance(average);

//     return performance;
//   }

//   const getImageAsBase64 = (imagePath) => {
//     try {
//       // console.log("IMagePath from gewtImageAsBase64", imagePath);
//       // console.log("get image path getImageAsBase64 ", imagePath);
//       const logoPath = path.resolve(__dirname, imagePath);
//       const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });

//       return `data:image/png;base64,${logoBase64}`;
//     } catch (error) {
//       console.log("error form getimageAsBase64", error);
//       return null;
//     }
//   };

//   // console.log("data form generatePerformanceReportPDF", data);
//   // console.log("Student Data stringify: ", JSON.stringify(data.subjectWiseData));
//   // console.log("Student Data: ", data.subjectWiseData);

//   // 1. Get all available subjects from jeeMain data
//   const allPossibleSubjects = [
//     { key: "phy", label: "Phy" },
//     { key: "chem", label: "Chem" },
//     { key: "Phy", label: "Phy" },
//     { key: "Chem", label: "Chem" },
//     { key: "math", label: "Math" },
//     { key: "maths", label: "Maths" },
//     { key: "bio", label: "Bio" },
//     { key: "abs", label: "ABS" },
//     { key: "Phy(10)", label: "Phy(10)" },
//     { key: "Chem(10)", label: "Chem(10)" },
//     { key: "Bio(10)", label: "Bio(10)" },
//     { key: "Maths(25)", label: "Maths(25)" },
//     { key: "Eng(15)", label: "Eng(15)" },
//     { key: "Eng(10)", label: "Eng(10)" },
//     { key: "SST(30)", label: "SST(30)" },
//     { key: "Total(100)", label: "Total(100)" },
//     { key: "Total(120)", label: "Total(120)" },
//     { key: "Total", label: "Total" },
//   ];

//   // Check which subject keys are available in any row
//   const availableSubjects = allPossibleSubjects.filter(({ key }) =>
//     data?.jeeMain?.some((row) => row[key] !== undefined)
//   );

//   // 2. Build the dynamic table header
//   const jeeMainHeader = `
//   <tr>
//     <th>Date</th>
//     <th>Rank</th>
//     ${availableSubjects.map((sub) => `<th>${sub.label}</th>`).join("")}
//     <th>Highest Marks</th>
//   </tr>
// `;

//   //   const boardHeader = `
//   //   <tr>
//   //     <th>Date</th>
//   //     <th>Subject</th>
//   //     <th>Marks Obtained</th>

//   //     <th>Rank</th>
//   //     ${availableSubjects.map((sub) => `<th>${sub.label}</th>`).join("")}
//   //     <th>Highest Marks</th>
//   //   </tr>
//   // `;

//   // const boardResultRow = data?.boardResult
//   //   ?.map((row, i) => {
//   //     const subjectCells = availableSubjects
//   //       .map((sub) => `<td>${row[sub.key] ?? ""}</td>`)
//   //       .join("");
//   //     return `
//   //     <tr style="background: ${i % 2 === 0 ? "#f8eeda" : "#ffffff"};">
//   //       <td>${row.date || ""}</td>
//   //       <td>${subjectCells || ""}</td>

//   //       <td>${row.rank || ""}</td>
//   //       <td>${row.highest || ""}</td>
//   //     </tr>`;
//   //   })
//   //   .join("");

//   // Step: Convert boardResult object to structured rows

//   const boardHeader = `
//   <tr>
//     <th>Date</th>
//     <th>Subject</th>
//     <th>Marks Obtained</th>
//     <th>Highest Marks</th>
//     <th>Rank</th>
//   </tr>
// `;
//   const boardResultData = data?.boardResult || [];

//   // console.log("boardResultData from console", boardResultData);

//   const boardResultRow = boardResultData
//     .map(
//       (row, i) => `
//     <tr style="background: ${i % 2 === 0 ? "#f8eeda" : "#ffffff"};">
//       <td>${row.examDate || ""}</td>
//       <td>${row.subject || ""}</td>
//       <td>${row.marksObtained || ""}</td>
//       <td>${row.highestMarks || ""}</td>
//       <td>${row.rank || ""}</td>
//     </tr>
//   `
//     )
//     .join("");

//   // console.log("BoardResultRow from console", boardResultRow);

//   // 3. Build the dynamic table rows
//   const jeeMainRows = data?.jeeMain
//     ?.map((row, i) => {
//       const subjectCells = availableSubjects
//         .map((sub) => `<td>${row[sub.key] ?? ""}</td>`)
//         .join("");
//       return `
//       <tr style="background: ${i % 2 === 0 ? "#f8eeda" : "#ffffff"};">
//         <td>${row.date || ""}</td>
//         <td>${row.rank || ""}</td>
//         ${subjectCells}
//         <td>${row.highest || ""}</td>
//       </tr>`;
//     })
//     .join("");

//   // 4. Determine heading based on available subjects
//   // Decide the heading based on subject availability
//   let subject3Label = "Math"; // default
//   let heading = `<div class="section-title"><span>JEE (Main) Pattern</span></div>`;

//   // Find a row that has at least one of math, bio, or "Phy(10)"
//   const sampleRow = data?.jeeMain?.find(
//     (row) =>
//       row["Phy(10)"] !== undefined ||
//       row.math !== undefined ||
//       row.bio !== undefined
//   );

//   if (sampleRow?.["Phy(10)"] !== undefined) {
//     subject3Label = "Phy(10)";
//     heading = `<div class="section-title"><span>Objective Pattern</span></div>`;
//   } else if (sampleRow?.bio !== undefined && sampleRow?.math === undefined) {
//     subject3Label = "Bio";
//     heading = `<div class="section-title"><span>NEET(UG)</span></div>`;
//   } else if (data.subjecttivePattern.length > 0){
//     subject3Label = "Phy(29)"
//   }
//   else {
//     subject3Label = "Math";
//     heading = `<div class="section-title"><span>JEE (Main) Pattern</span></div>`;
//   }

//   const jeeAdvancedRows = data?.jeeAdv
//     ?.map(
//       (row, i) => `
//         <tr style="background: ${i % 2 === 0 ? "#f8eeda" : "#ffffff"};">

     
//             <td>${row.date}</td>
//             <td>${row.rank}</td>
//             <td>${row?.paper1?.phy}</td>
//             <td>${row?.paper1?.chem}</td>
//             <td>${row?.paper1?.maths}</td>
//             <td>${row?.paper1?.total}</td>
//             <td>${row?.paper2?.phy}</td>
//             <td>${row?.paper2?.chem}</td>
//             <td>${row?.paper2?.maths}</td>
//             <td>${row?.paper2?.total}</td>
//             <td>${row.total}</td>
//             <td>${row.highest}</td>
       
//         </tr>`
//     )
//     .join("");

//   const attendanceRows = data?.attendance
//     ?.map(
//       (row, i) => `
//         <tr style="background: ${i % 2 === 0 ? "#f8eeda" : "#ffffff"};">
//           <td>${row.month}</td>
//           <td>${row.held}</td>
//           <td>${row.present}</td>
//           <td>${row.absent}</td>
//           <td>${row.percent}</td>
//         </tr>`
//     )
//     .join("");

//   const feedbackRows = data?.feedback
//     ?.map(
//       (row, i) => `
//         <tr style="background: ${i % 2 === 0 ? "#f8eeda" : "#ffffff"};">
        
//           <td>${row.subject}</td>
//           <td>${
//             row.subject === "Total"
//               ? evaluateScores(row.response, i)
//               : convertScoreToPerformance(row.response)
//           }</td>
//           <td>${
//             row.subject === "Total"
//               ? evaluateScores(row.discipline, i)
//               : convertScoreToPerformance(row.discipline)
//           }</td>
//           <td>${
//             row.subject === "Total"
//               ? evaluateScores(row.attention, i)
//               : convertScoreToPerformance(row.attention)
//           }</td>
//           <td>${
//             row.subject === "Total"
//               ? evaluateScores(row.homework, i)
//               : convertScoreToPerformance(row.homework)
//           }</td>
//         </tr>`
//     )
//     .join("");

//   let jeeAdvancedTable = "";

//   if (data.jeeAdv?.length > 0) {
//     jeeAdvancedTable = `
//     <div class="table-container">
//         <div class="section-title"><span>JEE (Advanced) Pattern</span></div>
//     <table class="advanced-table">
//       <thead>
//         <tr>
//           <th rowspan="2">Date</th>
//           <th rowspan="2">Rank</th>
//           <th colspan="4">Paper-1</th>
//           <th colspan="4">Paper-2</th>
//           <th rowspan="2">Grand Total</th>
//           <th rowspan="2">Highest Marks</th>
//         </tr>
//         <tr>
//           <th>Phy</th>
//           <th>Chem</th>
//           <th>Math</th>
//           <th>Total</th>
//           <th>Phy</th>
//           <th>Chem</th>
//           <th>Math</th>
//           <th>Total</th>
//         </tr>
//       </thead>
//       <tbody>
//         ${jeeAdvancedRows}
//       </tbody>
//     </table>
//     </div>
//   `;
//   }

//   const subjectiveRows = data?.subjecttivePattern
//     ?.map(
//       (row, i) => `
//         <tr style="background: ${i % 2 === 0 ? "#f8eeda" : "#ffffff"};">

     
//             <td>${row.date}</td>
//             <td>${row.rank}</td>

//             <td>${row.science[`Phy(14)`] ? row.science[`Phy(14)`] : row.science[`Phy(29)`] ?  row.science[`Phy(29)`] : "-"  }</td>
//             <td>${row.science["Chem(13)"] ? row.science["Chem(13)"] : row.science["Chem(26)"] ? row.science["Chem(26)"] : "-"}</td>
//             <td>${row.science["Bio(13)"] ? row.science["Bio(13)"] : row.science["Bio(25)"] ?  row.science["Bio(25)"] : "-"}</td>
//             <td>${row.science["ScienceTotal(40)"] ? row.science["ScienceTotal(40)"] : row.science["ScienceTotal(80)"] ? row.science["ScienceTotal(80)"] : "-"}</td>
//             <td>${row.maths ? row.maths : "-"}</td>
//             <td>${row.english ? row.english : "-"}</td>
//             <td>${row.sst ? row.sst : "-"}</td>
//             <td>${row.highest ? row.highest : "-"}</td>
       
//         </tr>`
//     )
//     .join("");

//   let subjectiveTable = "";

//   if (data.subjecttivePattern?.length > 0) {
//     subjectiveTable = `
//     <div class="table-container">

//         <div class="section-title"><span>Subjective Pattern</span></div>

//     <table class="advanced-table">
//       <thead>
//         <tr>
//           <th rowspan="2">Date</th>
//           <th rowspan="2">Rank</th>
//           <th colspan="4">Science</th>
//           <th rowspan="2">Maths(20)/Maths(80)</th>
//           <th rowspan="2">English(40)</th>
//           <th rowspan="2">SST(80)</th>
//           <th rowspan="2">Highest Marks</th>
//         </tr>
//         <tr>
//           <th> Phy(14)/Phy(29) </th>
//           <th> Chem(13)/Chem(26)</th>
//           <th> Bio(13)/Bio(25)</th>
//           <th>Total(40)/Total(80)</th>

//         </tr>
//       </thead>
//       <tbody>
//         ${subjectiveRows}
//       </tbody>
//     </table>
//     </div>
//   `;
//   }

//   let showTable = "";
//   // console.log("subject3Label", subject3Label);
//   if (subject3Label === "Math") {
//     showTable = jeeAdvancedTable;
//   } else if (subject3Label === "Phy(10)") {
//     showTable = subjectiveTable;
//   } else if (subject3Label === "Phy(29)"){
//     showTable = subjectiveTable
//   }

//   const graph = `
//   <div class="table-container">

//       <div class="section-title"><span>Graph Representation</span></div>

//   <div class="charts">
//         <div class="headingAndGraph">
//           <h4>Subjectwise Highest Score </h4>
//           <div class="graph-container">
//             <canvas id="barChart" width="500" height="350"></canvas>
//           </div>
//         </div>

//         <div class="headingAndGraph">
//           <h4>Student Performance From Beginning</h4>
//           <div class="graph-container">
//             <canvas id="lineChart" width="500" height="350"></canvas>
//           </div>
//         </div>
//       </div>
//       </div>

// `;

//   const showGraph = subject3Label === "Phy(10)" ? "" : graph;

//   const htmlContent = `<!DOCTYPE html>
// <html>
//   <head>
//     <meta charset="UTF-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//     <link rel="preconnect" href="https://fonts.googleapis.com" />
//     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
//     <link
//       href="https://fonts.googleapis.com/css2?family=Hind:wght@300;400;500;600;700&display=swap"
//       rel="stylesheet"
//     />
//     <link
//       href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;700&display=swap"
//       rel="stylesheet"
//     />
//     <title>Report Card</title>
//     <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
//     <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-3d"></script>
//     <title>Student Performance Report</title>
//     <style>
//       body {
//         font-family: Roboto, sans-serif;
//         // padding: 20px;
//         color: #000;
//       }

//       .container {
//         display: flex;
//         flex-direction: column;
//         gap: 5px;
//         padding: 20px;
        

//       }

//       .header {
//         background-color: #c61d23;
//         color: white;
//         display: flex;
//         text-align: center;
//         align-items: center;
//         justify-content: space-between;
//       }

//       .header-image {
//         width: 100%;
//         height: 150px;
//       }
//       .header-text {
//         white-space: pre-line;
//         font-size: 32px;
//         font-weight: bold;
//         text-align: center;
//         display: block;
//       }

//       .student-info {
//         display: grid;
//         grid-template-columns: 1fr 3fr;
//         text-align: center;
//         align-items: center;
//       }

//       .student-info img {
//         width: 150px;
//       }
//       .photo-section {
//         background: rgb(251, 232, 203);
//         height: 100%;
//       }
//       .photo-section img {
//       margin-top: 10px;
//         width: 125px;
//         height: 125px;
//       }

//       .info-section {
//         display: flex;
//         flex-direction: column;
//         justify-content: center;
//         padding-left: 20px;
//         text-align: start;
//         background: rgb(242, 189, 83);
//         height: 100%;
//       }

//       .section-title {
//         width: 100%;
//         text-align: center;
//         font-size: 32px;
//         font-weight: bold;
//         padding-top: ${jeeMainRows.length > 3 ? "8px" : "30px"};
//         margin-bottom : ${jeeMainRows.length > 3 ? "4px" : "10px"};
//       }

//       .section-title span {
//         border-bottom: 3px solid black;
//         margin-bottom: 2px;
//       }

//       .marks-table {
//         width: 100%;
//         text-align: center;
//         font-size: 14px;
//         border-collapse: collapse;
//       }
//       .marks-table tr td,
//       .marks-table tr th,
//       table tr td,
//       table tr th {
//         border: 3px solid #e99e07ff;
//         padding: 10px;
//       }

//       .charts {
//         display: flex;
//         // margin-top: 1px;
//         justify-content: space-between;
//         page-break-inside: avoid;
//         break-inside: avoid;
//       }

  
//         .advanced-table {
//   width: 100%;
//   max-width: 100%;
//   table-layout: fixed; /* Keep this for consistent cell sizes */
//   border-collapse: collapse;
// }

// .advanced-table th,
// .advanced-table td {
//   padding: 8px;
//   text-align: center;
//   word-wrap: break-word;
//   word-break: break-word;
//   white-space: normal; /* Allows line breaks */
//   overflow-wrap: break-word;
// }





// table {
//     page-break-inside: avoid;
//     break-inside: avoid;
//   }

//   tr {
//     page-break-inside: avoid;
//     break-inside: avoid;
//   }

//   .section-container {
//     page-break-before: avoid;
//   }

//   .table-container {
//     page-break-inside: avoid;
//     break-inside: avoid;
//     margin-top: ${data.jeeAdv?.length > 0 ? "30px" : "0px"};
//     display : flex;
//     flex-direction : column;
//     gap : ${jeeMainRows.length > 3 ? "20px" : "30px"};
//   }

//       .graph-container {
//         width: 100%;
//         height: 240px;
//       }

//       .graph-container {
//         margin-bottom: 0;
//         padding-bottom: 0;
//       }
//       canvas {
//         margin: 0;
//         padding: 0;
//         display: block;
//       }
        
//       .headingAndGraph {
//         display: flex;
//         flex-direction: column;
//         justify-content: center;
//         align-items: center;
//         page-break-inside: avoid;
//         break-inside: avoid;
//         gap: 1px;
//       }

//       .headingAndGraph h4 {
//         margin-bottom: 0px;
//         padding: 0px;
//         text-align: center;
//         width: 100%;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="container">
//       <div class="header">
//         <img
//           class="header-image"
//           src="${getImageAsBase64(data.headerImage)}"
//           alt="Student Photo"
//         />
//       </div>

//       <div class="student-info">
//         <div class="photo-section">
//           <img src="${
//             data?.photo || getImageAsBase64(data.photo?.url)
//           }" alt="Student Photo" />
//           <p><strong>Name:</strong> ${data.name}</p>
//           <p><strong>Roll No.:</strong> ${data.rollNo}</p>
//         </div>
//         <div class="info-section">
//         <div>
//         <p><strong>Date </strong> ${data.ptmDate} </p>
//           <p><strong>Batch:</strong> ${data.batch}</p>
//           <p><strong>Mother's Name:</strong> ${data.motherName}</p>
//           <p><strong>Father's Name:</strong> ${data.fatherName}</p>
//           <p><strong>Batch Strength:</strong> ${data.batchStrength}</p>
//           </div>
//         </div>
//       </div>
// <div class="table-container">



// ${heading}
//       <table class="marks-table">
//         <thead>
//           <tr>
//            ${jeeMainHeader}
//           </tr>
//         </thead>
//         <tbody>
//           ${jeeMainRows}
//         </tbody>
//       </table>
//       </div>
//           ${showGraph}


       

//     </div>






//     <div class="container" style="padding: 0 0 0 0;">

//  ${showTable}


//     ${
//       boardResultRow
//         ? `
//   <div class="table-container">
//     <div class="section-title"><span>Board Result</span></div>
//     <table class="marks-table">
//       <thead>
//         ${boardHeader}
//       </thead>
//       <tbody>
//         ${boardResultRow}
//       </tbody>
//     </table>
//   </div>
// `
//         : ""
//     }



// <div class="table-container ">
//       <div class="section-title"><span>Attendance Report</span></div>
//       <table class="marks-table">
//         <thead>
//           <tr>
//             <th>Month</th>
//             <th>No. of Days Classes Held</th>
//             <th>No. of Days Present</th>
//             <th>No. of Days Absent</th>
//             <th>Attendance %age</th>
//           </tr>
//         </thead>
//         <tbody>
//           ${attendanceRows}
//         </tbody>
//       </table>
//       </div>
// <div class="table-container">

//       <div class="section-title"><span>Faculty Feedback</span></div>
//       <table class="marks-table">
//         <thead>
//           <tr>
//             <th>Subject</th>
//             <th>Class Response</th>
//             <th>Discipline</th>
//             <th>Class Attention</th>
//             <th>Home Work Completion</th>
//           </tr>
//         </thead>
//         <tbody>
//           ${feedbackRows}
//         </tbody>
//       </table>
//     </div>
//     </div>



// <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
// <script>
//   const subjectWiseData = ${JSON.stringify(data.subjectWiseData)};
//   const labels = subjectWiseData.labels;

//   const colorMap = {
//     phy: "#2f72da",
//     chem: "#c61d23",
//     maths: "#86b43b",
//     bio: "#ff9900",
//     eng: "#8e44ad",
//     sst: "#27ae60"
//   };

//   const excludeKeys = [
//     "labels", "Total", "Total(100)", "abs",
//     "Phy(10)", "Chem(10)", "Bio(10)", "Maths(25)", "Eng(15)", "SST(30)"
//   ];

//   const datasets = Object.keys(subjectWiseData)
//     .filter(key => !excludeKeys.includes(key) && subjectWiseData[key].some(v => v ))
//     .map(key => ({
//       label: getSubjectName(key),
//       data: subjectWiseData[key].map(v => v && v !== "ABS" ? Number(v) : null),
//       backgroundColor: colorMap[key.toLowerCase()],
//       borderColor: colorMap[key.toLowerCase()] ,
//       fill: false,
//       tension: 0.3
//     }));

//   if (datasets.length) {
//     const maxScore = Math.max(...datasets.flatMap(ds => ds.data.filter(v => v !== null)));

//     new Chart(document.getElementById("barChart").getContext("2d"), {
//       type: "bar",
//       data: { labels, datasets },
//       options: {
//         responsive: true,
//         scales: { y: { min: 0, max: maxScore + 10, ticks: { stepSize: 10 } } }
//       }
//     });

//     new Chart(document.getElementById("lineChart").getContext("2d"), {
//       type: "line",
//       data: { labels, datasets },
//       options: {
//         responsive: true,
//         scales: { y: { beginAtZero: true, max: maxScore + 10, ticks: { stepSize: 10 } } }
//       }
//     });
//   }

//   function getSubjectName(key) {
//     const names = {
//       phy: "Physics", chem: "Chemistry", maths: "Maths", bio: "Biology",
//       eng: "English", sst: "SST"
//     };
//     return names[key.toLowerCase()] || key;
//   }


// </script>






















//   </body>
// </html>`;
//   let browser = null;
//   try {
//     if (process.env.NODE_ENV === "production") {
//       // Configure the version based on your package.json (for your future usage).
//       const executablePath = await chromium.executablePath(
//         "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
//       );
//       browser = await puppeteerCore.launch({
//         executablePath,
//         // You can pass other configs as required
//         args: chromium.args,
//         headless: chromium.headless,
//         defaultViewport: chromium.defaultViewport,
//       });
//     } else {
//       browser = await puppeteer.launch({
//         headless: true,
//         args: ["--no-sandbox", "--disable-setuid-sandbox"],
//       });
//     }
//     const page = await browser.newPage();

//     // Set HTML content
//     await page.setContent(htmlContent, { waitUntil: "networkidle0" });

//     // Inject Chart.js from CDN
//     await page.addScriptTag({ url: "https://cdn.jsdelivr.net/npm/chart.js" });

//     await page.pdf({ path: filePath, format: "A4", printBackground: true });
//     await browser.close();
//   } catch (error) {
//     console.log("error for genaratePerformanceReeportPDF", error);
//   }
// };

// module.exports = generatePerformanceReportPDF;


























// <script>
//           window.onload = () => {
//             const labels = ${JSON.stringify(data.subjectWiseData.labels)};
//             const phyData = ${JSON.stringify(data.subjectWiseData.phy)};
//             const chemData = ${JSON.stringify(data.subjectWiseData.chem)};
//             const mathData = ${JSON.stringify(data.subjectWiseData.math)};

//             new Chart(document.getElementById("barChart").getContext("2d"), {
//               type: "bar",
//               data: {
//                 labels,
//                 datasets: [
//                   { label: "Physics", data: phyData, backgroundColor: "#2f72da" },
//                   { label: "Chemistry", data: chemData, backgroundColor: "#c61d23" },
//                   { label: "Maths", data: mathData, backgroundColor: "#86b43b" },
//                 ],
//               },
//            options: {
//     responsive: true,
//     scales: {
//       y: {
//         min: 0,
//         max: 100,
//         ticks: {
//           stepSize: 10,
//         },
//       },
//     },
//   }

//             });

//             new Chart(document.getElementById("lineChart").getContext("2d"), {
//               type: "line",
//               data: {
//                 labels,
//                 datasets: [
//                   {
//                     label: "Physics",
//                     data: phyData,
//                     borderColor: "#2f72da",
//                     backgroundColor: "#2f72da",
//                     fill: false,
//                     tension: 0.3,
//                   },
//                   {
//                     label: "Chemistry",
//                     data: chemData,
//                     borderColor: "#c61d23",
//                     backgroundColor: "#c61d23",
//                     fill: false,
//                     tension: 0.3,
//                   },
//                   {
//                     label: "Maths",
//                     data: mathData,
//                     borderColor: "#86b43b",
//                     backgroundColor: "#86b43b",
//                     fill: false,
//                     tension: 0.3,
//                   },
//                 ],
//               },
//               options: {
//                 responsive: true,
//                 scales: {
//                   y: { beginAtZero: true, max: 100, ticks: {
//           stepSize: 10,
//         }, },
//                 },
//               },
//             });
//           };
// </script>































// Filename: generatePerformanceReportPDF.js

const fs = require("fs");
const puppeteer = require("puppeteer");
const path = require("path");
const puppeteerCore = require("puppeteer-core");
const chromium = require("@sparticuz/chromium-min");
require("dotenv").config();

// ==================== UTILITY FUNCTIONS ====================

const hasValue = (value) =>
  value !== undefined && value !== null && value !== "" && value !== "-";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const displayValue = (value, fallback = "-") =>
  escapeHtml(hasValue(value) ? value : fallback);

const convertScoreToPerformance = (score) => {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return "-";
  if (numericScore >= 9 && numericScore <= 10) return "Excellent";
  if (numericScore >= 7 && numericScore < 9) return "Good";
  if (numericScore >= 5 && numericScore < 7) return "Needs Improvement";
  return "Poor";
};

const evaluateScores = (total, length) => {
  const numericTotal = Number(total);
  if (!Number.isFinite(numericTotal) || !length) return "-";
  const average = numericTotal / length;
  return convertScoreToPerformance(average);
};

const getImageAsBase64 = (imagePath) => {
  try {
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith("data:")) {
      return imagePath;
    }
    const logoPath = path.resolve(__dirname, imagePath);
    const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });
    return `data:image/png;base64,${logoBase64}`;
  } catch (error) {
    console.error("Error loading image:", error);
    return null;
  }
};

const getOptimizedCloudinaryImageUrl = (url) => {
  if (!/^https?:\/\//i.test(url) || !url.includes("/image/upload/")) {
    return url;
  }

  const transformation = "c_fill,w_420,h_420,q_auto:eco,f_jpg";
  if (url.includes(`/${transformation}/`)) return url;
  return url.replace("/image/upload/", `/image/upload/${transformation}/`);
};

const getStudentPhotoSrc = (photo) => {
  if (typeof photo === "string" && photo.trim()) {
    return getOptimizedCloudinaryImageUrl(photo);
  }
  if (photo?.url) return getOptimizedCloudinaryImageUrl(getImageAsBase64(photo.url));
  return getImageAsBase64("../assets/profileImg.png");
};

const compressStudentPhotoInPage = async (page) => {
  await page.evaluate(async () => {
    const image = document.querySelector(".photo-section img");
    if (!image) return;

    if (!image.complete) {
      await new Promise((resolve) => {
        image.onload = resolve;
        image.onerror = resolve;
      });
    }

    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    if (!naturalWidth || !naturalHeight) return;

    const maxDimension = 420;
    const scale = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight));
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    try {
      context.drawImage(image, 0, 0, width, height);
      image.src = canvas.toDataURL("image/jpeg", 0.72);
      image.width = 125;
      image.height = 125;
    } catch (error) {
      console.warn("Student photo canvas compression skipped:", error.message);
    }
  });
};

// ==================== CONFIGURATION ====================

const ALL_POSSIBLE_SUBJECTS = [
  { key: "phy", label: "Phy" },
  { key: "chem", label: "Chem" },
  { key: "Phy", label: "Phy" },
  { key: "Chem", label: "Chem" },
  { key: "math", label: "Math" },
  { key: "maths", label: "Maths" },
  { key: "bio", label: "Bio" },
  { key: "abs", label: "ABS" },
  { key: "Phy(10)", label: "Phy(10)" },
  { key: "Chem(10)", label: "Chem(10)" },
  { key: "Bio(10)", label: "Bio(10)" },
  { key: "Maths(25)", label: "Maths(25)" },
  { key: "Eng(15)", label: "Eng(15)" },
  { key: "Eng(10)", label: "Eng(10)" },
  { key: "SST(30)", label: "SST(30)" },
  { key: "Total(100)", label: "Total(100)" },
  { key: "Total(120)", label: "Total(120)" },
  { key: "Total", label: "Total" },
];

// ==================== SECTION BUILDERS ====================

const buildDynamicTable = (data, columns, rowBuilder, options = {}) => {
  if (!data || data.length === 0) return null;

  const { stripedRows = true } = options;
  
  const headerRow = `<tr>${columns.map(col => `<th${col.rowspan ? ` rowspan="${col.rowspan}"` : ''}${col.colspan ? ` colspan="${col.colspan}"` : ''}>${escapeHtml(col.label)}</th>`).join('')}</tr>`;
  
  const bodyRows = data.map((row, i) => {
    const bgColor = stripedRows && i % 2 === 0 ? "#f8eeda" : "#ffffff";
    return `<tr style="background: ${bgColor};">${rowBuilder(row)}</tr>`;
  }).join('');

  return { headerRow, bodyRows };
};

const buildJeeMainSection = (data) => {
  if (!data?.jeeMain || data.jeeMain.length === 0) return null;

  const preferredSubjects = ALL_POSSIBLE_SUBJECTS.filter(({ key }) =>
    data.jeeMain.some((row) => hasValue(row[key]))
  );
  const preferredKeys = new Set(preferredSubjects.map((subject) => subject.key));
  const extraSubjects = Array.from(
    new Set(
      data.jeeMain.flatMap((row) =>
        Object.keys(row).filter(
          (key) =>
            !["date", "rank", "highest"].includes(key) &&
            !preferredKeys.has(key) &&
            data.jeeMain.some((item) => hasValue(item[key]))
        )
      )
    )
  ).map((key) => ({ key, label: key }));

  const availableSubjects = [...preferredSubjects, ...extraSubjects];

  const columns = [
    { label: "Date" },
    { label: "Rank" },
    ...availableSubjects.map(sub => ({ label: sub.label })),
    { label: "Highest Marks" }
  ];

  const rowBuilder = (row) => {
    const subjectCells = availableSubjects.map((sub) => `<td>${displayValue(row[sub.key])}</td>`).join("");
    return `<td>${displayValue(row.date)}</td><td>${displayValue(row.rank)}</td>${subjectCells}<td>${displayValue(row.highest)}</td>`;
  };

  // Determine pattern heading
  let heading = "JEE (Main) Pattern";
  const sampleRow = data.jeeMain.find(row => 
    row["Phy(10)"] !== undefined || row.math !== undefined || row.bio !== undefined
  );

  if (sampleRow?.["Phy(10)"] !== undefined) {
    heading = "Objective Pattern";
  } else if (sampleRow?.bio !== undefined && sampleRow?.math === undefined) {
    heading = "NEET(UG)";
  } else if (data.subjecttivePattern?.length > 0) {
    heading = "JEE (Main) Pattern";
  }

  const table = buildDynamicTable(data.jeeMain, columns, rowBuilder);
  
  return { heading, table, availableSubjects };
};

const buildJeeAdvancedSection = (data) => {
  if (!data?.jeeAdv || data.jeeAdv.length === 0) return null;

  const columns = [
    { label: "Date", rowspan: 2 },
    { label: "Rank", rowspan: 2 },
    { label: "Paper-1", colspan: 4 },
    { label: "Paper-2", colspan: 4 },
    { label: "Grand Total", rowspan: 2 },
    { label: "Highest Marks", rowspan: 2 }
  ];

  const subColumns = [
    { label: "Phy" },
    { label: "Chem" },
    { label: "Math" },
    { label: "Total" },
    { label: "Phy" },
    { label: "Chem" },
    { label: "Math" },
    { label: "Total" }
  ];

  const rowBuilder = (row) => `
    <td>${displayValue(row.date)}</td>
    <td>${displayValue(row.rank)}</td>
    <td>${displayValue(row?.paper1?.phy)}</td>
    <td>${displayValue(row?.paper1?.chem)}</td>
    <td>${displayValue(row?.paper1?.maths)}</td>
    <td>${displayValue(row?.paper1?.total)}</td>
    <td>${displayValue(row?.paper2?.phy)}</td>
    <td>${displayValue(row?.paper2?.chem)}</td>
    <td>${displayValue(row?.paper2?.maths)}</td>
    <td>${displayValue(row?.paper2?.total)}</td>
    <td>${displayValue(row.total)}</td>
    <td>${displayValue(row.highest)}</td>
  `;

  const headerRow = `
    <tr>${columns.map(col => `<th${col.rowspan ? ` rowspan="${col.rowspan}"` : ''}${col.colspan ? ` colspan="${col.colspan}"` : ''}>${escapeHtml(col.label)}</th>`).join('')}</tr>
    <tr>${subColumns.map(col => `<th>${escapeHtml(col.label)}</th>`).join('')}</tr>
  `;

  const bodyRows = data.jeeAdv.map((row, i) => {
    const bgColor = i % 2 === 0 ? "#f8eeda" : "#ffffff";
    return `<tr style="background: ${bgColor};">${rowBuilder(row)}</tr>`;
  }).join('');

  return { headerRow, bodyRows };
};

const buildSubjectiveSection = (data) => {
  if (!data?.subjecttivePattern || data.subjecttivePattern.length === 0) return null;

  const scienceKeys = Array.from(
    new Set(
      data.subjecttivePattern.flatMap((row) =>
        Object.keys(row.science || {}).filter((key) =>
          data.subjecttivePattern.some((item) => hasValue(item.science?.[key]))
        )
      )
    )
  );

  const extraColumns = [
    { key: "maths", label: data.subjecttivePattern.find((row) => row.mathsLabel)?.mathsLabel || "Maths" },
    { key: "english", label: data.subjecttivePattern.find((row) => row.englishLabel)?.englishLabel || "English" },
    { key: "sst", label: data.subjecttivePattern.find((row) => row.sstLabel)?.sstLabel || "SST" },
  ].filter((column) => data.subjecttivePattern.some((row) => hasValue(row[column.key])));

  const columns = [
    { label: "Date", rowspan: 2 },
    { label: "Rank", rowspan: 2 },
    ...(scienceKeys.length ? [{ label: "Science", colspan: scienceKeys.length }] : []),
    ...extraColumns.map((column) => ({ label: column.label, rowspan: 2 })),
    { label: "Highest Marks", rowspan: 2 }
  ];

  const subColumns = scienceKeys.map((key) => ({ label: key.replace("ScienceTotal", "Total") }));

  const rowBuilder = (row) => `
    <td>${displayValue(row.date)}</td>
    <td>${displayValue(row.rank)}</td>
    ${scienceKeys.map((key) => `<td>${displayValue(row.science?.[key])}</td>`).join("")}
    ${extraColumns.map((column) => `<td>${displayValue(row[column.key])}</td>`).join("")}
    <td>${displayValue(row.highest)}</td>
  `;

  const headerRow = `
    <tr>${columns.map(col => `<th${col.rowspan ? ` rowspan="${col.rowspan}"` : ''}${col.colspan ? ` colspan="${col.colspan}"` : ''}>${escapeHtml(col.label)}</th>`).join('')}</tr>
    ${subColumns.length ? `<tr>${subColumns.map(col => `<th>${escapeHtml(col.label)}</th>`).join('')}</tr>` : ""}
  `;

  const bodyRows = data.subjecttivePattern.map((row, i) => {
    const bgColor = i % 2 === 0 ? "#f8eeda" : "#ffffff";
    return `<tr style="background: ${bgColor};">${rowBuilder(row)}</tr>`;
  }).join('');

  return { headerRow, bodyRows };
};

const buildBoardResultSection = (data) => {
  if (!data?.boardResult || data.boardResult.length === 0) return null;

  const columns = [
    { label: "Date" },
    { label: "Subject" },
    { label: "Marks Obtained" },
    { label: "Highest Marks" },
    { label: "Rank" }
  ];

  const rowBuilder = (row) => `
    <td>${displayValue(row.examDate)}</td>
    <td>${displayValue(row.subject)}</td>
    <td>${displayValue(row.marksObtained)}</td>
    <td>${displayValue(row.highestMarks)}</td>
    <td>${displayValue(row.rank)}</td>
  `;

  return buildDynamicTable(data.boardResult, columns, rowBuilder);
};

const buildAttendanceSection = (data) => {
  if (!data?.attendance || data.attendance.length === 0) return null;

  const columns = [
    { label: "Month" },
    { label: "No. of Days Classes Held" },
    { label: "No. of Days Present" },
    { label: "No. of Days Absent" },
    { label: "Attendance %age" }
  ];

  const rowBuilder = (row) => `
    <td>${displayValue(row.month)}</td>
    <td>${displayValue(row.held)}</td>
    <td>${displayValue(row.present)}</td>
    <td>${displayValue(row.absent)}</td>
    <td>${displayValue(row.percent)}</td>
  `;

  return buildDynamicTable(data.attendance, columns, rowBuilder);
};

const buildFeedbackSection = (data) => {
  if (!data?.feedback || data.feedback.length === 0) return null;

  const columns = [
    { label: "Subject" },
    { label: "Class Response" },
    { label: "Discipline" },
    { label: "Class Attention" },
    { label: "Home Work Completion" }
  ];

  const rowBuilder = (row, index) => {
    const isTotal = row.subject === "Total";
    return `
      <td>${displayValue(row.subject)}</td>
      <td>${isTotal ? evaluateScores(row.response, index) : convertScoreToPerformance(row.response)}</td>
      <td>${isTotal ? evaluateScores(row.discipline, index) : convertScoreToPerformance(row.discipline)}</td>
      <td>${isTotal ? evaluateScores(row.attention, index) : convertScoreToPerformance(row.attention)}</td>
      <td>${isTotal ? evaluateScores(row.homework, index) : convertScoreToPerformance(row.homework)}</td>
    `;
  };

  const headerRow = `<tr>${columns.map(col => `<th>${escapeHtml(col.label)}</th>`).join('')}</tr>`;
  const bodyRows = data.feedback.map((row, i) => {
    const bgColor = i % 2 === 0 ? "#f8eeda" : "#ffffff";
    return `<tr style="background: ${bgColor};">${rowBuilder(row, i)}</tr>`;
  }).join('');

  return { headerRow, bodyRows };
};

// ==================== HTML TEMPLATE BUILDER ====================

const buildHTMLTemplate = (data, sections) => {
  const { jeeMain, jeeAdvanced, subjective, boardResult, attendance, feedback } = sections;
  const graphExcludedKeys = new Set([
    "labels",
    "Total",
    "Total(100)",
    "Total(120)",
    "abs",
    "Phy(10)",
    "Chem(10)",
    "Bio(10)",
    "Maths(25)",
    "Eng(15)",
    "Eng(10)",
    "SST(30)",
  ]);
  const hasNumericGraphData = Object.entries(data.subjectWiseData || {}).some(
    ([key, values]) =>
      !graphExcludedKeys.has(key) &&
      Array.isArray(values) &&
      values.some((value) => Number.isFinite(Number(value)))
  );
  const hasGraph = jeeMain && !jeeMain.heading.includes("Objective") && hasNumericGraphData;
  const jeeMainRowCount = data?.jeeMain?.length || 0;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;700&display=swap" rel="stylesheet" />
  <title>Performance Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: Roboto, sans-serif;
      color: #000;
      margin: 0;
      padding: 0;
    }

    .container {
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 20px;
    }

    .header {
      background-color: #c61d23;
      color: white;
      display: flex;
      text-align: center;
      align-items: center;
      justify-content: space-between;
    }

    .header-image {
      width: 100%;
      height: 150px;
    }

    .student-info {
      display: grid;
      grid-template-columns: 1fr 3fr;
      text-align: center;
      align-items: stretch;
    }

    .photo-section {
      background: rgb(251, 232, 203);
      height: 100%;
      min-height: 190px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px 10px;
    }

    .photo-section img {
      width: 125px;
      height: 125px;
      object-fit: cover;
      margin-bottom: 6px;
      flex: 0 0 auto;
    }

    .photo-section p {
      margin: 3px 0;
      line-height: 1.2;
    }

    .info-section {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 8px 0 8px 20px;
      text-align: start;
      background: rgb(242, 189, 83);
      height: 100%;
      min-height: 190px;
      box-sizing: border-box;
    }

    .info-section p {
      margin: 8px 0;
    }

    .section-title {
      width: 100%;
      text-align: center;
      font-size: 32px;
      font-weight: bold;
      padding-top: ${jeeMainRowCount > 3 ? "8px" : "30px"};
      margin-bottom: ${jeeMainRowCount > 3 ? "4px" : "10px"};
    }

    .section-title span {
      border-bottom: 3px solid black;
    }

    .marks-table, .advanced-table {
      width: 100%;
      text-align: center;
      font-size: 14px;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .marks-table tr td,
    .marks-table tr th,
    .advanced-table tr td,
    .advanced-table tr th {
      border: 3px solid #e99e07ff;
      padding: 10px;
      word-wrap: break-word;
      word-break: break-word;
      white-space: normal;
      overflow-wrap: break-word;
    }

    .table-container {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-top: ${data.jeeAdv?.length > 0 ? "30px" : "0px"};
      display: flex;
      flex-direction: column;
      gap: ${jeeMainRowCount > 3 ? "20px" : "30px"};
    }

    .charts {
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .graph-container {
      width: 100%;
      height: 240px;
    }

    .headingAndGraph {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      page-break-inside: avoid;
      break-inside: avoid;
      gap: 1px;
    }

    .headingAndGraph h4 {
      margin-bottom: 0px;
      padding: 0px;
      text-align: center;
      width: 100%;
    }

    table {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img class="header-image" src="${getImageAsBase64(data.headerImage)}" alt="Header" />
    </div>

    <div class="student-info">
      <div class="photo-section">
        <img src="${getStudentPhotoSrc(data?.photo)}" alt="Student Photo" />
        <p><strong>Name:</strong> ${displayValue(data.name)}</p>
        <p><strong>Roll No.:</strong> ${displayValue(data.rollNo)}</p>
      </div>
      <div class="info-section">
        <div>
          <p><strong>Date:</strong> ${displayValue(data.ptmDate)}</p>
          <p><strong>Batch:</strong> ${displayValue(data.batch)}</p>
          <p><strong>Mother's Name:</strong> ${displayValue(data.motherName)}</p>
          <p><strong>Father's Name:</strong> ${displayValue(data.fatherName)}</p>
          <p><strong>Batch Strength:</strong> ${displayValue(data.batchStrength)}</p>
        </div>
      </div>
    </div>

    ${jeeMain ? `
    <div class="table-container">
      <div class="section-title"><span>${jeeMain.heading}</span></div>
      <table class="marks-table">
        <thead>${jeeMain.table.headerRow}</thead>
        <tbody>${jeeMain.table.bodyRows}</tbody>
      </table>
    </div>
    ` : ''}

    ${hasGraph ? `
    <div class="table-container">
      <div class="section-title"><span>Graph Representation</span></div>
      <div class="charts">
        <div class="headingAndGraph">
          <h4>Subjectwise Highest Score</h4>
          <div class="graph-container">
            <canvas id="barChart" width="500" height="350"></canvas>
          </div>
        </div>
        <div class="headingAndGraph">
          <h4>Student Performance From Beginning</h4>
          <div class="graph-container">
            <canvas id="lineChart" width="500" height="350"></canvas>
          </div>
        </div>
      </div>
    </div>
    ` : ''}
  </div>

  <div class="container" style="padding: 0;">
    ${jeeAdvanced ? `
    <div class="table-container">
      <div class="section-title"><span>JEE (Advanced) Pattern</span></div>
      <table class="advanced-table">
        <thead>${jeeAdvanced.headerRow}</thead>
        <tbody>${jeeAdvanced.bodyRows}</tbody>
      </table>
    </div>
    ` : ''}

    ${subjective ? `
    <div class="table-container">
      <div class="section-title"><span>Subjective Pattern</span></div>
      <table class="advanced-table">
        <thead>${subjective.headerRow}</thead>
        <tbody>${subjective.bodyRows}</tbody>
      </table>
    </div>
    ` : ''}

    ${boardResult ? `
    <div class="table-container">
      <div class="section-title"><span>Board Result</span></div>
      <table class="marks-table">
        <thead>${boardResult.headerRow}</thead>
        <tbody>${boardResult.bodyRows}</tbody>
      </table>
    </div>
    ` : ''}

    ${attendance ? `
    <div class="table-container">
      <div class="section-title"><span>Attendance Report</span></div>
      <table class="marks-table">
        <thead>${attendance.headerRow}</thead>
        <tbody>${attendance.bodyRows}</tbody>
      </table>
    </div>
    ` : ''}

    ${feedback ? `
    <div class="table-container">
      <div class="section-title"><span>Faculty Feedback</span></div>
      <table class="marks-table">
        <thead>${feedback.headerRow}</thead>
        <tbody>${feedback.bodyRows}</tbody>
      </table>
    </div>
    ` : ''}
  </div>

  ${hasGraph ? `
  <script>
    const subjectWiseData = ${JSON.stringify(data.subjectWiseData)};
    const labels = subjectWiseData.labels;

    const colorMap = {
      phy: "#2f72da",
      chem: "#c61d23",
      maths: "#86b43b",
      bio: "#ff9900",
      eng: "#8e44ad",
      sst: "#27ae60"
    };

    const excludeKeys = [
      "labels", "Total", "Total(100)", "abs",
      "Phy(10)", "Chem(10)", "Bio(10)", "Maths(25)", "Eng(15)", "SST(30)"
    ];

    const datasets = Object.keys(subjectWiseData)
      .filter(key => !excludeKeys.includes(key) && subjectWiseData[key].some(v => Number.isFinite(Number(v))))
      .map((key, index) => {
        const fallbackColors = ["#2f72da", "#c61d23", "#86b43b", "#ff9900", "#8e44ad", "#27ae60", "#34495e"];
        const color = colorMap[key.toLowerCase()] || fallbackColors[index % fallbackColors.length];
        return {
          label: getSubjectName(key),
          data: subjectWiseData[key].map(v => Number.isFinite(Number(v)) ? Number(v) : null),
          backgroundColor: color,
          borderColor: color,
          fill: false,
          tension: 0.3
        };
      });

    if (datasets.length) {
      const maxScore = Math.max(...datasets.flatMap(ds => ds.data.filter(v => v !== null)));

      new Chart(document.getElementById("barChart").getContext("2d"), {
        type: "bar",
        data: { labels, datasets },
        options: {
          responsive: true,
          scales: { y: { min: 0, max: maxScore + 10, ticks: { stepSize: 10 } } }
        }
      });

      new Chart(document.getElementById("lineChart").getContext("2d"), {
        type: "line",
        data: { labels, datasets },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true, max: maxScore + 10, ticks: { stepSize: 10 } } }
        }
      });
    }

    function getSubjectName(key) {
      const names = {
        phy: "Physics", chem: "Chemistry", maths: "Maths", bio: "Biology",
        eng: "English", sst: "SST"
      };
      return names[key.toLowerCase()] || key;
    }
  </script>
  ` : ''}
</body>
</html>`;
};

// ==================== MAIN FUNCTION ====================

const generatePerformanceReportPDF = async (data, filePath) => {
  console.log("Generating performance report PDF...");

  // Build all sections
  const sections = {
    jeeMain: buildJeeMainSection(data),
    jeeAdvanced: buildJeeAdvancedSection(data),
    subjective: buildSubjectiveSection(data),
    boardResult: buildBoardResultSection(data),
    attendance: buildAttendanceSection(data),
    feedback: buildFeedbackSection(data)
  };

  // Build HTML
  const htmlContent = buildHTMLTemplate(data, sections);

  // Generate PDF
  let browser = null;
  try {
    if (process.env.NODE_ENV === "production") {
      const executablePath = await chromium.executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
      );
      browser = await puppeteerCore.launch({
        executablePath,
        args: [
          ...chromium.args,
          "--disable-crash-reporter",
          "--disable-crashpad",
          "--disable-dev-shm-usage",
        ],
        headless: chromium.headless,
        defaultViewport: chromium.defaultViewport,
      });
    } else {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-crash-reporter",
          "--disable-crashpad",
          "--disable-dev-shm-usage",
        ],
      });
    }

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await compressStudentPhotoInPage(page);
    await page.addScriptTag({ url: "https://cdn.jsdelivr.net/npm/chart.js" });
    await page.pdf({ path: filePath, format: "A4", printBackground: true });
    await browser.close();

    console.log("PDF generated successfully!");
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (browser) await browser.close();
    throw error;
  }
};

module.exports = generatePerformanceReportPDF;
