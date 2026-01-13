import express from 'express';
import { pool } from './database.js';
import { isAuthenticated, isContributor, isOwner, isOwnerMiddleware } from './auth.js';

const router = express.Router();

// ============================================================================
// BLACKLIST ROUTES
// ============================================================================

// Get blacklist entries with pagination and filtering
router.get('/blacklist', isContributor, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      reason_type,
      license,
      discord_user_id,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (reason_type) {
      conditions.push('reason_type = ?');
      params.push(reason_type);
    }
    if (license) {
      conditions.push('license LIKE ?');
      params.push(`%${license}%`);
    }
    if (discord_user_id) {
      conditions.push('discord_user_id = ?');
      params.push(discord_user_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM blacklist_entries ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get paginated results
    const [rows] = await pool.execute(
      `SELECT * FROM blacklist_entries ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching blacklist:', error);
    res.status(500).json({ error: 'Failed to fetch blacklist entries' });
  }
});

// Get single blacklist entry
router.get('/blacklist/:id', isContributor, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM blacklist_entries WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching entry:', error);
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
});

// Add new blacklist entry
router.post('/blacklist', isContributor, async (req, res) => {
  try {
    const { discord_user_id, license, reason_type, reason_text, proof_url, server_name, other_server } = req.body;

    // Validate required fields
    if (!license || !discord_user_id || !reason_type || !proof_url || !server_name) {
      return res.status(400).json({ error: 'license, discord_user_id, reason_type, proof_url, and server_name are required' });
    }

    // Validate Discord User ID format
    if (!/^\d{17,19}$/.test(discord_user_id)) {
      return res.status(400).json({ error: 'Invalid Discord User ID format' });
    }

    // Validate proof URL
    try {
      new URL(proof_url);
    } catch {
      return res.status(400).json({ error: 'Invalid proof URL' });
    }

    // Check for duplicate active entry
    const [existing] = await pool.execute(
      'SELECT id FROM blacklist_entries WHERE license = ? AND status = ?',
      [license, 'ACTIVE']
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'An active entry already exists for this license' });
    }

    // Generate UUID
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();

    const [result] = await pool.execute(
      `INSERT INTO blacklist_entries
       (id, discord_user_id, license, reason_type, reason_text, proof_url, server_name, other_server, created_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        discord_user_id,
        license,
        reason_type,
        reason_text || null,
        proof_url,
        server_name,
        other_server || null,
        req.user.id,
        'ACTIVE'
      ]
    );

    res.status(201).json({
      id: id,
      message: 'Blacklist entry created successfully',
    });
  } catch (error) {
    console.error('Error creating blacklist entry:', error);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// Update blacklist entry
router.patch('/blacklist/:id', isContributor, async (req, res) => {
  try {
    const { reason_text, reason_type, proof_url, server_name, other_server } = req.body;
    const updates = [];
    const params = [];

    if (reason_text !== undefined) {
      updates.push('reason_text = ?');
      params.push(reason_text);
    }
    if (reason_type !== undefined) {
      updates.push('reason_type = ?');
      params.push(reason_type);
    }
    if (proof_url !== undefined) {
      // Validate URL
      try {
        new URL(proof_url);
      } catch {
        return res.status(400).json({ error: 'Invalid proof URL' });
      }
      updates.push('proof_url = ?');
      params.push(proof_url);
    }
    if (server_name !== undefined) {
      updates.push('server_name = ?');
      params.push(server_name);
    }
    if (other_server !== undefined) {
      updates.push('other_server = ?');
      params.push(other_server);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);

    const [result] = await pool.execute(
      `UPDATE blacklist_entries SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ message: 'Entry updated successfully' });
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// Revoke blacklist entry
router.post('/blacklist/:id/revoke', isContributor, async (req, res) => {
  try {
    const [result] = await pool.execute(
      `UPDATE blacklist_entries
       SET status = ?, revoked_at = CURRENT_TIMESTAMP, revoked_by = ?
       WHERE id = ? AND status = ?`,
      ['REVOKED', req.user.id, req.params.id, 'ACTIVE']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Active entry not found' });
    }

    res.json({ message: 'Entry revoked successfully' });
  } catch (error) {
    console.error('Error revoking entry:', error);
    res.status(500).json({ error: 'Failed to revoke entry' });
  }
});

// Delete blacklist entry (Owner only)
router.delete('/blacklist/:id', isOwnerMiddleware, async (req, res) => {
  try {
    const [result] = await pool.execute(
      `DELETE FROM blacklist_entries WHERE id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// ============================================================================
// GUILD CONFIG ROUTES
// ============================================================================

// Get all guild configs
router.get('/guilds', isContributor, async (req, res) => {
  try {
    const userIsOwner = isOwner(req.user.id);

    if (userIsOwner) {
      // Owner sees all guilds
      const [rows] = await pool.execute('SELECT * FROM guild_configs');
      res.json(rows);
    } else {
      // Contributors only see their linked server
      const [linkedUsers] = await pool.execute(
        'SELECT linked_server_id FROM dashboard_users WHERE discord_user_id = ? AND is_active = TRUE',
        [req.user.id]
      );

      if (linkedUsers.length === 0 || !linkedUsers[0].linked_server_id) {
        // No linked server - return empty array
        return res.json([]);
      }

      const linkedServerId = linkedUsers[0].linked_server_id;
      const [rows] = await pool.execute(
        'SELECT * FROM guild_configs WHERE guild_id = ?',
        [linkedServerId]
      );
      res.json(rows);
    }
  } catch (error) {
    console.error('Error fetching guilds:', error);
    res.status(500).json({ error: 'Failed to fetch guild configs' });
  }
});

// Get single guild config
router.get('/guilds/:id', isContributor, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM guild_configs WHERE guild_id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching guild:', error);
    res.status(500).json({ error: 'Failed to fetch guild config' });
  }
});

// Update guild config
router.patch('/guilds/:id', isContributor, async (req, res) => {
  try {
    const guildId = req.params.id;
    const userIsOwner = isOwner(req.user.id);

    // Check if user is linked to this server (unless Owner)
    if (!userIsOwner) {
      const [linkedUsers] = await pool.execute(
        'SELECT linked_server_id FROM dashboard_users WHERE discord_user_id = ? AND is_active = TRUE',
        [req.user.id]
      );

      if (linkedUsers.length === 0 || linkedUsers[0].linked_server_id !== guildId) {
        return res.status(403).json({
          error: 'Access denied. You can only manage your linked server.'
        });
      }
    }

    const { actioning_enabled, global_scan_enabled, punishment, punish_role_id, log_channel_id } = req.body;
    const updates = [];
    const params = [];

    if (actioning_enabled !== undefined) {
      updates.push('actioning_enabled = ?');
      params.push(actioning_enabled);
    }
    if (global_scan_enabled !== undefined) {
      updates.push('global_scan_enabled = ?');
      params.push(global_scan_enabled);
    }
    if (punishment !== undefined) {
      updates.push('punishment = ?');
      params.push(punishment);
    }
    if (punish_role_id !== undefined) {
      updates.push('punish_role_id = ?');
      params.push(punish_role_id);
    }
    if (log_channel_id !== undefined) {
      updates.push('log_channel_id = ?');
      params.push(log_channel_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(guildId);

    const [result] = await pool.execute(
      `UPDATE guild_configs SET ${updates.join(', ')} WHERE guild_id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    res.json({ message: 'Guild config updated successfully' });
  } catch (error) {
    console.error('Error updating guild config:', error);
    res.status(500).json({ error: 'Failed to update guild config' });
  }
});

// ============================================================================
// STATS ROUTES
// ============================================================================

router.get('/stats', isContributor, async (req, res) => {
  try {
    // Get total blacklist entries
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM blacklist_entries'
    );

    // Get active entries
    const [activeResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM blacklist_entries WHERE status = ?',
      ['ACTIVE']
    );

    // Get revoked entries
    const [revokedResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM blacklist_entries WHERE status = ?',
      ['REVOKED']
    );

    // Get total guilds
    const [guildsResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM guild_configs'
    );

    // Get enabled guilds (actioning enabled)
    const [enabledGuildsResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM guild_configs WHERE actioning_enabled = ?',
      [true]
    );

    // Get entries by reason type
    const [reasonTypesResult] = await pool.execute(
      'SELECT reason_type, COUNT(*) as count FROM blacklist_entries GROUP BY reason_type'
    );

    // Get recent entries (last 7 days)
    const [recentResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM blacklist_entries WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );

    res.json({
      blacklist: {
        total: totalResult[0].count,
        active: activeResult[0].count,
        revoked: revokedResult[0].count,
        recentWeek: recentResult[0].count,
      },
      guilds: {
        total: guildsResult[0].count,
        enabled: enabledGuildsResult[0].count,
      },
      reasonTypes: reasonTypesResult.reduce((acc, row) => {
        acc[row.reason_type] = row.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ============================================================================
// USER ROUTES
// ============================================================================

router.get('/user/me', isAuthenticated, async (req, res) => {
  try {
    console.log('User ID:', req.user.id);
    const userIsOwner = isOwner(req.user.id);
    console.log('Is Owner:', userIsOwner);

    let isContributorRole = false; // Has Discord contributor role
    let hasActiveLicense = false;  // Has active license key

    // Owner is always a contributor
    if (userIsOwner) {
      isContributorRole = true;
    }

    // Try to verify Discord contributor role via API (fresh check - this is the source of truth)
    if (!userIsOwner) {
      try {
        const response = await fetch(
          `https://discord.com/api/v10/users/@me/guilds/${process.env.MAIN_GUILD_ID}/member`,
          {
            headers: {
              Authorization: `Bearer ${req.user.accessToken}`,
            },
          }
        );

        if (response.ok) {
          const member = await response.json();
          console.log('Discord roles:', member.roles);
          console.log('Contributor role ID:', process.env.CONTRIBUTOR_ROLE_ID);
          isContributorRole = member.roles.includes(process.env.CONTRIBUTOR_ROLE_ID);
          console.log('Has contributor role (Discord API):', isContributorRole);
        } else {
          console.log('Discord API response not OK:', response.status, response.statusText);
          // Do NOT fall back to cached role - only trust Discord API or active license
        }
      } catch (fetchError) {
        console.error('Discord API fetch error:', fetchError.message);
        // Do NOT fall back to cached role - only trust Discord API or active license
      }
    }

    // Check for active license and get license info
    let licenseInfo = null;
    try {
      const [licenseRows] = await pool.execute(
        `SELECT * FROM license_keys
         WHERE claimed_by = ?
         ORDER BY claimed_at DESC
         LIMIT 1`,
        [req.user.id]
      );

      if (licenseRows.length > 0) {
        const license = licenseRows[0];
        const now = new Date();
        const expiresAt = new Date(license.expires_at);
        const isExpired = license.status === 'CLAIMED' && expiresAt < now;

        // Auto-expire the license if needed
        if (isExpired && license.status === 'CLAIMED') {
          await pool.execute(
            `UPDATE license_keys SET status = 'EXPIRED' WHERE id = ?`,
            [license.id]
          );
          license.status = 'EXPIRED';

          // Also update dashboard_users to remove contributor status if license expired
          await pool.execute(
            `UPDATE dashboard_users SET role = 'SERVER_ADMIN', is_active = FALSE
             WHERE discord_user_id = ? AND role = 'CONTRIBUTOR'`,
            [req.user.id]
          );
        }

        hasActiveLicense = license.status === 'CLAIMED' && expiresAt > now;
        const daysRemaining = hasActiveLicense
          ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
          : 0;

        licenseInfo = {
          license_key: license.license_key,
          status: license.status,
          duration_days: license.duration_days,
          claimed_at: license.claimed_at,
          expires_at: license.expires_at,
          is_active: hasActiveLicense,
          days_remaining: daysRemaining
        };
      }
    } catch (licenseError) {
      console.error('Error checking license:', licenseError);
    }

    // Determine final contributor status:
    // User is contributor ONLY if: Owner OR has Discord role OR has active license
    const finalIsContributor = userIsOwner || isContributorRole || hasActiveLicense;
    console.log('Final isContributor:', finalIsContributor, '(owner:', userIsOwner, ', discordRole:', isContributorRole, ', license:', hasActiveLicense, ')');

    // Only update dashboard_users if user has valid contributor access
    if (finalIsContributor) {
      try {
        await pool.execute(
          `INSERT INTO dashboard_users
           (discord_user_id, username, discriminator, avatar, role, is_active, last_seen)
           VALUES (?, ?, ?, ?, ?, TRUE, NOW())
           ON DUPLICATE KEY UPDATE
             username = VALUES(username),
             discriminator = VALUES(discriminator),
             avatar = VALUES(avatar),
             role = VALUES(role),
             is_active = TRUE,
             last_seen = NOW()`,
          [
            req.user.id,
            req.user.username,
            req.user.discriminator,
            req.user.avatar,
            userIsOwner ? 'OWNER' : 'CONTRIBUTOR'
          ]
        );
      } catch (dbError) {
        console.error('Error updating dashboard user:', dbError);
      }
    }

    res.json({
      id: req.user.id,
      username: req.user.username,
      discriminator: req.user.discriminator,
      avatar: req.user.avatar,
      isContributor: finalIsContributor,
      isOwner: userIsOwner,
      license: licenseInfo,
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

// ============================================================================
// OWNER-ONLY ROUTES
// ============================================================================

// Get all dashboard users (Owner only)
router.get('/dashboard-users', isOwnerMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        du.*,
        gc.guild_name AS server_name,
        gc.member_count AS server_members,
        COALESCE(
          (SELECT COUNT(*)
           FROM blacklist_entries be
           WHERE be.server_name = gc.guild_name
           AND be.status = 'ACTIVE'),
          0
        ) AS server_blacklist_count
      FROM dashboard_users du
      LEFT JOIN guild_configs gc ON du.linked_server_id = gc.guild_id
      WHERE du.is_active = TRUE
      ORDER BY du.last_seen DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching dashboard users:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard users' });
  }
});

// Update server link for a dashboard user (Owner only)
router.patch('/dashboard-users/:userId/server-link', isOwnerMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { linked_server_id } = req.body;

    const [result] = await pool.execute(
      'UPDATE dashboard_users SET linked_server_id = ? WHERE discord_user_id = ?',
      [linked_server_id || null, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM dashboard_users WHERE discord_user_id = ?',
      [userId]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating server link:', error);
    res.status(500).json({ error: 'Failed to update server link' });
  }
});

// ============================================================================
// TRUSTED PARTNERS ROUTES (Owner only)
// ============================================================================

// Get all trusted partners
router.get('/trusted-partners', isOwnerMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM trusted_partners
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching trusted partners:', error);
    res.status(500).json({ error: 'Failed to fetch trusted partners' });
  }
});

// Add a new trusted partner
router.post('/trusted-partners', isOwnerMiddleware, async (req, res) => {
  try {
    const { discord_link, discord_server_id, server_icon_url, display_name, notes } = req.body;
    const created_by = req.user.id;

    if (!discord_link || !discord_server_id || !display_name) {
      return res.status(400).json({ error: 'discord_link, discord_server_id, and display_name are required' });
    }

    // Check if partner already exists
    const [existing] = await pool.execute(
      'SELECT * FROM trusted_partners WHERE discord_server_id = ?',
      [discord_server_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'This server is already a trusted partner' });
    }

    const [result] = await pool.execute(
      'INSERT INTO trusted_partners (discord_link, discord_server_id, server_icon_url, display_name, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [discord_link, discord_server_id, server_icon_url || null, display_name, notes || null, created_by]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM trusted_partners WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error adding trusted partner:', error);
    res.status(500).json({ error: 'Failed to add trusted partner' });
  }
});

// Update a trusted partner
router.patch('/trusted-partners/:serverId', isOwnerMiddleware, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { discord_link, server_icon_url, display_name, notes } = req.body;

    const updates = [];
    const params = [];

    if (discord_link !== undefined) {
      updates.push('discord_link = ?');
      params.push(discord_link);
    }

    if (server_icon_url !== undefined) {
      updates.push('server_icon_url = ?');
      params.push(server_icon_url);
    }

    if (display_name !== undefined) {
      updates.push('display_name = ?');
      params.push(display_name);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(serverId);

    const [result] = await pool.execute(
      `UPDATE trusted_partners SET ${updates.join(', ')} WHERE discord_server_id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Trusted partner not found' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM trusted_partners WHERE discord_server_id = ?',
      [serverId]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating trusted partner:', error);
    res.status(500).json({ error: 'Failed to update trusted partner' });
  }
});

// Delete a trusted partner
router.delete('/trusted-partners/:serverId', isOwnerMiddleware, async (req, res) => {
  try {
    const { serverId } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM trusted_partners WHERE discord_server_id = ?',
      [serverId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Trusted partner not found' });
    }

    res.json({ message: 'Trusted partner removed successfully' });
  } catch (error) {
    console.error('Error deleting trusted partner:', error);
    res.status(500).json({ error: 'Failed to delete trusted partner' });
  }
});

// Get public trusted partners (no auth required)
router.get('/public/trusted-partners', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, discord_link, discord_server_id, server_icon_url, display_name
      FROM trusted_partners
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching public trusted partners:', error);
    res.status(500).json({ error: 'Failed to fetch trusted partners' });
  }
});

// Get public stats (no auth required)
router.get('/public/stats', async (req, res) => {
  try {
    // Get total blacklist entries
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM blacklist_entries'
    );

    // Get active entries
    const [activeResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM blacklist_entries WHERE status = ?',
      ['ACTIVE']
    );

    // Get revoked entries
    const [revokedResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM blacklist_entries WHERE status = ?',
      ['REVOKED']
    );

    // Get total guilds
    const [guildsResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM guild_configs'
    );

    // Get enabled guilds (actioning enabled)
    const [enabledGuildsResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM guild_configs WHERE actioning_enabled = ?',
      [true]
    );

    // Get entries by reason type
    const [reasonTypesResult] = await pool.execute(
      'SELECT reason_type, COUNT(*) as count FROM blacklist_entries GROUP BY reason_type'
    );

    // Get recent entries (last 7 days)
    const [recentResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM blacklist_entries WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );

    res.json({
      blacklist: {
        total: totalResult[0].count,
        active: activeResult[0].count,
        revoked: revokedResult[0].count,
        recentWeek: recentResult[0].count,
      },
      guilds: {
        total: guildsResult[0].count,
        enabled: enabledGuildsResult[0].count,
      },
      reasonTypes: reasonTypesResult.reduce((acc, row) => {
        acc[row.reason_type] = row.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get enhanced stats (Owner only)
router.get('/stats/enhanced', isOwnerMiddleware, async (req, res) => {
  try {
    // Get blacklist stats
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM blacklist_entries'
    );
    const [activeResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM blacklist_entries WHERE status = ?',
      ['ACTIVE']
    );
    const [revokedResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM blacklist_entries WHERE status = ?',
      ['REVOKED']
    );
    const [reasonTypesResult] = await pool.execute(
      'SELECT reason_type, COUNT(*) as count FROM blacklist_entries GROUP BY reason_type'
    );

    // Get dashboard user stats
    const [userStatsResult] = await pool.execute(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN last_seen > DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 1 ELSE 0 END) as online_users,
        SUM(CASE WHEN last_seen <= DATE_SUB(NOW(), INTERVAL 5 MINUTE) OR last_seen IS NULL THEN 1 ELSE 0 END) as offline_users
      FROM dashboard_users
      WHERE is_active = TRUE
    `);

    // Get guild count
    const [guildCountResult] = await pool.execute(
      'SELECT COUNT(*) as guild_count FROM guild_configs'
    );

    res.json({
      blacklist: {
        total: totalResult[0].count,
        active: activeResult[0].count,
        revoked: revokedResult[0].count,
        by_reason: reasonTypesResult.reduce((acc, row) => {
          acc[row.reason_type] = row.count;
          return acc;
        }, {}),
      },
      dashboard_users: {
        total: userStatsResult[0].total_users || 0,
        online: userStatsResult[0].online_users || 0,
        offline: userStatsResult[0].offline_users || 0,
      },
      guilds: {
        total: guildCountResult[0].guild_count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching enhanced stats:', error);
    res.status(500).json({ error: 'Failed to fetch enhanced statistics' });
  }
});

// ============================================================================
// LICENSE KEY ROUTES
// ============================================================================

// Helper function to generate license key in format: RedShield-XXXXX-XXXXX-XXXXX
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const generateSegment = () => {
    let segment = '';
    for (let i = 0; i < 5; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return segment;
  };
  return `RedShield-${generateSegment()}-${generateSegment()}-${generateSegment()}`;
}

// Rate limiting map for claim endpoint
const claimAttempts = new Map();
const CLAIM_RATE_LIMIT = 5; // Max attempts
const CLAIM_RATE_WINDOW = 60 * 1000; // 1 minute

function checkClaimRateLimit(userId) {
  const now = Date.now();
  const userAttempts = claimAttempts.get(userId) || { count: 0, firstAttempt: now };

  // Reset if outside window
  if (now - userAttempts.firstAttempt > CLAIM_RATE_WINDOW) {
    claimAttempts.set(userId, { count: 1, firstAttempt: now });
    return true;
  }

  // Check if over limit
  if (userAttempts.count >= CLAIM_RATE_LIMIT) {
    return false;
  }

  // Increment count
  userAttempts.count++;
  claimAttempts.set(userId, userAttempts);
  return true;
}

// Generate a new license key (Owner only)
router.post('/license-keys/generate', isOwnerMiddleware, async (req, res) => {
  try {
    const { duration_days = 30, notes } = req.body;

    // Validate duration (must be positive integer, max 10 years)
    const durationInt = parseInt(duration_days);
    if (!durationInt || durationInt < 1 || durationInt > 3650) {
      return res.status(400).json({
        error: 'Duration must be between 1 and 3650 days'
      });
    }

    // Generate unique license key
    let licenseKey;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      licenseKey = generateLicenseKey();
      const [existing] = await pool.execute(
        'SELECT id FROM license_keys WHERE license_key = ?',
        [licenseKey]
      );
      if (existing.length === 0) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique license key' });
    }

    // Insert the new license key
    const [result] = await pool.execute(
      `INSERT INTO license_keys (license_key, duration_days, created_by, notes, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [licenseKey, parseInt(duration_days), req.user.id, notes || null]
    );

    // Fetch the created key
    const [rows] = await pool.execute(
      'SELECT * FROM license_keys WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error generating license key:', error);
    res.status(500).json({ error: 'Failed to generate license key' });
  }
});

// Get current user's license status (Authenticated users)
// NOTE: This route MUST be before /license-keys/:id to avoid route conflicts
router.get('/license-keys/my-license', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM license_keys
       WHERE claimed_by = ?
       ORDER BY claimed_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.json({ has_license: false });
    }

    const license = rows[0];
    const now = new Date();
    const expiresAt = new Date(license.expires_at);
    const isExpired = license.status === 'CLAIMED' && expiresAt < now;

    // Update status to EXPIRED if necessary
    if (isExpired && license.status === 'CLAIMED') {
      await pool.execute(
        `UPDATE license_keys SET status = 'EXPIRED' WHERE id = ?`,
        [license.id]
      );
      license.status = 'EXPIRED';
    }

    res.json({
      has_license: true,
      license: {
        id: license.id,
        license_key: license.license_key,
        status: license.status,
        duration_days: license.duration_days,
        claimed_at: license.claimed_at,
        expires_at: license.expires_at,
        is_active: license.status === 'CLAIMED' && expiresAt > now,
        days_remaining: license.status === 'CLAIMED' && expiresAt > now
          ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching user license:', error);
    res.status(500).json({ error: 'Failed to fetch license status' });
  }
});

// Get license key statistics (Owner only)
// NOTE: This route MUST be before /license-keys/:id to avoid route conflicts
router.get('/license-keys/stats/summary', isOwnerMiddleware, async (req, res) => {
  try {
    const [statusStats] = await pool.execute(`
      SELECT
        status,
        COUNT(*) as count
      FROM license_keys
      GROUP BY status
    `);

    const [durationStats] = await pool.execute(`
      SELECT
        duration_days,
        COUNT(*) as count
      FROM license_keys
      GROUP BY duration_days
      ORDER BY duration_days
    `);

    const [recentClaims] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM license_keys
      WHERE claimed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    const [totalGenerated] = await pool.execute(`
      SELECT COUNT(*) as count FROM license_keys
    `);

    res.json({
      total_generated: totalGenerated[0].count,
      by_status: statusStats.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {}),
      by_duration: durationStats.reduce((acc, row) => {
        acc[`${row.duration_days}_days`] = row.count;
        return acc;
      }, {}),
      claimed_this_week: recentClaims[0].count,
    });
  } catch (error) {
    console.error('Error fetching license stats:', error);
    res.status(500).json({ error: 'Failed to fetch license statistics' });
  }
});

// Get all license keys with pagination and filtering (Owner only)
router.get('/license-keys', isOwnerMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      claimed_by,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('lk.status = ?');
      params.push(status);
    }
    if (claimed_by) {
      conditions.push('lk.claimed_by = ?');
      params.push(claimed_by);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM license_keys lk ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get paginated results with user info
    const [rows] = await pool.execute(
      `SELECT
        lk.*,
        du.username as claimed_by_username,
        du.avatar as claimed_by_avatar
       FROM license_keys lk
       LEFT JOIN dashboard_users du ON lk.claimed_by = du.discord_user_id
       ${whereClause}
       ORDER BY lk.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching license keys:', error);
    res.status(500).json({ error: 'Failed to fetch license keys' });
  }
});

// Get single license key (Owner only)
// NOTE: This route MUST be after specific routes like /my-license and /stats/summary
router.get('/license-keys/:id', isOwnerMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
        lk.*,
        du.username as claimed_by_username,
        du.avatar as claimed_by_avatar
       FROM license_keys lk
       LEFT JOIN dashboard_users du ON lk.claimed_by = du.discord_user_id
       WHERE lk.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'License key not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching license key:', error);
    res.status(500).json({ error: 'Failed to fetch license key' });
  }
});

// Delete license key (Owner only)
router.delete('/license-keys/:id', isOwnerMiddleware, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM license_keys WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'License key not found' });
    }

    res.json({ message: 'License key deleted successfully' });
  } catch (error) {
    console.error('Error deleting license key:', error);
    res.status(500).json({ error: 'Failed to delete license key' });
  }
});

