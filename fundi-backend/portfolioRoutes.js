const express = require("express");
const multer = require("multer");
const {
  COLLECTIONS,
  addWithId,
  sortByDateDesc,
  timestamp,
  whereEqual,
} = require("./firestoreStore");
const { uploadFile } = require("./storageStore");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/portfolio", upload.single("image"), async (req, res) => {
  const { fundi_id, title, description } = req.body;

  try {
    const image_url = req.file ? await uploadFile(req.file, "portfolio/images") : null;
    await addWithId(COLLECTIONS.portfolio, {
      fundi_id: Number(fundi_id),
      title,
      image_url,
      description,
      created_at: timestamp(),
    });

    res.status(201).json({ message: "Portfolio item added", image_url });
  } catch (err) {
    console.error("Portfolio upload error:", err);
    res.status(500).json({ error: "Failed to add portfolio item" });
  }
});

router.get("/portfolio/:fundiId", async (req, res) => {
  try {
    const rows = await whereEqual(COLLECTIONS.portfolio, "fundi_id", req.params.fundiId);
    res.json(sortByDateDesc(rows, "created_at"));
  } catch (err) {
    console.error("Portfolio fetch error:", err);
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

module.exports = router;
