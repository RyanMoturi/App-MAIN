USE fundi_app;

-- Messages need to support both clients and fundis.
-- The dump currently restricts sender_id and receiver_id to fundis only.
ALTER TABLE messages DROP FOREIGN KEY messages_ibfk_2;
ALTER TABLE messages DROP FOREIGN KEY messages_ibfk_3;
ALTER TABLE messages
  ADD COLUMN sender_role ENUM('client', 'fundi') NOT NULL DEFAULT 'fundi' AFTER receiver_id,
  ADD COLUMN receiver_role ENUM('client', 'fundi') NOT NULL DEFAULT 'fundi' AFTER sender_role;

-- Notifications need to support clients and fundis.
-- The dump currently restricts user_id to fundis only.
ALTER TABLE notifications DROP FOREIGN KEY notifications_ibfk_1;
ALTER TABLE notifications
  ADD COLUMN user_role ENUM('client', 'fundi', 'admin') NOT NULL DEFAULT 'fundi' AFTER user_id;

-- Client profile photos are optional, but the profile editor supports them.
ALTER TABLE clients
  ADD COLUMN profile_photo LONGBLOB NULL AFTER phone_number;

-- Prevent duplicate applications and duplicate active assignments per job.
ALTER TABLE applications
  ADD UNIQUE KEY unique_application (job_id, fundi_id);

ALTER TABLE job_assignments
  ADD UNIQUE KEY unique_job_assignment (job_id);
