import { pool } from '../config/db';
import { UrlRow } from '../models/urlModel';
import { generateCode } from '../utils/shortener';

const MAX_RETRIES = 5;

/**
 * Find a url row by its short code
 */
export async function findByShortCode(shortCode: string): Promise<UrlRow | null> {
  const res = await pool.query('SELECT * FROM urls WHERE short_code = $1 LIMIT 1', [shortCode]);
  return res.rows[0] ?? null;
}

/**
 * Find by original long URL (to avoid duplicates)
 */
export async function findByOriginalUrl(originalUrl: string): Promise<UrlRow | null> {
  const res = await pool.query('SELECT * FROM urls WHERE original_url = $1 LIMIT 1', [originalUrl]);
  return res.rows[0] ?? null;
}

/**
 * Create a short url. If customCode provided, attempt to use it (error if taken).
 * Otherwise generate a random code and retry on collision.
 */
export async function createShortUrl(originalUrl: string, customCode?: string): Promise<UrlRow> {
  // optional: check if original already exists and return it (de-duplicate)
  const existing = await findByOriginalUrl(originalUrl);
  if (existing && !customCode) {
    return existing;
  }

  if (customCode) {
    // try insert with provided code
    try {
      const r = await pool.query(
        'INSERT INTO urls (original_url, short_code) VALUES ($1, $2) RETURNING *',
        [originalUrl, customCode]
      );
      return r.rows[0];
    } catch (err: any) {
      // Postgres unique violation code is '23505'
      if (err.code === '23505') {
        throw new Error('custom_code_taken');
      }
      throw err;
    }
  }

  // auto-generate code with limited retries on collision
  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = generateCode();
    try {
      const r = await pool.query(
        'INSERT INTO urls (original_url, short_code) VALUES ($1, $2) RETURNING *',
        [originalUrl, code]
      );
      return r.rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        // collision, try again
        continue;
      }
      throw err;
    }
  }
  throw new Error('could_not_generate_unique_code');
}

/**
 * Increment click count (best-effort, don't block redirect)
 */
export async function incrementClicks(id: number): Promise<void> {
  try {
    await pool.query('UPDATE urls SET clicks = clicks + 1 WHERE id = $1', [id]);
  } catch (err) {
    // swallow errors — analytics should not break redirects
    console.error('Failed to increment clicks:', err);
  }
}

/**
 * Get stats for a short url
 */
export async function getStatsByCode(shortCode: string) {
  const res = await pool.query(
    'SELECT id, original_url, short_code, created_at, clicks FROM urls WHERE short_code = $1 LIMIT 1',
    [shortCode]
  );
  return res.rows[0] ?? null;
}

/**
 * List all urls
 */
export async function listAllUrls() {
  const res = await pool.query(
    'SELECT id, original_url, short_code, created_at, clicks FROM urls ORDER BY created_at DESC'
  );
  return res.rows;
}

/**
 * Delete a url by short_code
 */
export async function deleteUrlByCode(code: string) {
  const res = await pool.query(
    'DELETE FROM urls WHERE short_code = $1 RETURNING *',
    [code]
  );
  return res.rows[0]; // return deleted row or undefined
}

/**
 * Update a url's original_url by short_code
 */
export async function updateUrlByCode(code: string, newUrl: string) {
  const res = await pool.query(
    `UPDATE urls 
     SET original_url = $1 
     WHERE short_code = $2 
     RETURNING *`,
    [newUrl, code]
  );
  return res.rows[0]; // updated row or undefined
}
