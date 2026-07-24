const path = require("path");
const { randomUUID } = require("crypto");
const { getDownloadURL, storageBucket } = require("./firebase");

const safeName = (name = "upload") =>
  path
    .basename(name)
    .replace(/[^a-z0-9._-]/gi, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

const uploadFile = async (file, folder) => {
  if (!file) return null;

  const bucket = storageBucket();
  const filename = `${folder}/${Date.now()}-${randomUUID()}-${safeName(file.originalname)}`;
  const bucketFile = bucket.file(filename);

  try {
    await bucketFile.save(file.buffer, {
      resumable: false,
      metadata: {
        contentType: file.mimetype || "application/octet-stream",
        metadata: {
          firebaseStorageDownloadTokens: randomUUID(),
        },
      },
    });

    return getDownloadURL(bucketFile);
  } catch (error) {
    if (String(error.message || "").includes("bucket does not exist")) {
      console.warn(
        "Firebase Storage bucket does not exist yet. Falling back to a Firestore data URL."
      );
      return `data:${file.mimetype || "application/octet-stream"};base64,${file.buffer.toString("base64")}`;
    }

    throw error;
  }
};

module.exports = {
  uploadFile,
};
