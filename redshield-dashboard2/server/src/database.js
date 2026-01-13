import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

let poolInstance = null;

function createPool() {
  const isProduction = process.env.NODE_ENV === 'production';

  return new Pool({
    connectionString: config.database.url,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

// Wrapper to maintain MySQL-like API compatibility
// MySQL: const [rows] = await pool.execute(query, params)
// PostgreSQL: const { rows } = await pool.query(query, params)
class PoolWrapper {
  constructor(pgPool) {
    this.pgPool = pgPool;
  }

  // Convert MySQL-style ? placeholders to PostgreSQL $1, $2, etc.
  convertPlaceholders(query) {
    let index = 0;
    return query.replace(/\?/g, () => `$${++index}`);
  }

  // Execute query and return MySQL-style [rows, fields] format
  async execute(query, params = []) {
    const pgQuery = this.convertPlaceholders(query);
    const result = await this.pgPool.query(pgQuery, params);

    // For INSERT/UPDATE/DELETE, add affectedRows for compatibility
    if (result.command === 'INSERT' || result.command === 'UPDATE' || result.command === 'DELETE') {
      result.rows.affectedRows = result.rowCount;
      // For INSERT, try to get the inserted ID if RETURNING was used
      if (result.command === 'INSERT' && result.rows.length > 0 && result.rows[0].id) {
        result.rows.insertId = result.rows[0].id;
      }
    }

    return [result.rows, result.fields];
  }

  // Alias for execute (some code might use query)
  async query(query, params = []) {
    return this.execute(query, params);
  }

  // Get a connection from the pool (for transactions)
  async getConnection() {
    const client = await this.pgPool.connect();
    return new ConnectionWrapper(client, this);
  }
}

// Wrapper for individual connections (used in transactions)
class ConnectionWrapper {
  constructor(client, poolWrapper) {
    this.client = client;
    this.poolWrapper = poolWrapper;
  }

  async execute(query, params = []) {
    const pgQuery = this.poolWrapper.convertPlaceholders(query);
    const result = await this.client.query(pgQuery, params);

    if (result.command === 'INSERT' || result.command === 'UPDATE' || result.command === 'DELETE') {
      result.rows.affectedRows = result.rowCount;
      if (result.command === 'INSERT' && result.rows.length > 0 && result.rows[0].id) {
        result.rows.insertId = result.rows[0].id;
      }
    }

    return [result.rows, result.fields];
  }

  async beginTransaction() {
    await this.client.query('BEGIN');
  }

  async commit() {
    await this.client.query('COMMIT');
  }

  async rollback() {
    await this.client.query('ROLLBACK');
  }

  release() {
    this.client.release();
  }
}

export function getPool() {
  if (!poolInstance) {
    const pgPool = createPool();
    poolInstance = new PoolWrapper(pgPool);
  }
  return poolInstance;
}

export const pool = getPool();
