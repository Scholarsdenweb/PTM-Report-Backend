

const cloudinary = require("./cloudinarySetup.js");









export async function findImageInCloudinaryFolder(folder, imageName) {
  const fullPublicId = `${folder}/${imageName}`; // Don't add extension

  const result = await cloudinary.search
    .expression(`public_id=${fullPublicId}`)
    .max_results(1)
    .execute();

  if (result.resources.length > 0) {
    const resource = result.resources[0];
    return {
      url: resource.secure_url,
      format: resource.format,
      public_id: resource.public_id
    };
  } else {
    return null; // Not found
  }
}
