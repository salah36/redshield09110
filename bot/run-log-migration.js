import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

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

    // Run migration
    console.log('\nRunning migration: Add log_sent column...');

    await connection.query(`
      ALTER TABLE blacklist_entries
      ADD COLUMN IF NOT EXISTS log_sent BOOLEAN DEFAULT FALSE AFTER status
    `);

    console.log('✓ Added log_sent column');

    await connection.query(`
      CREATE INDEX IF NOT EXISTS idx_log_sent ON blacklist_entries(log_sent, created_at)
    `);

    console.log('✓ Created index on log_sent');

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
