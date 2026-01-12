-- Fix MariaDB Authentication for RedShield
-- Run this in your MariaDB/MySQL client

-- Option 1: Change root user authentication (if using root)
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('');
FLUSH PRIVILEGES;

-- Option 2: Create a new dedicated user (recommended)
-- CREATE USER 'redshield'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('your_password_here');
-- GRANT ALL PRIVILEGES ON redshield.* TO 'redshield'@'localhost';
-- FLUSH PRIVILEGES;

-- After running this, update your .env file DATABASE_URL if you created a new user:
-- DATABASE_URL=mysql://redshield:your_password_here@localhost:3306/redshield
