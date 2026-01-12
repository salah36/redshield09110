-- Drop old table if it exists
DROP TABLE IF EXISTS trusted_partners;

-- Create trusted_partners table with new schema
CREATE TABLE trusted_partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discord_link VARCHAR(500) NOT NULL,
  discord_server_id VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,

  INDEX idx_discord_server_id (discord_server_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to table
ALTER TABLE trusted_partners COMMENT = 'Stores trusted partner Discord servers for homepage showcase';
