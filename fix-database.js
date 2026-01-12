import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root@localhost:3306/redshield';

async function checkAndFixDatabase() {
  let connection;

  try {
    // Parse DATABASE_URL
    const url = new URL(DATABASE_URL);
    const config = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      multipleStatements: true
    };

    console.log('Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✓ Connected to database');

    // Check existing tables
    console.log('\nChecking existing tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('Existing tables:', tableNames);

    // Check for dashboard_users table
    if (!tableNames.includes('dashboard_users')) {
      console.log('\n⚠ dashboard_users table missing. Creating...');
      const dashboardUsersSql = readFileSync('../database/migration_dashboard_users.sql', 'utf8');
      await connection.query(dashboardUsersSql);
      console.log('✓ dashboard_users table created');
    } else {
      console.log('✓ dashboard_users table exists');
    }

    // Check for trusted_partners table
    if (!tableNames.includes('trusted_partners')) {
      console.log('\n⚠ trusted_partners table missing. Creating...');
      const trustedPartnersSql = readFileSync('../redshield-dashboard2/server/migrations/create_trusted_partners_table.sql', 'utf8');
      await connection.query(trustedPartnersSql);
      console.log('✓ trusted_partners table created');

      // Add server_icon_url column
      console.log('Adding server_icon_url column...');
      await connection.execute(
        'ALTER TABLE trusted_partners ADD COLUMN server_icon_url VARCHAR(500) NULL AFTER discord_server_id'
      );
      console.log('✓ server_icon_url column added');
    } else {
      console.log('✓ trusted_partners table exists');

      // Check if server_icon_url column exists
      const [columns] = await connection.execute(
        "SHOW COLUMNS FROM trusted_partners LIKE 'server_icon_url'"
      );

      if (columns.length === 0) {
        console.log('\n⚠ server_icon_url column missing. Adding...');
        await connection.execute(
          'ALTER TABLE trusted_partners ADD COLUMN server_icon_url VARCHAR(500) NULL AFTER discord_server_id'
        );
        console.log('✓ server_icon_url column added');
      } else {
        console.log('✓ server_icon_url column exists');
      }
    }

    // Check guild_configs for missing columns
    console.log('\nChecking guild_configs table columns...');
    const [guildColumns] = await connection.execute('SHOW COLUMNS FROM guild_configs');
    const guildColumnNames = guildColumns.map(c => c.Field);

    // Add guild_name and member_count if missing
    if (!guildColumnNames.includes('guild_name')) {
      console.log('⚠ guild_name column missing. Adding...');
      await connection.execute(
        'ALTER TABLE guild_configs ADD COLUMN guild_name VARCHAR(255) NULL AFTER guild_id'
      );
      console.log('✓ guild_name column added');
    } else {
      console.log('✓ guild_name column exists');
    }

    if (!guildColumnNames.includes('member_count')) {
      console.log('⚠ member_count column missing. Adding...');
      await connection.execute(
        'ALTER TABLE guild_configs ADD COLUMN member_count INT NULL DEFAULT 0 AFTER guild_name'
      );
      console.log('✓ member_count column added');
    } else {
      console.log('✓ member_count column exists');
    }

    console.log('\n✅ Database schema is now up to date!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Database connection closed');
    }
  }
}

checkAndFixDatabase();
