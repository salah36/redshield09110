// Run MEMBER role migration on TiDB Cloud
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from root
dotenv.config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env file');
  process.exit(1);
}

async function runMigration() {
  const dbUrl = new URL(DATABASE_URL);

  const connection = await mysql.createConnection({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port) || 4000,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.slice(1),
    ssl: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
    },
  });

  console.log('Connected to TiDB Cloud');

  try {
    // Add MEMBER to role ENUM
    console.log('\nAdding MEMBER to role ENUM...');
    await connection.execute(`
      ALTER TABLE dashboard_users
      MODIFY COLUMN role ENUM('OWNER', 'CONTRIBUTOR', 'SERVER_ADMIN', 'MEMBER') DEFAULT 'MEMBER'
    `);
    console.log('✓ MEMBER role added successfully');

    // Show current table structure
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM dashboard_users WHERE Field = 'role'
    `);
    console.log('\nUpdated role column:', columns[0]);

    // Show current users
    const [users] = await connection.execute(`
      SELECT discord_user_id, username, role FROM dashboard_users ORDER BY role, last_seen DESC
    `);
    console.log('\nCurrent users:');
    users.forEach(u => console.log(`  - ${u.username} (${u.role})`));

  } catch (error) {
    console.error('Migration error:', error.message);
  } finally {
    await connection.end();
    console.log('\nConnection closed');
  }
}

runMigration();
