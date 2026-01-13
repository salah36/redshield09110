-- Migration: Add dashboard_users table
-- Run this on your existing redshield database

USE redshield;

-- Dashboard Users Table (for server linking and access management)
CREATE TABLE IF NOT EXISTS dashboard_users (
    discord_user_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    discriminator VARCHAR(10),
    avatar VARCHAR(255),
    linked_server_id VARCHAR(20) NULL,
    role ENUM('OWNER', 'CONTRIBUTOR', 'SERVER_ADMIN', 'MEMBER') DEFAULT 'MEMBER',
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dashboard_linked_server (linked_server_id),
    INDEX idx_dashboard_role (role),
    INDEX idx_dashboard_last_seen (last_seen DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Migration completed successfully!' as message;