// Revoke license key (Owner only)
router.post('/license-keys/:id/revoke', isOwnerMiddleware, async (req, res) => {
  try {
    const [result] = await pool.execute(
      `UPDATE license_keys
       SET status = 'REVOKED'
       WHERE id = ? AND status IN ('ACTIVE', 'CLAIMED')`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'License key not found or already revoked' });
    }

    res.json({ message: 'License key revoked successfully' });
  } catch (error) {
    console.error('Error revoking license key:', error);
    res.status(500).json({ error: 'Failed to revoke license key' });
  }
});

// Claim a license key (Authenticated users)
router.post('/license-keys/claim', isAuthenticated, async (req, res) => {
  try {
    const { license_key } = req.body;
    const userId = req.user.id;

    // Rate limiting check
    if (!checkClaimRateLimit(userId)) {
      return res.status(429).json({
        error: 'Too many claim attempts. Please try again later.'
      });
    }

    if (!license_key) {
      return res.status(400).json({ error: 'License key is required' });
    }

    // Validate license key format (case-insensitive)
    const keyFormat = /^redshield-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}$/i;
    if (!keyFormat.test(license_key)) {
      return res.status(400).json({ error: 'Invalid license key format' });
    }

    // Normalize to uppercase for database lookup
    const normalizedKey = license_key.toUpperCase();

    // Check if user already has an active license
    const [existingLicense] = await pool.execute(
      `SELECT * FROM license_keys
       WHERE claimed_by = ? AND status = 'CLAIMED' AND expires_at > NOW()`,
      [userId]
    );

    if (existingLicense.length > 0) {
      return res.status(409).json({
        error: 'You already have an active license',
        existing_license: {
          expires_at: existingLicense[0].expires_at,
          license_key: existingLicense[0].license_key
        }
      });
    }

    // Find the license key
    const [keyRows] = await pool.execute(
      'SELECT * FROM license_keys WHERE license_key = ?',
      [normalizedKey]
    );

    if (keyRows.length === 0) {
      return res.status(404).json({ error: 'Invalid license key' });
    }

    const key = keyRows[0];

    // Check if key is available
    if (key.status === 'CLAIMED') {
      return res.status(409).json({ error: 'This key has already been claimed' });
    }

    if (key.status === 'EXPIRED') {
      return res.status(410).json({ error: 'This license key has expired' });
    }

    if (key.status === 'REVOKED') {
      return res.status(410).json({ error: 'This license key has been revoked' });
    }

    if (key.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'This license key is not available' });
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + key.duration_days);

    // Start transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update the license key
      await connection.execute(
        `UPDATE license_keys
         SET status = 'CLAIMED',
             claimed_by = ?,
             claimed_at = NOW(),
             expires_at = ?
         WHERE id = ? AND status = 'ACTIVE'`,
        [userId, expiresAt, key.id]
      );

      // Upsert user as CONTRIBUTOR
      await connection.execute(
        `INSERT INTO dashboard_users
         (discord_user_id, username, discriminator, avatar, role, is_active, last_seen)
         VALUES (?, ?, ?, ?, 'CONTRIBUTOR', TRUE, NOW())
         ON DUPLICATE KEY UPDATE
           username = VALUES(username),
           discriminator = VALUES(discriminator),
           avatar = VALUES(avatar),
           role = 'CONTRIBUTOR',
           is_active = TRUE,
           last_seen = NOW()`,
        [
          req.user.id,
          req.user.username,
          req.user.discriminator,
          req.user.avatar
        ]
      );

      await connection.commit();
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }

    // Assign Discord CONTRIBUTOR role
    let roleAssigned = false;
    try {
      const guildId = config.mainGuild.id;
      const roleId = config.mainGuild.contributorRoleId;
      const botToken = config.discord.botToken;

      if (guildId && roleId && botToken) {
        const roleResponse = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bot ${botToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (roleResponse.ok || roleResponse.status === 204) {
          roleAssigned = true;
          console.log(`Assigned CONTRIBUTOR role to user ${userId}`);
        } else {
          console.error(`Failed to assign role: ${roleResponse.status} ${roleResponse.statusText}`);
        }
      }
    } catch (roleError) {
      console.error('Error assigning Discord role:', roleError);
      // Don't fail the request - license was still claimed successfully
    }

    res.json({
      message: 'License successfully claimed!',
      license_key: key.license_key,
      duration_days: key.duration_days,
      expires_at: expiresAt,
      role_assigned: roleAssigned,
    });
  } catch (error) {
    console.error('Error claiming license key:', error);
    res.status(500).json({ error: 'Failed to claim license key' });
  }
});

