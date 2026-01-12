import pool from './db.js';
import { v4 as uuidv4 } from 'uuid';

// ==================== BLACKLIST ENTRIES ====================

export async function addBlacklistEntry(entry) {
    const query = `
        INSERT INTO blacklist_entries
        (id, discord_user_id, license, reason_type, reason_text, proof_url, server_name, other_server, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        uuidv4(),
        entry.discord_user_id,
        entry.license,
        entry.reason_type,
        entry.reason_text,
        entry.proof_url,
        entry.server_name,
        entry.other_server,
        entry.created_by,
    ];
    const [result] = await pool.execute(query, values);

    // Fetch the inserted row
    const [rows] = await pool.execute('SELECT * FROM blacklist_entries WHERE id = ?', [values[0]]);
    return rows[0];
}

export async function getBlacklistByLicense(license) {
    const query = `
        SELECT * FROM blacklist_entries
        WHERE license = ? AND status = 'ACTIVE'
        ORDER BY created_at DESC
        LIMIT 1
    `;
    const [rows] = await pool.execute(query, [license]);
    return rows[0];
}

export async function getBlacklistByDiscordId(discordUserId) {
    const query = `
        SELECT * FROM blacklist_entries
        WHERE discord_user_id = ? AND status = 'ACTIVE'
        ORDER BY created_at DESC
        LIMIT 1
    `;
    const [rows] = await pool.execute(query, [discordUserId]);
    return rows[0];
}

export async function getBlacklistByLicenseOrDiscord(license, discordUserId) {
    const query = `
        SELECT * FROM blacklist_entries
        WHERE (license = ? OR discord_user_id = ?) AND status = 'ACTIVE'
        ORDER BY created_at DESC
        LIMIT 1
    `;
    const [rows] = await pool.execute(query, [license, discordUserId]);
    return rows[0];
}

export async function revokeBlacklistEntry(license, revokedBy, revokeReason) {
    const query = `
        UPDATE blacklist_entries
        SET status = 'REVOKED', revoked_by = ?, revoked_at = NOW(), revoke_reason = ?
        WHERE license = ? AND status = 'ACTIVE'
    `;
    await pool.execute(query, [revokedBy, revokeReason, license]);

    // Fetch the updated row
    const [rows] = await pool.execute('SELECT * FROM blacklist_entries WHERE license = ? ORDER BY created_at DESC LIMIT 1', [license]);
    return rows[0];
}

export async function updateBlacklistEntry(license, updates) {
    const fields = [];
    const values = [];

    if (updates.reason_type !== undefined) {
        fields.push('reason_type = ?');
        values.push(updates.reason_type);
    }
    if (updates.reason_text !== undefined) {
        fields.push('reason_text = ?');
        values.push(updates.reason_text);
    }
    if (updates.proof_url !== undefined) {
        fields.push('proof_url = ?');
        values.push(updates.proof_url);
    }
    if (updates.server_name !== undefined) {
        fields.push('server_name = ?');
        values.push(updates.server_name);
    }
    if (updates.other_server !== undefined) {
        fields.push('other_server = ?');
        values.push(updates.other_server);
    }
    if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
    }

    if (fields.length === 0) {
        return null;
    }

    values.push(license);
    const query = `
        UPDATE blacklist_entries
        SET ${fields.join(', ')}
        WHERE license = ?
    `;

    await pool.execute(query, values);

    // Fetch the updated row
    const [rows] = await pool.execute('SELECT * FROM blacklist_entries WHERE license = ? ORDER BY created_at DESC LIMIT 1', [license]);
    return rows[0];
}

export async function getAllBlacklists(filters = {}) {
    let query = 'SELECT * FROM blacklist_entries WHERE 1=1';
    const values = [];

    if (filters.status) {
        query += ' AND status = ?';
        values.push(filters.status);
    }
    if (filters.reason_type) {
        query += ' AND reason_type = ?';
        values.push(filters.reason_type);
    }
    if (filters.license) {
        query += ' AND license LIKE ?';
        values.push(`%${filters.license}%`);
    }
    if (filters.discord_user_id) {
        query += ' AND discord_user_id = ?';
        values.push(filters.discord_user_id);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
        query += ' LIMIT ?';
        values.push(filters.limit);
    }

    const [rows] = await pool.execute(query, values);
    return rows;
}

// ==================== GUILD CONFIGS ====================

export async function getGuildConfig(guildId) {
    const query = 'SELECT * FROM guild_configs WHERE guild_id = ?';
    const [rows] = await pool.execute(query, [guildId]);

    if (rows.length === 0) {
        // Create default config
        return await createGuildConfig(guildId);
    }

    return rows[0];
}

export async function createGuildConfig(guildId) {
    const query = `
        INSERT IGNORE INTO guild_configs (guild_id)
        VALUES (?)
    `;
    await pool.execute(query, [guildId]);

    // Fetch the config
    const [rows] = await pool.execute('SELECT * FROM guild_configs WHERE guild_id = ?', [guildId]);
    return rows[0];
}

export async function updateGuildConfig(guildId, updates) {
    const fields = [];
    const values = [];

    if (updates.log_channel_id !== undefined) {
        fields.push('log_channel_id = ?');
        values.push(updates.log_channel_id);
    }
    if (updates.punish_role_id !== undefined) {
        fields.push('punish_role_id = ?');
        values.push(updates.punish_role_id);
    }
    if (updates.punishment !== undefined) {
        fields.push('punishment = ?');
        values.push(updates.punishment);
    }
    if (updates.actioning_enabled !== undefined) {
        fields.push('actioning_enabled = ?');
        values.push(updates.actioning_enabled);
    }
    if (updates.global_scan_enabled !== undefined) {
        fields.push('global_scan_enabled = ?');
        values.push(updates.global_scan_enabled);
    }

    if (fields.length === 0) {
        return await getGuildConfig(guildId);
    }

    values.push(guildId);
    const query = `
        UPDATE guild_configs
        SET ${fields.join(', ')}
        WHERE guild_id = ?
    `;

    await pool.execute(query, values);

    // Fetch updated config
    const [rows] = await pool.execute('SELECT * FROM guild_configs WHERE guild_id = ?', [guildId]);
    return rows[0];
}

// ==================== LICENSES ====================

export async function getLicenseStatus(license) {
    const query = 'SELECT * FROM licenses WHERE license = ?';
    const [rows] = await pool.execute(query, [license]);
    return rows[0];
}

export async function addOrUpdateLicense(license, status, note) {
    const query = `
        INSERT INTO licenses (license, status, note)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE status = ?, note = ?
    `;
    await pool.execute(query, [license, status, note, status, note]);

    // Fetch the license
    const [rows] = await pool.execute('SELECT * FROM licenses WHERE license = ?', [license]);
    return rows[0];
}

// ==================== STATS ====================

export async function getStats() {
    const statsQuery = `
        SELECT
            SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_count,
            SUM(CASE WHEN status = 'REVOKED' THEN 1 ELSE 0 END) as revoked_count,
            SUM(CASE WHEN reason_type = 'CHEAT' THEN 1 ELSE 0 END) as cheat_count,
            SUM(CASE WHEN reason_type = 'GLITCH' THEN 1 ELSE 0 END) as glitch_count,
            SUM(CASE WHEN reason_type = 'DUPLICATE' THEN 1 ELSE 0 END) as duplicate_count,
            SUM(CASE WHEN reason_type = 'OTHER' THEN 1 ELSE 0 END) as other_count,
            COUNT(*) as total_count
        FROM blacklist_entries
    `;
    const [rows] = await pool.execute(statsQuery);
    return rows[0];
}

// ==================== DASHBOARD USERS ====================

export async function upsertDashboardUser(userData) {
    const query = `
        INSERT INTO dashboard_users
        (discord_user_id, username, discriminator, avatar, role, last_seen)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            username = VALUES(username),
            discriminator = VALUES(discriminator),
            avatar = VALUES(avatar),
            last_seen = NOW()
    `;
    await pool.execute(query, [
        userData.discord_user_id,
        userData.username,
        userData.discriminator,
        userData.avatar,
        userData.role || 'CONTRIBUTOR'
    ]);

    const [rows] = await pool.execute('SELECT * FROM dashboard_users WHERE discord_user_id = ?', [userData.discord_user_id]);
    return rows[0];
}

export async function getDashboardUser(discordUserId) {
    const query = 'SELECT * FROM dashboard_users WHERE discord_user_id = ?';
    const [rows] = await pool.execute(query, [discordUserId]);
    return rows[0];
}

export async function getAllDashboardUsers() {
    const query = `
        SELECT * FROM dashboard_users
        WHERE is_active = TRUE
        ORDER BY last_seen DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
}

export async function updateDashboardUserServerLink(discordUserId, linkedServerId) {
    const query = `
        UPDATE dashboard_users
        SET linked_server_id = ?
        WHERE discord_user_id = ?
    `;
    await pool.execute(query, [linkedServerId, discordUserId]);

    const [rows] = await pool.execute('SELECT * FROM dashboard_users WHERE discord_user_id = ?', [discordUserId]);
    return rows[0];
}

export async function updateDashboardUserLastSeen(discordUserId) {
    const query = `
        UPDATE dashboard_users
        SET last_seen = NOW()
        WHERE discord_user_id = ?
    `;
    await pool.execute(query, [discordUserId]);
}

export async function getDashboardUserOnlineStatus() {
    const query = `
        SELECT
            SUM(CASE WHEN last_seen > DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 1 ELSE 0 END) as online_count,
            SUM(CASE WHEN last_seen <= DATE_SUB(NOW(), INTERVAL 5 MINUTE) OR last_seen IS NULL THEN 1 ELSE 0 END) as offline_count,
            COUNT(*) as total_count
        FROM dashboard_users
        WHERE is_active = TRUE
    `;
    const [rows] = await pool.execute(query);
    return rows[0];
}
