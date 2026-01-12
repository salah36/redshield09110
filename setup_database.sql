-- ============================================================================
-- RedShield Database Setup Script
-- Run this to set password and create all required tables
-- ============================================================================

-- Set root password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'RedShield2025!Secure#DB';
FLUSH PRIVILEGES;

-- Select/Create database
CREATE DATABASE IF NOT EXISTS redshield CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE redshield;

-- Create trusted_partners table
CREATE TABLE IF NOT EXISTS trusted_partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,

  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables
SHOW TABLES;

SELECT 'Database setup completed successfully!' as Status;
