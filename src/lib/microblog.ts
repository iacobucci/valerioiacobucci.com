import pool, { initDb, MicroblogPost } from './db';

// Ensure the table exists on first use
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await initDb();
    isInitialized = true;
  }
}

export async function getMicroblogPosts(limit = 20, offset = 0): Promise<MicroblogPost[]> {
  await ensureInitialized();
  const res = await pool.query(
    'SELECT * FROM microblog_posts ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return res.rows;
}

export async function addMicroblogPost(content: string, imageUrl?: string | null, imageData?: Buffer | null): Promise<number> {
  await ensureInitialized();
  const res = await pool.query(
    'INSERT INTO microblog_posts (content, image_url, image_data) VALUES ($1, $2, $3) RETURNING id',
    [content, imageUrl || null, imageData || null]
  );
  return res.rows[0].id;
}
