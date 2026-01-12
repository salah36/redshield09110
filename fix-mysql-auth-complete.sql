-- Complete MariaDB Authentication Fix for RedShield
-- Run this script in your MySQL/MariaDB client

-- Fix all root user entries for MariaDB
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password;
ALTER USER 'root'@'127.0.0.1' IDENTIFIED VIA mysql_native_password;

-- Alternative: Create a dedicated RedShield user
CREATE USER IF NOT EXISTS 'redshield'@'localhost' IDENTIFIED VIA mysql_native_password;
GRANT ALL PRIVILEGES ON redshield.* TO 'redshield'@'localhost';

FLUSH PRIVILEGES;

-- Verify the changes
SELECT User, Host, plugin FROM mysql.user WHERE User IN ('root', 'redshield');
