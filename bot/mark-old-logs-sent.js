import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function markOldLogsSent() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'redshield',
    });

    console.log('✓ Connected to database\n');

    // Find entries that cannot be matched to any guild
    const [unmatchableEntries] = await connection.query(`
      SELECT be.id, be.license, be.server_name, be.created_by
      FROM blacklist_entries be
      LEFT JOIN guild_configs gc1 ON be.server_name = gc1.guild_name
      LEFT JOIN dashboard_users du ON be.created_by = du.discord_user_id
      LEFT JOIN guild_configs gc2 ON du.linked_server_id = gc2.guild_id
      WHERE be.log_sent = FALSE
      AND gc1.guild_id IS NULL
      AND gc2.guild_id IS NULL
    `);

    if (unmatchableEntries.length === 0) {
      console.log('✅ No unmatchable entries found!\n');
      return;
    }

    console.log(`Found ${unmatchableEntries.length} unmatchable entries (old test data):\n`);
    unmatchableEntries.forEach((entry, i) => {
      console.log(`${i + 1}. License: ${entry.license}, Server: ${entry.server_name}`);
    });

    console.log('\n⚠️  Marking these entries as sent (they cannot be matched to any guild)...\n');

    // Mark them as sent
    const ids = unmatchableEntries.map(e => e.id);
    const placeholders = ids.map(() => '?').join(',');
    await connection.query(
      `UPDATE blacklist_entries SET log_sent = TRUE WHERE id IN (${placeholders})`,
      ids
    );

    console.log(`✅ Marked ${unmatchableEntries.length} old entries as sent\n`);
    console.log('ℹ️  These were old test entries that could not be matched to any guild.');
    console.log('ℹ️  New entries will work correctly with the updated system.\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

markOldLogsSent();
