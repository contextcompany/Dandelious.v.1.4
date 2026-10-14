// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Cloud SQL is disabled by default per configuration
export const isCloudSqlEnabled = process.env.ENABLE_CLOUDSQL === 'true' && Boolean(process.env.SQL_HOST);

declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!isCloudSqlEnabled) {
    return null;
  }
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.warn('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle only if pool exists
export const db = pool ? drizzle(pool, { schema }) : (null as any);

