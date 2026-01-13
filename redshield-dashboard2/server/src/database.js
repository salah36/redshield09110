import mysql from 'mysql2/promise';
import { config } from './config.js';

// Parse the database URL
const dbUrl = new URL(config.database.url);

let poolInstance = null;

function createPool() {
  const isProduction = process.env.NODE_ENV === 'production';

  return mysql.createPool({
    host: dbUrl.hostname || 'localhost',
    port: parseInt(dbUrl.port) || 3306,
    user: dbUrl.username || 'root',
    password: dbUrl.password || '',
    database: dbUrl.pathname.slice(1) || 'redshield',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: isProduction ? { rejectUnauthorized: true } : false,
  });
}

export function getPool() {
  if (!poolInstance) {
    poolInstance = createPool();
  }
  return poolInstance;
}

export const pool = getPool();
