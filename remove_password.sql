-- Remove password from root user for development
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;

SELECT 'Password removed - root user now has no password' as Status;
