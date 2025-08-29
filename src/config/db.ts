import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment');
}

export const pool = new Pool({
  connectionString,
  // you may add ssl options here for production
});

export async function initDb(): Promise<void> {
  // Create table if not exists
  const sql = `
    CREATE TABLE IF NOT EXISTS urls (
      id SERIAL PRIMARY KEY,
      original_url TEXT NOT NULL,
      short_code VARCHAR(64) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      clicks BIGINT DEFAULT 0
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
  `;
  await pool.query(sql);
}
