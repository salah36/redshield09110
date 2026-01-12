import pool from './database/db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    try {
        console.log('Running migration to add dashboard_users table...\n');

        // SQL to create dashboard_users table
        const sql = `
-- Dashboard Users Table (for server linking and access management)
CREATE TABLE IF NOT EXISTS dashboard_users (
    discord_user_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    discriminator VARCHAR(10),
    avatar VARCHAR(255),
    linked_server_id VARCHAR(20) NULL,
    role ENUM('OWNER', 'CONTRIBUTOR', 'SERVER_ADMIN') DEFAULT 'CONTRIBUTOR',
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dashboard_linked_server (linked_server_id),
    INDEX idx_dashboard_role (role),
    INDEX idx_dashboard_last_seen (last_seen DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

        // Execute migration
        await pool.execute(sql);

        console.log('✅ Migration completed successfully!\n');
        console.log('New table created: dashboard_users');
        console.log('Columns:');
        console.log('  ✓ discord_user_id (PRIMARY KEY)');
        console.log('  ✓ username, discriminator, avatar');
        console.log('  ✓ linked_server_id (for server linking by Owner)');
        console.log('  ✓ role (OWNER, CONTRIBUTOR, SERVER_ADMIN)');
        console.log('  ✓ is_active, last_seen (for online/offline tracking)');
        console.log('  ✓ created_at, updated_at\n');
        console.log('Indexes created:');
        console.log('  ✓ idx_dashboard_linked_server');
        console.log('  ✓ idx_dashboard_role');
        console.log('  ✓ idx_dashboard_last_seen\n');
        console.log('🎉 Database is ready for the new dashboard features!');

        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:');
        console.error(error.message);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Solutions:');
            console.error('1. Check your MySQL credentials in .env file');
            console.error('2. Update DATABASE_URL with correct password:');
            console.error('   DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/redshield');
            console.error('\n3. Or use a MySQL GUI tool (MySQL Workbench, phpMyAdmin, HeidiSQL)');
            console.error('   and run: database/migration_dashboard_users.sql');
        } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('ℹ️  Table already exists, skipping migration.');
            process.exit(0);
        }

        await pool.end();
        process.exit(1);
    }
}

runMigration();
