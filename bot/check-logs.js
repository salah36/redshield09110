import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkLogs() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'redshield',
    });

    console.log('✓ Connected to database\n');

    // Check total blacklist entries
    const [total] = await connection.query('SELECT COUNT(*) as count FROM blacklist_entries');
    console.log(`Total blacklist entries: ${total[0].count}`);

    // Check unsent logs
    const [unsent] = await connection.query('SELECT COUNT(*) as count FROM blacklist_entries WHERE log_sent = FALSE');
    console.log(`Unsent logs (log_sent = FALSE): ${unsent[0].count}`);

    // Check sent logs
    const [sent] = await connection.query('SELECT COUNT(*) as count FROM blacklist_entries WHERE log_sent = TRUE');
    console.log(`Sent logs (log_sent = TRUE): ${sent[0].count}\n`);

    // Show recent unsent entries with server info
    console.log('Recent unsent entries:\n');
    const [unsentEntries] = await connection.query(`
      SELECT
        be.id,
        be.license,
        be.server_name,
        be.log_sent,
        be.created_at,
        gc.guild_id,
        gc.guild_name,
        gc.log_channel_id
      FROM blacklist_entries be
      LEFT JOIN guild_configs gc ON be.server_name = gc.guild_name
      WHERE be.log_sent = FALSE
      ORDER BY be.created_at DESC
      LIMIT 5
    `);

    if (unsentEntries.length === 0) {
      console.log('  No unsent entries found');
    } else {
      unsentEntries.forEach((entry, i) => {
        console.log(`${i + 1}. Entry ID: ${entry.id}`);
        console.log(`   License: ${entry.license}`);
        console.log(`   Server Name: ${entry.server_name}`);
        console.log(`   Guild Match: ${entry.guild_name || 'NO MATCH'}`);
        console.log(`   Guild ID: ${entry.guild_id || 'N/A'}`);
        console.log(`   Log Channel: ${entry.log_channel_id || 'NOT CONFIGURED'}`);
        console.log(`   Created: ${entry.created_at}`);
        console.log('');
      });
    }

    // Show all guild configs
    console.log('\nAll guild configurations:\n');
    const [guilds] = await connection.query('SELECT guild_id, guild_name, log_channel_id FROM guild_configs');
    guilds.forEach((guild, i) => {
      console.log(`${i + 1}. Guild: ${guild.guild_name || guild.guild_id}`);
      console.log(`   ID: ${guild.guild_id}`);
      console.log(`   Log Channel: ${guild.log_channel_id || 'NOT CONFIGURED'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkLogs();
