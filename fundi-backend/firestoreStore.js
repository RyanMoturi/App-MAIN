const { firestore, Timestamp } = require("./firebase");

const db = firestore();

const COLLECTIONS = {
  clients: "clients",
  fundis: "fundis",
  admins: "admins",
  jobs: "jobs",
  applications: "applications",
  jobAssignments: "job_assignments",
  jobRequests: "job_requests",
  messages: "messages",
  notifications: "notifications",
  portfolio: "portfolio",
  reviews: "reviews",
  reports: "reports",
  payments: "payments",
};

const timestamp = () => Timestamp.now();

const timestampFromDate = (date = new Date()) => Timestamp.fromDate(date);

const toDateValue = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
};

const toSortableTime = (value) => {
  const date = toDateValue(value);
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
};

const toJsonDate = (value) => {
  const date = toDateValue(value);
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : value || null;
};

const normalizeRecord = (record) => {
  if (!record) return null;
  const normalized = { ...record };

  for (const [key, value] of Object.entries(normalized)) {
    if (value && typeof value.toDate === "function") {
      normalized[key] = value.toDate().toISOString();
    }
  }

  return normalized;
};

const docToRecord = (doc) => {
  if (!doc.exists) return null;
  const data = doc.data();
  return normalizeRecord({
    id: data.id ?? doc.id,
    ...data,
  });
};

const all = async (collectionName) => {
  const snap = await db.collection(collectionName).get();
  return snap.docs.map(docToRecord);
};

const getById = async (collectionName, id) => {
  const direct = await db.collection(collectionName).doc(String(id)).get();
  if (direct.exists) return docToRecord(direct);

  const numericId = Number(id);
  if (!Number.isNaN(numericId)) {
    const snap = await db.collection(collectionName).where("id", "==", numericId).limit(1).get();
    if (!snap.empty) return docToRecord(snap.docs[0]);
  }

  return null;
};

const whereEqual = async (collectionName, field, value) => {
  const rows = await all(collectionName);
  return rows.filter((row) => String(row[field]) === String(value));
};

const findOne = async (collectionName, field, value) => {
  const rows = await whereEqual(collectionName, field, value);
  return rows[0] || null;
};

const nextId = async (collectionName) => {
  const rows = await all(collectionName);
  const maxId = rows.reduce((max, row) => {
    const id = Number(row.id);
    return Number.isNaN(id) ? max : Math.max(max, id);
  }, 0);
  return maxId + 1;
};

const addWithId = async (collectionName, data) => {
  const id = await nextId(collectionName);
  const payload = { id, ...data };
  await db.collection(collectionName).doc(String(id)).set(payload);
  return normalizeRecord(payload);
};

const setById = async (collectionName, id, data, options = { merge: true }) => {
  await db.collection(collectionName).doc(String(id)).set(data, options);
};

const updateById = async (collectionName, id, data) => {
  const existing = await getById(collectionName, id);
  if (!existing) return false;
  await db.collection(collectionName).doc(String(id)).set(data, { merge: true });
  return true;
};

const deleteById = async (collectionName, id) => {
  const existing = await getById(collectionName, id);
  if (!existing) return false;
  await db.collection(collectionName).doc(String(id)).delete();
  return true;
};

const toBase64 = (value) => {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value.toString("base64");
  return String(value);
};

const toDataUrl = (value, mimeType = "image/jpeg") => {
  if (typeof value === "string" && /^(https?:|data:|\/uploads\/)/.test(value)) {
    return value;
  }

  const base64 = toBase64(value);
  return base64 ? `data:${mimeType};base64,${base64}` : null;
};

const sortByDateDesc = (rows, field) =>
  [...rows].sort((a, b) => toSortableTime(b[field]) - toSortableTime(a[field]));

const sortByDateAsc = (rows, field) =>
  [...rows].sort((a, b) => toSortableTime(a[field]) - toSortableTime(b[field]));

const createNotification = (userId, userRole, type, content) =>
  addWithId(COLLECTIONS.notifications, {
    user_id: Number(userId),
    user_role: userRole,
    type,
    content,
    is_read: 0,
    created_at: timestamp(),
  });

module.exports = {
  COLLECTIONS,
  addWithId,
  all,
  createNotification,
  db,
  deleteById,
  findOne,
  getById,
  setById,
  sortByDateAsc,
  sortByDateDesc,
  timestamp,
  timestampFromDate,
  toBase64,
  toDataUrl,
  toJsonDate,
  toSortableTime,
  updateById,
  whereEqual,
};
