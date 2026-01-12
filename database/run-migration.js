import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    let connection;

    try {
        console.log('Connecting to database...');

        // Parse DATABASE_URL from .env or use default
        const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root@localhost:3306/redshield';
        const dbUrl = new URL(DATABASE_URL);

        connection = await mysql.createConnection({
            host: dbUrl.hostname || 'localhost',
            port: parseInt(dbUrl.port) || 3306,
            user: dbUrl.username || 'root',
            password: dbUrl.password || '',
            database: dbUrl.pathname.slice(1) || 'redshield',
            insecureAuth: true,
            multipleStatements: true
        });

        console.log('✅ Connected to database');

        // Read migration file
        const migrationPath = join(__dirname, 'migration_dashboard_users.sql');
        const sql = readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');

        // Execute migration
        await connection.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('\nNew table created: dashboard_users');
        console.log('Columns:');
        console.log('  - discord_user_id (PRIMARY KEY)');
        console.log('  - username, discriminator, avatar');
        console.log('  - linked_server_id (for server linking)');
        console.log('  - role (OWNER, CONTRIBUTOR, SERVER_ADMIN)');
        console.log('  - is_active, last_seen');
        console.log('  - created_at, updated_at');

    } catch (error) {
        console.error('❌ Migration failed:');
        console.error(error.message);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Solution:');
            console.error('1. Check your MySQL credentials in .env file');
            console.error('2. Update DATABASE_URL with correct password:');
            console.error('   DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/redshield');
            console.error('3. Or run this in MySQL Workbench/phpMyAdmin manually');
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
