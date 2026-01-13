-- RedShield PostgreSQL Schema for Supabase
-- Run this in Supabase SQL Editor

-- Create custom types for enums
DO $$ BEGIN
    CREATE TYPE reason_type AS ENUM ('CHEAT', 'GLITCH', 'DUPLICATE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE entry_status AS ENUM ('ACTIVE', 'REVOKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE punishment_type AS ENUM ('KICK', 'BAN', 'ROLE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('OWNER', 'CONTRIBUTOR', 'SERVER_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE license_status AS ENUM ('ACTIVE', 'CLAIMED', 'EXPIRED', 'REVOKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Blacklist entries table
CREATE TABLE IF NOT EXISTS blacklist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_user_id VARCHAR(20),
    license VARCHAR(255) NOT NULL,
    reason_type reason_type NOT NULL DEFAULT 'OTHER',
    reason_text TEXT,
    proof_url TEXT NOT NULL,
    server_name VARCHAR(255) NOT NULL,
    other_server VARCHAR(255),
    status entry_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(20) NOT NULL,
    revoked_by VARCHAR(20)
);

-- Guild configs table
CREATE TABLE IF NOT EXISTS guild_configs (
    guild_id VARCHAR(20) PRIMARY KEY,
    guild_name VARCHAR(255),
    member_count INTEGER DEFAULT 0,
    actioning_enabled BOOLEAN DEFAULT FALSE,
    global_scan_enabled BOOLEAN DEFAULT FALSE,
    punishment punishment_type DEFAULT 'KICK',
    punish_role_id VARCHAR(20),
    log_channel_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboard users table
CREATE TABLE IF NOT EXISTS dashboard_users (
    discord_user_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    discriminator VARCHAR(10) DEFAULT '0',
    avatar VARCHAR(255),
    linked_server_id VARCHAR(20),
    role user_role DEFAULT 'SERVER_ADMIN',
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trusted partners table
CREATE TABLE IF NOT EXISTS trusted_partners (
    id SERIAL PRIMARY KEY,
    discord_link VARCHAR(255) NOT NULL,
    discord_server_id VARCHAR(20) NOT NULL UNIQUE,
    server_icon_url TEXT,
    display_name VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(20) NOT NULL
);

-- License keys table
CREATE TABLE IF NOT EXISTS license_keys (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(50) NOT NULL UNIQUE,
    status license_status DEFAULT 'ACTIVE',
    duration_days INTEGER NOT NULL DEFAULT 30,
    claimed_by VARCHAR(20),
    claimed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Action logs table
CREATE TABLE IF NOT EXISTS action_logs (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    target_user_id VARCHAR(20) NOT NULL,
    target_license VARCHAR(255),
    blacklist_entry_id UUID,
    action_type VARCHAR(20) NOT NULL,
    action_result VARCHAR(20) NOT NULL,
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notified BOOLEAN DEFAULT FALSE,
    log_sent BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blacklist_license ON blacklist_entries(license);
CREATE INDEX IF NOT EXISTS idx_blacklist_discord_user ON blacklist_entries(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_status ON blacklist_entries(status);
CREATE INDEX IF NOT EXISTS idx_blacklist_created_at ON blacklist_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_license_keys_status ON license_keys(status);
CREATE INDEX IF NOT EXISTS idx_license_keys_claimed_by ON license_keys(claimed_by);
CREATE INDEX IF NOT EXISTS idx_action_logs_guild ON action_logs(guild_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_executed ON action_logs(executed_at);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_blacklist_entries_updated_at ON blacklist_entries;
CREATE TRIGGER update_blacklist_entries_updated_at
    BEFORE UPDATE ON blacklist_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guild_configs_updated_at ON guild_configs;
CREATE TRIGGER update_guild_configs_updated_at
    BEFORE UPDATE ON guild_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboard_users_updated_at ON dashboard_users;
CREATE TRIGGER update_dashboard_users_updated_at
    BEFORE UPDATE ON dashboard_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_license_keys_updated_at ON license_keys;
CREATE TRIGGER update_license_keys_updated_at
    BEFORE UPDATE ON license_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
