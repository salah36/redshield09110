import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function runMigration() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'redshield',
      multipleStatements: true,
    });

    console.log('✓ Connected to database');

    console.log('\nRunning migration: Create bot_config table...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS bot_config (
        id INT PRIMARY KEY DEFAULT 1,
        status ENUM('online', 'idle', 'dnd', 'invisible') DEFAULT 'online',
        activity_type INT DEFAULT 0,
        activity_name VARCHAR(128),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT single_row CHECK (id = 1)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✓ Created bot_config table');

    await connection.query(`
      INSERT IGNORE INTO bot_config (id, status, activity_type, activity_name)
      VALUES (1, 'online', 0, 'Protecting servers')
    `);

    console.log('✓ Inserted default configuration');
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
