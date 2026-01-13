-- RedShield Database Schema
-- MariaDB/MySQL Compatible

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS redshield CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE redshield;

-- Blacklist Entries Table
CREATE TABLE IF NOT EXISTS blacklist_entries (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    discord_user_id VARCHAR(20),
    license VARCHAR(255) NOT NULL,
    reason_type ENUM('CHEAT', 'GLITCH', 'DUPLICATE', 'OTHER') NOT NULL,
    reason_text TEXT,
    proof_url TEXT NOT NULL,
    server_name VARCHAR(255) NOT NULL,
    other_server VARCHAR(255),
    status ENUM('ACTIVE', 'REVOKED') DEFAULT 'ACTIVE',
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    revoked_by VARCHAR(20),
    revoked_at TIMESTAMP NULL,
    revoke_reason TEXT,
    INDEX idx_blacklist_license (license),
    INDEX idx_blacklist_discord_id (discord_user_id),
    INDEX idx_blacklist_status (status),
    INDEX idx_blacklist_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Guild Configurations Table
CREATE TABLE IF NOT EXISTS guild_configs (
    guild_id VARCHAR(20) PRIMARY KEY,
    log_channel_id VARCHAR(20),
    punish_role_id VARCHAR(20),
    punishment ENUM('NONE', 'KICK', 'BAN', 'ROLE') DEFAULT 'NONE',
    actioning_enabled BOOLEAN DEFAULT TRUE,
    global_scan_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Licenses Table (optional for license management)
CREATE TABLE IF NOT EXISTS licenses (
    license VARCHAR(255) PRIMARY KEY,
    status ENUM('VALID', 'INVALID', 'EXPIRED') DEFAULT 'VALID',
    note TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
