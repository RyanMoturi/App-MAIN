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

-- Fundi accounts must be verified by admin before applying for jobs.
ALTER TABLE fundis
  ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER phone_number,
  ADD COLUMN verification_status ENUM('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending' AFTER is_verified,
  ADD COLUMN verification_note TEXT NULL AFTER verification_status;

-- Fundi verification documents and admin safety flags.
ALTER TABLE fundis
  ADD COLUMN good_conduct_certificate LONGBLOB NULL AFTER profile_photo,
  ADD COLUMN professional_certificates LONGBLOB NULL AFTER good_conduct_certificate,
  ADD COLUMN is_flagged TINYINT(1) NOT NULL DEFAULT 0 AFTER verification_note,
  ADD COLUMN is_banned TINYINT(1) NOT NULL DEFAULT 0 AFTER is_flagged;

-- Client reports against fundis.
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  client_id INT NOT NULL,
  fundi_id INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  details TEXT,
  status ENUM('Pending', 'Reviewed', 'Dismissed') DEFAULT 'Pending',
  admin_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (fundi_id) REFERENCES fundis(id)
);
