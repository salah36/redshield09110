-- Set a simple password without special characters
ALTER USER 'root'@'localhost' IDENTIFIED BY 'RedShield2025';
FLUSH PRIVILEGES;

SELECT 'Password updated to: RedShield2025' as Status;
