// Filename: generatePerformanceReportPDF.js

const fs = require("fs");
const puppeteer = require("puppeteer");
const path = require("path");

const puppeteerCore = require("puppeteer-core");
const chromium = require("@sparticuz/chromium-min");

require("dotenv").config();

const generatePerformanceReportPDF = async (data, filePath) => {
  console.log("data form generatePerformanceReportPDF", data);

  const getImageAsBase64 = (imagePath) => {
    try {
      const logoPath = path.resolve(__dirname, imagePath);
      const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });

      return `data:image/png;base64,${logoBase64}`;
    } catch (error) {
      return null;
    }
  };

  // 1. Get all available subjects from jeeMain data
  const allPossibleSubjects = [
    { key: "phy", label: "Phy" },
    { key: "chem", label: "Chem" },
    { key: "math", label: "Math" },
    { key: "bio", label: "Bio" },
    { key: "abs", label: "ABS" },
    { key: "Phy(10)", label: "Phy(10)" },
    { key: "Chem(10)", label: "Chem(10)" },
    { key: "Bio(10)", label: "Bio(10)" },
    { key: "Maths(25)", label: "Maths(25)" },
    { key: "Eng(15)", label: "Eng(15)" },
    { key: "SST(30)", label: "SST(30)" },
    { key: "Total(100)", label: "Total(100)" },
    { key: "Total", label: "Total" },
  ];

  // Check which subject keys are available in any row
  const availableSubjects = allPossibleSubjects.filter(({ key }) =>
    data?.jeeMain?.some((row) => row[key] !== undefined)
  );

  // 2. Build the dynamic table header
  const jeeMainHeader = `
  <tr>
    <th>Date</th>
    <th>Rank</th>
    ${availableSubjects.map((sub) => `<th>${sub.label}</th>`).join("")}
    <th>Highest</th>
  </tr>
`;

  // 3. Build the dynamic table rows
  const jeeMainRows = data?.jeeMain
    ?.map((row, i) => {
      const subjectCells = availableSubjects
        .map((sub) => `<td>${row[sub.key] ?? ""}</td>`)
        .join("");
      return `
      <tr style="background: ${i % 2 === 0 ? "#f8eeda" : "#ffffff"};">
        <td>${row.date || ""}</td>
        <td>${row.rank || ""}</td>
        ${subjectCells}
        <td>${row.highest || ""}</td>
      </tr>`;
    })
    .join("");

  // 4. Determine heading based on available subjects
  // Decide the heading based on subject availability
  let subject3Label = "Math"; // default
  let heading = `<div class="section-title"><span>JEE (Main) Pattern</span></div>`;

  // Find a row that has at least one of math, bio, or "Phy(10)"
  const sampleRow = data?.jeeMain?.find(
    (row) =>
      row["Phy(10)"] !== undefined ||
      row.math !== undefined ||
      row.bio !== undefined
  );

  if (sampleRow?.["Phy(10)"] !== undefined) {
    subject3Label = "Phy(10)";
    heading = `<div class="section-title"><span>Objective Pattern</span></div>`;
  } else if (sampleRow?.bio !== undefined && sampleRow?.math === undefined) {
    subject3Label = "Bio";
    heading = `<div class="section-title"><span>NEET(UG)</span></div>`;
  } else {
    subject3Label = "Math";
    heading = `<div class="section-title"><span>JEE (Main) Pattern</span></div>`;
  }

  const jeeAdvancedRows = data?.jeeAdv
    ?.map(
      (row, i) => `
        <tr style="background: ${i % 2 === 0 ? "#f8eeda" : "#ffffff"};">

     
            <td>${row.date}</td>
            <td>${row.rank}</td>
            <td>${row?.paper1?.phy}</td>
            <td>${row?.paper1?.chem}</td>
            <td>${row?.paper1?.maths}</td>
            <td>${row?.paper1?.total}</td>
            <td>${row?.paper2?.phy}</td>
            <td>${row?.paper2?.chem}</td>
            <td>${row?.paper2?.maths}</td>
            <td>${row?.paper2?.total}</td>
            <td>${row.total}</td>
            <td>${row.highest}</td>
       
        </tr>`
    )
    .join("");

  const attendanceRows = data?.attendance
    ?.map(
      (row, i) => `
        <tr style="background: ${i % 2 === 0 ? "#f8eeda" : "#ffffff"};">
          <td>${row.month}</td>
          <td>${row.held}</td>
          <td>${row.present}</td>
          <td>${row.absent}</td>
          <td>${row.percent}</td>
        </tr>`
    )
    .join("");

  const feedbackRows = data?.feedback
    ?.map(
      (row, i) => `
        <tr style="background: ${i % 2 === 0 ? "#f8eeda" : "#ffffff"};">
        
          <td>${row.subject}</td>
          <td>${row.response}</td>
          <td>${row.discipline}</td>
          <td>${row.attention}</td>
          <td>${row.homework}</td>
        </tr>`
    )
    .join("");

  let jeeAdvancedTable = "";

  if (data.jeeAdv?.length > 0) {
    jeeAdvancedTable = `
    <div class="table-container">

        <div class="section-title"><span>JEE (Advanced) Pattern</span></div>

    <table class="advanced-table">
      <thead>
        <tr>
          <th rowspan="2">Date</th>
          <th rowspan="2">Rank</th>
          <th colspan="4">Paper-1</th>
          <th colspan="4">Paper-2</th>
          <th rowspan="2">Grand Total</th>
          <th rowspan="2">Highest</th>
        </tr>
        <tr>
          <th>Phy</th>
          <th>Chem</th>
          <th>Math</th>
          <th>Total</th>
          <th>Phy</th>
          <th>Chem</th>
          <th>Math</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${jeeAdvancedRows}
      </tbody>
    </table>
    </div>
  `;
  }

  const subjectiveRows = data?.subjecttivePattern
    ?.map(
      (row, i) => `
        <tr style="background: ${i % 2 === 0 ? "#f8eeda" : "#ffffff"};">

     
            <td>${row.date}</td>
            <td>${row.rank}</td>
            <td>${row.science[`Phy(14)`]}</td>
            <td>${row.science["Chem(13)"]}</td>
            <td>${row.science["Bio(13)"]}</td>
            <td>${row.science["ScienceTotal(40)"]}</td>
          
            <td>${row.maths}</td>
            <td>${row.highest}</td>
       
        </tr>`
    )
    .join("");

  let subjectiveTable = "";

  if (data.subjecttivePattern?.length > 0) {
    subjectiveTable = `
    <div class="table-container">

        <div class="section-title"><span>Subjective Pattern</span></div>

    <table class="advanced-table">
      <thead>
        <tr>
          <th rowspan="2">Date</th>
          <th rowspan="2">Rank</th>
          <th colspan="4">Science</th>
          <th rowspan="2">Maths(20)</th>
          <th rowspan="2">Highest</th>
        </tr>
        <tr>
          <th>Phy(14)</th>
          <th>Chem(13)</th>
          <th>Bio(13)</th>
          <th>Total(20)</th>
         
        </tr>
      </thead>
      <tbody>
        ${subjectiveRows}
      </tbody>
    </table>
    </div>
  `;
  }

  let showTable = "";
  console.log("subject3Label", subject3Label);
  if (subject3Label === "Math") {
    showTable = jeeAdvancedTable;
  } else if (subject3Label === "Phy(10)") {
    showTable = subjectiveTable;
  }

  const graph = `
  <div class="table-container">

      <div class="section-title"><span>Graph Representation</span></div>

  <div class="charts">
        <div class="headingAndGraph">
          <h4>Subjectwise Highest Score </h4>
          <div class="graph-container">
            <canvas id="barChart" width="500" height="350"></canvas>
          </div>
        </div>

        <div class="headingAndGraph">
          <h4>Student performance from beginning</h4>
          <div class="graph-container">
            <canvas id="lineChart" width="500" height="350"></canvas>
          </div>
        </div>
      </div>
      </div>

`;

  const showGraph = subject3Label === "Phy(10)" ? "" : graph;

  const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Hind:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;700&display=swap"
      rel="stylesheet"
    />
    <title>Report Card</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-3d"></script>
    <title>Student Performance Report</title>
    <style>
      body {
        font-family: Roboto, sans-serif;
        // padding: 20px;
        color: #000;
      }

      .container {
        display: flex;
        flex-direction: column;
        gap: 10px;
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
      .header-text {
        white-space: pre-line;
        font-size: 32px;
        font-weight: bold;
        text-align: center;
        display: block;
      }

      .student-info {
        display: grid;
        grid-template-columns: 1fr 3fr;
        text-align: center;
        align-items: center;
      }

      .student-info img {
        width: 150px;
      }
      .photo-section {
        background: rgb(251, 232, 203);
        height: 100%;
      }

      .info-section {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding-left: 20px;
        text-align: start;
        background: rgb(242, 189, 83);
        height: 100%;
      }

      .section-title {
        width: 100%;
        text-align: center;
        font-size: 32px;
        font-weight: bold;
        padding-top: ${jeeMainRows.length > 3 ? "10px" : "30px"};
        margin-bottom : ${jeeMainRows.length > 3 ? "5px" : "20px"};;
      }

      .section-title span {
        border-bottom: 3px solid black;
        margin-bottom: 4px;
      }

      .marks-table {
        width: 100%;
        text-align: center;
        font-size: 14px;
        border-collapse: collapse;
      }
      .marks-table tr td,
      .marks-table tr th,
      table tr td,
      table tr th {
        border: 3px solid #e99e07ff;
        padding: 10px;
      }

      .charts {
        display: flex;
        margin-top: 1px;
        justify-content: space-between;
        page-break-inside: avoid;
        break-inside: avoid;
      }

  
        .advanced-table {
  width: 100%;
  max-width: 100%;
  table-layout: fixed; /* Keep this for consistent cell sizes */
  border-collapse: collapse;
}

.advanced-table th,
.advanced-table td {
  padding: 8px;
  text-align: center;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal; /* Allows line breaks */
  overflow-wrap: break-word;
}





table {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .section-container {
    page-break-before: avoid;
  }

  .table-container {
    page-break-inside: avoid;
    break-inside: avoid;
    display : flex;
    flex-direction : column;
    gap : ${jeeMainRows.length > 3 ? "20px" : "30px"};
  }

      .graph-container {
        width: 100%;
        height: 250px;
      }

      .graph-container {
        margin-bottom: 0;
        padding-bottom: 0;
      }
      canvas {
        margin: 0;
        padding: 0;
        display: block;
      }
        
      .headingAndGraph {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        page-break-inside: avoid;
        break-inside: avoid;
        gap: 2px;
      }

      .headingAndGraph h4 {
        margin-bottom: 0px;
        padding: 0px;
        text-align: center;
        width: 100%;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img
          class="header-image"
          src="${getImageAsBase64(data.headerImage)}"
          alt="Student Photo"
        />
      </div>

      <div class="student-info">
        <div class="photo-section">
          <img src="${getImageAsBase64(data.photo)}" alt="Student Photo" />
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Roll No.:</strong> ${data.rollNo}</p>
        </div>
        <div class="info-section">
        <div>
          <p><strong>Batch:</strong> ${data.batch}</p>
          <p><strong>Mother's Name:</strong> ${data.motherName}</p>
          <p><strong>Father's Name:</strong> ${data.fatherName}</p>
          </div>
        </div>
      </div>
<div class="table-container">

${heading}
      <table class="marks-table">
        <thead>
          <tr>
           ${jeeMainHeader}
          </tr>
        </thead>
        <tbody>
          ${jeeMainRows}
        </tbody>
      </table>
      </div>

    ${showGraph}
    </div>

    <div class="container" style="padding: 50px 0 0 0;">
 ${showTable}
<div class="table-container">
      <div class="section-title"><span>Attendance Report</span></div>
      <table class="marks-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>No. of Days Classes Held</th>
            <th>No. of Days Present</th>
            <th>No. of Days Absent</th>
            <th>Attendance %age</th>
          </tr>
        </thead>
        <tbody>
          ${attendanceRows}
        </tbody>
      </table>
      </div>
<div class="table-container">

      <div class="section-title"><span>Faculty Feedback</span></div>
      <table class="marks-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Class Response</th>
            <th>Discipline</th>
            <th>Class Attention</th>
            <th>Home Work Completion</th>
          </tr>
        </thead>
        <tbody>
          ${feedbackRows}
        </tbody>
      </table>
    </div>
    </div>

    <script>
              window.onload = () => {
                const labels = ${JSON.stringify(data.subjectWiseData.labels)};
                const phyData = ${JSON.stringify(data.subjectWiseData.phy)};
                const chemData = ${JSON.stringify(data.subjectWiseData.chem)};
                const mathData = ${JSON.stringify(data.subjectWiseData.math)};

                new Chart(document.getElementById("barChart").getContext("2d"), {
                  type: "bar",
                  data: {
                    labels,
                    datasets: [
                      { label: "Physics", data: phyData, backgroundColor: "#2f72da" },
                      { label: "Chemistry", data: chemData, backgroundColor: "#c61d23" },
                      { label: "Maths", data: mathData, backgroundColor: "#86b43b" },
                    ],
                  },
               options: {
        responsive: true,
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 10,
            },
          },
        },
      }

                });

                new Chart(document.getElementById("lineChart").getContext("2d"), {
                  type: "line",
                  data: {
                    labels,
                    datasets: [
                      {
                        label: "Physics",
                        data: phyData,
                        borderColor: "#2f72da",
                        backgroundColor: "#2f72da",
                        fill: false,
                        tension: 0.3,
                      },
                      {
                        label: "Chemistry",
                        data: chemData,
                        borderColor: "#c61d23",
                        backgroundColor: "#c61d23",
                        fill: false,
                        tension: 0.3,
                      },
                      {
                        label: "Maths",
                        data: mathData,
                        borderColor: "#86b43b",
                        backgroundColor: "#86b43b",
                        fill: false,
                        tension: 0.3,
                      },
                    ],
                  },
                  options: {
                    responsive: true,
                    scales: {
                      y: { beginAtZero: true, max: 100, ticks: {
              stepSize: 10,
            }, },
                    },
                  },
                });
              };
    </script>
  </body>
</html>`;
let browser = null;
  try {
    if (process.env.NODE_ENV === "production") {
      // Configure the version based on your package.json (for your future usage).
      const executablePath = await chromium.executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
      );
      browser = await puppeteerCore.launch({
        executablePath,
        // You can pass other configs as required
        args: chromium.args,
        headless: chromium.headless,
        defaultViewport: chromium.defaultViewport,
      });
    } else {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
    const page = await browser.newPage();

    // Set HTML content
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Inject Chart.js from CDN
    await page.addScriptTag({ url: "https://cdn.jsdelivr.net/npm/chart.js" });

    await page.pdf({ path: filePath, format: "A4", printBackground: true });
        await browser.close();

  } catch (error) {
    console.log("error for genaratePerformanceReeportPDF", error);
  }
};

module.exports = generatePerformanceReportPDF;
