-- Add log_sent column to track if embed was sent to Discord
USE redshield;

ALTER TABLE blacklist_entries
ADD COLUMN IF NOT EXISTS log_sent BOOLEAN DEFAULT FALSE AFTER status;

-- Create index for faster lookups of unsent logs
CREATE INDEX IF NOT EXISTS idx_log_sent ON blacklist_entries(log_sent, created_at);
