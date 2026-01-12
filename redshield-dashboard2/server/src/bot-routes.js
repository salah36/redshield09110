import express from 'express';
import { isOwnerMiddleware } from './auth.js';
import fetch from 'node-fetch';

const router = express.Router();

// Bot token from environment
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_API = 'https://discord.com/api/v10';

// ============================================================================
// BOT INFORMATION
// ============================================================================

// Get bot information
router.get('/info', isOwnerMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${DISCORD_API}/users/@me`, {
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    const botUser = await response.json();
    res.json(botUser);
  } catch (error) {
    console.error('Error fetching bot info:', error);
    res.status(500).json({ error: 'Failed to fetch bot information' });
  }
});

// ============================================================================
// BOT PROFILE
// ============================================================================

// Update bot username
router.patch('/profile/username', isOwnerMiddleware, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.length < 2 || username.length > 32) {
      return res.status(400).json({ error: 'Username must be between 2 and 32 characters' });
    }

    const response = await fetch(`${DISCORD_API}/users/@me`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update username');
    }

    const botUser = await response.json();
    res.json(botUser);
  } catch (error) {
    console.error('Error updating bot username:', error);
    res.status(500).json({ error: error.message || 'Failed to update username' });
  }
});

// Update bot avatar
router.patch('/profile/avatar', isOwnerMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body; // Base64 encoded image data

    if (!avatar) {
      return res.status(400).json({ error: 'Avatar data is required' });
    }

    // Validate base64 data URL format
    if (!avatar.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid avatar format. Must be a data URL' });
    }

    const response = await fetch(`${DISCORD_API}/users/@me`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatar }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update avatar');
    }

    const botUser = await response.json();
    res.json(botUser);
  } catch (error) {
    console.error('Error updating bot avatar:', error);
    res.status(500).json({ error: error.message || 'Failed to update avatar' });
  }
});

// ============================================================================
// BOT PRESENCE/STATUS
// ============================================================================

// Get current bot presence config
router.get('/presence', isOwnerMiddleware, async (req, res) => {
  try {
    // Import pool from database
    const { pool } = await import('./database.js');

    // Get bot config from database
    const [rows] = await pool.execute('SELECT * FROM bot_config WHERE id = 1');

    if (rows.length === 0) {
      return res.json({
        status: 'online',
        activity_type: 0,
        activity_name: null
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching bot presence config:', error);
    res.status(500).json({ error: 'Failed to fetch bot presence config' });
  }
});

// Update bot status
router.post('/presence', isOwnerMiddleware, async (req, res) => {
  try {
    const { status, activityType, activityName } = req.body;

    // Validate status
    const validStatuses = ['online', 'idle', 'dnd', 'invisible'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: online, idle, dnd, or invisible' });
    }

    // Import pool from database
    const { pool } = await import('./database.js');

    // Update bot config in database
    await pool.execute(
      `UPDATE bot_config SET status = ?, activity_type = ?, activity_name = ? WHERE id = 1`,
      [status, activityType || 0, activityName || null]
    );

    res.json({
      message: 'Bot presence updated successfully. Changes will apply within a few seconds.',
      status,
      activityType,
      activityName
    });
  } catch (error) {
    console.error('Error updating bot status:', error);
    res.status(500).json({ error: 'Failed to update bot status' });
  }
});

// ============================================================================
// SERVER MANAGEMENT
// ============================================================================

// Get all servers bot is in
router.get('/guilds', isOwnerMiddleware, async (req, res) => {
  try {
    // Import pool from database
    const { pool } = await import('./database.js');

    // Get guilds from our database instead of Discord API (to avoid rate limits)
    const [guilds] = await pool.execute(`
      SELECT
        guild_id as id,
        guild_name as name,
        member_count as approximate_member_count
      FROM guild_configs
      ORDER BY guild_name ASC
    `);

    res.json(guilds);
  } catch (error) {
    console.error('Error fetching guilds:', error);
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// Leave a server
router.post('/guilds/:guildId/leave', isOwnerMiddleware, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { pool } = await import('./database.js');

    const response = await fetch(`${DISCORD_API}/users/@me/guilds/${guildId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
      },
    });

    // 404 means bot is already not in the server - that's okay
    if (!response.ok && response.status !== 404) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    // Remove the guild from database regardless
    await pool.execute('DELETE FROM guild_configs WHERE guild_id = ?', [guildId]);

    if (response.status === 404) {
      res.json({ message: 'Bot was already not in this server. Removed from database.' });
    } else {
      res.json({ message: 'Successfully left server' });
    }
  } catch (error) {
    console.error('Error leaving guild:', error);
    res.status(500).json({ error: 'Failed to leave server' });
  }
});

// ============================================================================
// BOT STATISTICS
// ============================================================================

// Get bot statistics
router.get('/stats', isOwnerMiddleware, async (req, res) => {
  try {
    // Import pool from database
    const { pool } = await import('./database.js');

    // Get stats from our database
    const [guilds] = await pool.execute(`
      SELECT
        guild_id as id,
        guild_name as name,
        member_count
      FROM guild_configs
    `);

    // Calculate total members
    const totalMembers = guilds.reduce((sum, guild) => sum + (guild.member_count || 0), 0);

    res.json({
      totalGuilds: guilds.length,
      totalMembers: totalMembers,
      guilds: guilds.map(g => ({
        id: g.id,
        name: g.name,
        memberCount: g.member_count || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching bot stats:', error);
    res.status(500).json({ error: 'Failed to fetch bot statistics' });
  }
});

export default router;
