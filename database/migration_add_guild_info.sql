-- Add guild_name and member_count columns to guild_configs
USE redshield;

ALTER TABLE guild_configs
ADD COLUMN IF NOT EXISTS guild_name VARCHAR(255) NULL AFTER guild_id,
ADD COLUMN IF NOT EXISTS member_count INT UNSIGNED DEFAULT 0 AFTER guild_name;

-- Create index on guild_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_guild_name ON guild_configs(guild_name);
