import { unlink } from 'fs/promises';

export const removeFileFormServer = async (filelocation) => {
  try {
    
    await unlink(filelocation);
    console.log("Excel file deleted successfully.");
  } catch (deleteErr) {
    console.log("Failed to delete Excel file:", deleteErr);
  }
};


// import { unlink, access } from "fs/promises";
// import { constants } from "fs";

// export const removeFileFormServer = async (fileLocation) => {
//   try {
//     // Check if file exists
//     await access(fileLocation, constants.F_OK);

//     // If it exists, delete it
//     await unlink(fileLocation);
//     console.log("File deleted successfully:", fileLocation);
//   } catch (err) {
//     if (err.code === "ENOENT") {
//       // File does not exist — skip silently or log
//       console.log("File does not exist, skipping deletion:", fileLocation);
//     } else {
//       // Log other errors without returning or throwing
//       console.error("Failed to delete file:", err.message);
//     }
//   }

//   // Always end silently, never return or throw anything
// };
