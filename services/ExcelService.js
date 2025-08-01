
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

class ExcelService {
  parseExcel(file) {
    const filePath = path.join(__dirname, "..", "uploads", file.name);
    fs.writeFileSync(filePath, file.data);

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    return data;
  }
}

module.exports = ExcelService;

