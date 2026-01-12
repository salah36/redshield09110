-- Migration: Add warning_sent column to license_keys table
-- This column tracks whether an expiration warning DM has been sent

ALTER TABLE license_keys
ADD COLUMN warning_sent BOOLEAN DEFAULT FALSE AFTER notes;

-- Add index for faster queries when checking for licenses needing warnings
CREATE INDEX idx_license_warning ON license_keys(status, expires_at, warning_sent);
