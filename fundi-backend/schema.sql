-- Fundi-Link database schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS fundi_app;
USE fundi_app;

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  location VARCHAR(100),
  phone_number VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fundis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  skill VARCHAR(100) NOT NULL,
  bio TEXT,
  location VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fundis_skill (skill),
  INDEX idx_fundis_location (location),
  INDEX idx_fundis_rating (rating)
);

CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(100) NOT NULL,
  skill_required VARCHAR(100) NOT NULL,
  client_id INT NOT NULL,
  image_url VARCHAR(255),
  status ENUM('Open', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_jobs_client (client_id),
  INDEX idx_jobs_skill (skill_required)
);

CREATE TABLE IF NOT EXISTS job_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  fundi_id INT NOT NULL,
  message TEXT,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (fundi_id) REFERENCES fundis(id) ON DELETE CASCADE,
  UNIQUE KEY unique_application (job_id, fundi_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  sender_role ENUM('client', 'fundi') NOT NULL,
  receiver_role ENUM('client', 'fundi') NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  INDEX idx_messages_job (job_id),
  INDEX idx_messages_participants (sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_role ENUM('client', 'fundi') NOT NULL,
  type VARCHAR(50) DEFAULT 'general',
  content TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user (user_id, user_role)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  client_id INT NOT NULL,
  fundi_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (fundi_id) REFERENCES fundis(id) ON DELETE CASCADE,
  UNIQUE KEY unique_job_review (job_id, client_id)
);

CREATE TABLE IF NOT EXISTS portfolio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fundi_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  image_url VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fundi_id) REFERENCES fundis(id) ON DELETE CASCADE
);

-- Optional: add columns if tables already exist from an older setup
-- ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status ENUM('Open','In Progress','Completed','Cancelled') DEFAULT 'Open';
-- ALTER TABLE messages ADD COLUMN sender_role ENUM('client','fundi') NOT NULL DEFAULT 'client';
-- ALTER TABLE messages ADD COLUMN receiver_role ENUM('client','fundi') NOT NULL DEFAULT 'fundi';