// Batch generate license keys (Owner only)
router.post('/license-keys/generate-batch', isOwnerMiddleware, async (req, res) => {
  try {
    const { count = 1, duration_days = 30, notes } = req.body;

    // Validate count
    if (count < 1 || count > 50) {
      return res.status(400).json({ error: 'Count must be between 1 and 50' });
    }

    // Validate duration (must be positive integer, max 10 years)
    const durationInt = parseInt(duration_days);
    if (!durationInt || durationInt < 1 || durationInt > 3650) {
      return res.status(400).json({
        error: 'Duration must be between 1 and 3650 days'
      });
    }

    const generatedKeys = [];
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      for (let i = 0; i < count; i++) {
        let licenseKey;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
          licenseKey = generateLicenseKey();
          const [existing] = await connection.execute(
            'SELECT id FROM license_keys WHERE license_key = ?',
            [licenseKey]
          );
          if (existing.length === 0) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          throw new Error('Failed to generate unique license key');
        }

        const [result] = await connection.execute(
          `INSERT INTO license_keys (license_key, duration_days, created_by, notes, status)
           VALUES (?, ?, ?, ?, 'ACTIVE')`,
          [licenseKey, parseInt(duration_days), req.user.id, notes || null]
        );

        generatedKeys.push({
          id: result.insertId,
          license_key: licenseKey,
          duration_days: parseInt(duration_days),
          status: 'ACTIVE'
        });
      }

      await connection.commit();
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }

    res.status(201).json({
      message: `Successfully generated ${count} license key(s)`,
      keys: generatedKeys
    });
  } catch (error) {
    console.error('Error batch generating license keys:', error);
    res.status(500).json({ error: 'Failed to generate license keys' });
  }
});

