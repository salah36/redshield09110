import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function checkLogsDetailed() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'redshield',
    });

    console.log('✓ Connected to database\n');
    console.log('Checking unsent logs with contributor matching:\n');

    const [entries] = await connection.query(`
      SELECT
        be.id,
        be.license,
        be.server_name,
        be.created_by,
        be.log_sent,
        du.username as creator_name,
        du.linked_server_id,
        gc_direct.guild_name as direct_match_guild,
        gc_direct.log_channel_id as direct_match_channel,
        gc_linked.guild_name as linked_match_guild,
        gc_linked.log_channel_id as linked_match_channel
      FROM blacklist_entries be
      LEFT JOIN dashboard_users du ON be.created_by = du.discord_user_id
      LEFT JOIN guild_configs gc_direct ON be.server_name = gc_direct.guild_name
      LEFT JOIN guild_configs gc_linked ON du.linked_server_id = gc_linked.guild_id
      WHERE be.log_sent = FALSE
      ORDER BY be.created_at DESC
    `);

    if (entries.length === 0) {
      console.log('✅ All logs have been sent!\n');
    } else {
      console.log(`Found ${entries.length} unsent entries:\n`);
      entries.forEach((entry, i) => {
        console.log(`${i + 1}. Entry ID: ${entry.id.substring(0, 8)}...`);
        console.log(`   License: ${entry.license}`);
        console.log(`   Server Name (in DB): ${entry.server_name}`);
        console.log(`   Created By: ${entry.creator_name || entry.created_by || 'Unknown'}`);
        console.log(`   Creator Linked Server: ${entry.linked_server_id || 'NOT LINKED'}`);
        console.log(`   Direct Match: ${entry.direct_match_guild ? `✅ ${entry.direct_match_guild}` : '❌ No match'}`);
        console.log(`   Linked Match: ${entry.linked_match_guild ? `✅ ${entry.linked_match_guild}` : '❌ No match'}`);

        if (!entry.direct_match_guild && !entry.linked_match_guild) {
          console.log(`   ❌ CANNOT BE LOGGED - No matching guild found`);
        } else if (entry.direct_match_channel || entry.linked_match_channel) {
          console.log(`   ✅ CAN BE LOGGED to ${entry.direct_match_guild || entry.linked_match_guild}`);
        } else {
          console.log(`   ⚠️  Guild found but no log channel configured`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkLogsDetailed();
