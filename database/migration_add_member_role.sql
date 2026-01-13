-- Migration: Add MEMBER role to dashboard_users table
-- This allows tracking all users who login, not just contributors

-- MySQL: Alter the ENUM to include MEMBER
ALTER TABLE dashboard_users
MODIFY COLUMN role ENUM('OWNER', 'CONTRIBUTOR', 'SERVER_ADMIN', 'MEMBER') DEFAULT 'MEMBER';

-- Update existing users without a role to MEMBER (if any)
-- UPDATE dashboard_users SET role = 'MEMBER' WHERE role IS NULL;
