const cloudinary = require("./cloudinarySetup.js");

async function findImageInCloudinaryFolder( imageName) {

    console.log("imageName", imageName);
  const fullPublicId = `PTM_Document/Student_Images/${imageName}`; // Don't add extension

  const result = await cloudinary.search
    .expression(`public_id=${fullPublicId}`)
    .max_results(1)
    .execute();

    console.log("result from cloudinary", result);

  if (result.resources.length > 0) {
    const resource = result.resources[0];
    return {
      url: resource.secure_url,
      format: resource.format,
      public_id: resource.public_id,
    };
  } else {
    return null; // Not found
  }
}

module.exports = { findImageInCloudinaryFolder };
