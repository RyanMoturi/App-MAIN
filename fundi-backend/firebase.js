const { cert, getApp, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { getDownloadURL, getStorage } = require("firebase-admin/storage");

let app;

const normalizeServiceAccount = (serviceAccount) => ({
  projectId: serviceAccount.projectId || serviceAccount.project_id,
  clientEmail: serviceAccount.clientEmail || serviceAccount.client_email,
  privateKey: (serviceAccount.privateKey || serviceAccount.private_key || "").replace(/\\n/g, "\n"),
});

const parseServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return normalizeServiceAccount(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  }

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return normalizeServiceAccount({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY,
    });
  }

  return null;
};

const getFirebaseApp = () => {
  if (app) return app;
  if (getApps().length) {
    app = getApp();
    return app;
  }

  const serviceAccount = parseServiceAccount();

  if (!serviceAccount) {
    throw new Error(
      "Firebase is not configured. Add FIREBASE_SERVICE_ACCOUNT_JSON or the FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY values to .env."
    );
  }

  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      `${serviceAccount.projectId}.firebasestorage.app`,
  });

  return app;
};

const firestore = () => getFirestore(getFirebaseApp());

const storageBucket = () => getStorage(getFirebaseApp()).bucket();

module.exports = {
  firestore,
  getDownloadURL,
  getFirebaseApp,
  storageBucket,
  Timestamp,
};
