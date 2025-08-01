import { unlink } from 'fs/promises';


export const removeFileFormServer = async (filelocation) => {
  try {
    await unlink(filelocation);
    console.log("Excel file deleted successfully.");
  } catch (deleteErr) {
    console.error("Failed to delete Excel file:", deleteErr);
  }
};