// ============================================================================
// ADMIN USER MANAGEMENT ROUTES (Owner Only)
// ============================================================================

// Get all dashboard users (Owner only)
router.get('/admin/users', isOwnerMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    const params = [];

    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }
    if (search) {
      conditions.push('(username LIKE ? OR discord_user_id LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM dashboard_users ${whereClause}`,
      params
    );

    // Get users with pagination
    const [users] = await pool.execute(
      `SELECT * FROM dashboard_users ${whereClause} ORDER BY last_seen DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user details (Owner only)
router.get('/admin/users/:userId', isOwnerMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const [users] = await pool.execute(
      'SELECT * FROM dashboard_users WHERE discord_user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's license info if any
    const [licenses] = await pool.execute(
      'SELECT * FROM license_keys WHERE claimed_by = ? ORDER BY claimed_at DESC',
      [userId]
    );

    res.json({
      user: users[0],
      licenses
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user role (Owner only)
router.patch('/admin/users/:userId/role', isOwnerMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['OWNER', 'CONTRIBUTOR', 'SERVER_ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be OWNER, CONTRIBUTOR, or SERVER_ADMIN' });
    }

    const [result] = await pool.execute(
      'UPDATE dashboard_users SET role = ? WHERE discord_user_id = ?',
      [role, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Role updated successfully', role });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Ban/Unban user (Owner only)
router.patch('/admin/users/:userId/ban', isOwnerMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { banned } = req.body;

    const [result] = await pool.execute(
      'UPDATE dashboard_users SET is_active = ? WHERE discord_user_id = ?',
      [!banned, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: banned ? 'User banned successfully' : 'User unbanned successfully',
      is_active: !banned
    });
  } catch (error) {
    console.error('Error updating ban status:', error);
    res.status(500).json({ error: 'Failed to update ban status' });
  }
});

// Delete user (Owner only)
router.delete('/admin/users/:userId', isOwnerMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Don't allow deleting the owner
    if (isOwner(userId)) {
      return res.status(403).json({ error: 'Cannot delete the owner account' });
    }

    const [result] = await pool.execute(
      'DELETE FROM dashboard_users WHERE discord_user_id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Revoke user's license (Owner only)
router.patch('/admin/users/:userId/revoke-license', isOwnerMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Update license status to REVOKED
    const [result] = await pool.execute(
      `UPDATE license_keys SET status = 'REVOKED' WHERE claimed_by = ? AND status = 'CLAIMED'`,
      [userId]
    );

    // Also update user role to SERVER_ADMIN and deactivate
    await pool.execute(
      `UPDATE dashboard_users SET role = 'SERVER_ADMIN', is_active = FALSE WHERE discord_user_id = ?`,
      [userId]
    );

    res.json({
      message: 'License revoked successfully',
      licensesRevoked: result.affectedRows
    });
  } catch (error) {
    console.error('Error revoking license:', error);
    res.status(500).json({ error: 'Failed to revoke license' });
  }
});

export default router;
