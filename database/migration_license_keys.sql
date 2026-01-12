-- Migration: License Keys System for RedShield
-- This migration creates the license_keys table for subscription management

USE redshield;

-- License Keys Table for subscription/claim system
CREATE TABLE IF NOT EXISTS license_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license_key VARCHAR(25) NOT NULL UNIQUE,
    status ENUM('ACTIVE', 'CLAIMED', 'EXPIRED', 'REVOKED') DEFAULT 'ACTIVE',
    duration_days INT NOT NULL DEFAULT 30,
    claimed_by VARCHAR(20) NULL,
    claimed_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    notes TEXT,
    INDEX idx_license_key (license_key),
    INDEX idx_license_status (status),
    INDEX idx_license_claimed_by (claimed_by),
    INDEX idx_license_expires_at (expires_at),
    INDEX idx_license_created_at (created_at DESC),
    FOREIGN KEY (claimed_by) REFERENCES dashboard_users(discord_user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for efficient expiration checks
CREATE INDEX IF NOT EXISTS idx_license_status_expires ON license_keys(status, expires_at);
