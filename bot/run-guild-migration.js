import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

async function runMigration() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'redshield',
      multipleStatements: true,
    });

    console.log('✓ Connected to database');

    // Run migrations
    console.log('\nRunning migration: Add guild_name and member_count columns...');

    await connection.query(`
      ALTER TABLE guild_configs
      ADD COLUMN IF NOT EXISTS guild_name VARCHAR(255) NULL AFTER guild_id,
      ADD COLUMN IF NOT EXISTS member_count INT UNSIGNED DEFAULT 0 AFTER guild_name
    `);

    console.log('✓ Added guild_name and member_count columns');

    await connection.query(`
      CREATE INDEX IF NOT EXISTS idx_guild_name ON guild_configs(guild_name)
    `);

    console.log('✓ Created index on guild_name');

    console.log('\n✓ Migration completed successfully!');

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
