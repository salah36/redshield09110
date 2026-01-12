-- Create bot configuration table
USE redshield;

CREATE TABLE IF NOT EXISTS bot_config (
    id INT PRIMARY KEY DEFAULT 1,
    status ENUM('online', 'idle', 'dnd', 'invisible') DEFAULT 'online',
    activity_type INT DEFAULT 0,
    activity_name VARCHAR(128),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default config
INSERT IGNORE INTO bot_config (id, status, activity_type, activity_name)
VALUES (1, 'online', 0, 'Protecting servers');
