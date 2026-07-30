const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const {
  COLLECTIONS,
  all,
  getById,
  sortByDateDesc,
  toDataUrl,
  updateById,
} = require("../firestoreStore");
const { uploadFile } = require("../storageStore");
const {
  distanceInKilometres,
  hasCoordinates,
  locationFields,
} = require("../locationUtils");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const requireFundiOwner = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (
      user.role !== "fundi" ||
      String(user.id) !== String(req.params.id)
    ) {
      return res.status(403).json({ error: "This profile is private" });
    }

    req.user = user;
    next();
  } catch (_error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

const publicFundi = (fundi) => ({
  id: fundi.id,
  name: fundi.name,
  email: fundi.email,
  skill: fundi.skill,
  bio: fundi.bio,
  location: fundi.location,
  rating: fundi.rating,
  phone_number: fundi.phone_number,
  created_at: fundi.created_at,
});

const matches = (value, search) =>
  String(value || "").toLowerCase().includes(String(search || "").toLowerCase());

router.get("/", async (req, res) => {
  try {
    const { category, skill, location, latitude, longitude } = req.query;
    const origin = { latitude, longitude };
    const rankByDistance = hasCoordinates(origin);
    let fundis = await all(COLLECTIONS.fundis);

    if (category && category !== "All") {
      fundis = fundis.filter((fundi) => fundi.skill === category);
    }

    if (skill) {
      fundis = fundis.filter((fundi) => matches(fundi.skill, skill));
    }

    if (location && !rankByDistance) {
      fundis = fundis.filter((fundi) => matches(fundi.location, location));
    }

    const ranked = fundis.map((fundi) => ({
      fundi,
      distance: rankByDistance
        ? distanceInKilometres(origin, fundi)
        : null,
    }));

    ranked.sort((a, b) => {
      if (rankByDistance) {
        const aHasDistance = Number.isFinite(a.distance);
        const bHasDistance = Number.isFinite(b.distance);

        if (aHasDistance !== bHasDistance) return aHasDistance ? -1 : 1;
        if (aHasDistance && a.distance !== b.distance) {
          return a.distance - b.distance;
        }
      }

      return Number(b.fundi.rating || 0) - Number(a.fundi.rating || 0);
    });

    res.json(
      ranked.map(({ fundi, distance }) => ({
        ...publicFundi(fundi),
        distance_km: Number.isFinite(distance)
          ? Math.round(distance * 10) / 10
          : null,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load fundis" });
  }
});

router.get("/search/:search", async (req, res) => {
  try {
    const search = req.params.search;
    const fundis = (await all(COLLECTIONS.fundis))
      .filter(
        (fundi) =>
          matches(fundi.name, search) ||
          matches(fundi.skill, search) ||
          matches(fundi.email, search) ||
          matches(fundi.location, search)
      )
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));

    res.json(fundis.map(publicFundi));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

router.get("/category/:skill", async (req, res) => {
  try {
    const fundis = (await all(COLLECTIONS.fundis))
      .filter((fundi) => fundi.skill === req.params.skill)
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));

    res.json(fundis.map(publicFundi));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

router.get("/:id/completed-jobs", async (req, res) => {
  try {
    const [assignments, jobs, reviews] = await Promise.all([
      all(COLLECTIONS.jobAssignments),
      all(COLLECTIONS.jobs),
      all(COLLECTIONS.reviews),
    ]);

    const jobById = new Map(jobs.map((job) => [String(job.id), job]));

    const completed = assignments
      .filter(
        (assignment) =>
          String(assignment.fundi_id) === String(req.params.id) &&
          assignment.completed_at
      )
      .map((assignment) => {
        const job = jobById.get(String(assignment.job_id));
        const review = reviews.find(
          (item) =>
            String(item.job_id) === String(assignment.job_id) &&
            String(item.fundi_id) === String(assignment.fundi_id)
        );

        return {
          id: job?.id,
          title: job?.title,
          description: job?.description,
          location: job?.location,
          skill_required: job?.skill_required,
          image_url: job?.image_url,
          created_at: job?.created_at,
          assigned_at: assignment.assigned_at,
          completed_at: assignment.completed_at,
          rating: review?.rating || null,
          comment: review?.comment || null,
        };
      });

    res.json(sortByDateDesc(completed, "completed_at"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch completed jobs" });
  }
});

router.get("/me/:id", requireFundiOwner, async (req, res) => {
  try {
    const fundi = await getById(COLLECTIONS.fundis, req.params.id);

    if (!fundi) {
      return res.status(404).json({ error: "Fundi not found" });
    }

    const { password_hash, id_photo, ...safeFundi } = fundi;
    res.json({
      ...safeFundi,
      profile_photo: toDataUrl(fundi.profile_photo),
      good_conduct_certificate: toDataUrl(
        fundi.good_conduct_certificate,
        "application/octet-stream"
      ),
      professional_certificates: toDataUrl(
        fundi.professional_certificates,
        "application/octet-stream"
      ),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const fundi = await getById(COLLECTIONS.fundis, req.params.id);

    if (!fundi) {
      return res.status(404).json({ error: "Fundi not found" });
    }

    res.json({
      ...publicFundi(fundi),
      profile_photo: toDataUrl(fundi.profile_photo),
      is_verified: Boolean(fundi.is_verified),
      verification_status: fundi.verification_status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put(
  "/:id",
  requireFundiOwner,
  upload.fields([
    { name: "profile_photo", maxCount: 1 },
    { name: "good_conduct_certificate", maxCount: 1 },
    { name: "professional_certificates", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, email, skill, bio, phone_number } = req.body;
      const fundi = await getById(COLLECTIONS.fundis, req.params.id);

      if (!fundi) {
        return res.status(404).json({ error: "Fundi not found" });
      }

      const update = {
        name,
        email,
        ...locationFields(req.body),
        skill,
        bio,
        phone_number: phone_number ? Number(phone_number) : null,
      };

      if (req.files?.profile_photo?.[0]) {
        update.profile_photo = await uploadFile(req.files.profile_photo[0], "fundis/profile-photos");
      }

      if (req.files?.good_conduct_certificate?.[0]) {
        update.good_conduct_certificate = await uploadFile(
          req.files.good_conduct_certificate[0],
          "fundis/good-conduct"
        );
      }

      if (req.files?.professional_certificates?.[0]) {
        update.professional_certificates = await uploadFile(
          req.files.professional_certificates[0],
          "fundis/professional-certificates"
        );
      }

      await updateById(COLLECTIONS.fundis, req.params.id, update);
      res.json({ message: "Profile updated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

module.exports = router;
