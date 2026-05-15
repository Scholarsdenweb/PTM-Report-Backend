const path = require("path");

const cleanStudentNameForFile = (name = "") =>
  String(name)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const cleanRollNoForFile = (rollNo = "") =>
  String(rollNo).replace(/,/g, "").replace(/\s+/g, "").trim();

const buildStudentPhotoBaseName = (name, rollNo) => {
  const cleanName = cleanStudentNameForFile(name);
  const cleanRollNo = cleanRollNoForFile(rollNo);

  if (!cleanName || !cleanRollNo) return "";
  return `${cleanName}_${cleanRollNo}`;
};

const parseStudentPhotoFileName = (fileName = "") => {
  const parsed = path.parse(fileName);
  if (![".jpg", ".jpeg"].includes(parsed.ext.toLowerCase())) return null;

  const normalizedBase = parsed.name
    .replace(/[_-]+(?=\d)/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  const match = normalizedBase.match(/^(.*?)_(\d+)$/);
  if (!match) return null;

  const name = cleanStudentNameForFile(match[1]);
  const rollNo = cleanRollNoForFile(match[2]);
  const baseName = buildStudentPhotoBaseName(name, rollNo);

  if (!baseName) return null;

  return {
    name,
    rollNo,
    baseName,
    fileName: `${baseName}.jpg`,
    extension: ".jpg",
  };
};

module.exports = {
  buildStudentPhotoBaseName,
  cleanRollNoForFile,
  cleanStudentNameForFile,
  parseStudentPhotoFileName,
};
