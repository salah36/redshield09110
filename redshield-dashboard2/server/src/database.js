import mysql from 'mysql2/promise';
import { config } from './config.js';

// Parse the database URL
const dbUrl = new URL(config.database.url);

let poolInstance = null;

function createPool() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTiDB = dbUrl.hostname?.includes('tidbcloud') || dbUrl.hostname?.includes('tidb');

  // TiDB Cloud requires SSL with rejectUnauthorized: false
  // since they use their own CA certificate
  let sslConfig = false;
  if (isProduction || isTiDB) {
    sslConfig = {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
    };
  }

  console.log(`Database config: host=${dbUrl.hostname}, port=${dbUrl.port}, db=${dbUrl.pathname.slice(1)}, ssl=${!!sslConfig}`);

  return mysql.createPool({
    host: dbUrl.hostname || 'localhost',
    port: parseInt(dbUrl.port) || 4000, // TiDB default port is 4000
    user: decodeURIComponent(dbUrl.username) || 'root',
    password: decodeURIComponent(dbUrl.password) || '',
    database: dbUrl.pathname.slice(1) || 'redshield',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: sslConfig,
    connectTimeout: 30000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });
}

export function getPool() {
  if (!poolInstance) {
    poolInstance = createPool();
  }
  return poolInstance;
}

export const pool = getPool();
