-- Fundi-Link database schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS fundi_app;
USE fundi_app;

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  password_hash VARCHAR(255),
  phone_number INT,
  profile_photo LONGBLOB
);

CREATE TABLE IF NOT EXISTS fundis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  national_id VARCHAR(20) NOT NULL,
  id_photo LONGBLOB,
  profile_photo LONGBLOB,
  skill VARCHAR(100) NOT NULL,
  bio TEXT,
  location VARCHAR(100),
  rating DECIMAL(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  password_hash VARCHAR(255),
  phone_number INT,
  is_verified TINYINT(1) DEFAULT 0,
  verification_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
  verification_note TEXT,
  good_conduct_certificate LONGBLOB,
  professional_certificates LONGBLOB,
  is_flagged TINYINT(1) DEFAULT 0,
  is_banned TINYINT(1) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Super Admin', 'Admin') DEFAULT 'Admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  skill_required VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  image_url VARCHAR(255),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  fundi_id INT NOT NULL,
  message TEXT,
  status ENUM('Pending', 'Accepted', 'Rejected') DEFAULT 'Pending',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (fundi_id) REFERENCES fundis(id) ON DELETE CASCADE,
  UNIQUE KEY unique_application (job_id, fundi_id)
);

CREATE TABLE IF NOT EXISTS job_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  fundi_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (fundi_id) REFERENCES fundis(id),
  UNIQUE KEY unique_job_assignment (job_id)
);

CREATE TABLE IF NOT EXISTS job_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  fundi_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'requested',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (fundi_id) REFERENCES fundis(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  sender_role ENUM('client', 'fundi') NOT NULL,
  receiver_role ENUM('client', 'fundi') NOT NULL,
  content TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_role ENUM('client', 'fundi', 'admin') NOT NULL,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portfolio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fundi_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  image_url VARCHAR(255),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fundi_id) REFERENCES fundis(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fundi_id INT NOT NULL,
  client_id INT NOT NULL,
  job_id INT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fundi_id) REFERENCES fundis(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

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
