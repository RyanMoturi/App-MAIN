# Firebase Setup for Fundi-Link

This backend uses Firebase Admin SDK for Firestore and Firebase Storage.

## Firebase Console

1. Create a Firebase project.
2. Create a Firestore database.
3. Create a Firebase Storage bucket.
4. Open Project settings, then Service accounts.
5. Generate a new private key and download the JSON file.
6. Copy `fundi-backend/.env.example` to `fundi-backend/.env`.
7. Fill in `JWT_SECRET`, your Firebase service account values, and `FIREBASE_STORAGE_BUCKET`.

Do not commit `.env` or the downloaded JSON key.

## Security Rules

Use `firestore.rules` for Firestore and `storage.rules` for Firebase Storage.
Both are locked down so direct browser reads/writes are denied. The Node backend still works because Firebase Admin SDK bypasses client rules.

## Data Layout

The app uses these Firestore collections:

- `clients`
- `fundis`
- `admins`
- `jobs`
- `applications`
- `job_assignments`
- `job_requests`
- `messages`
- `notifications`
- `portfolio`
- `reviews`
- `reports`

New uploads are stored in Firebase Storage and only their download URLs are saved in Firestore. Older migrated Base64 values are still displayed for compatibility.
