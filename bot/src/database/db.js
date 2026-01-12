import mysql from 'mysql2/promise';
import config from '../config.js';

// Parse DATABASE_URL
const dbUrl = new URL(config.database.url);

const isProduction = process.env.NODE_ENV === 'production';

export const pool = mysql.createPool({
    host: dbUrl.hostname || 'localhost',
    port: parseInt(dbUrl.port) || 3306,
    user: dbUrl.username || 'root',
    password: dbUrl.password || '',
    database: dbUrl.pathname.slice(1) || 'redshield',
    insecureAuth: !isProduction,
    supportBigNumbers: true,
    bigNumberStrings: false,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: isProduction ? { rejectUnauthorized: true } : false,
});

export default pool;
