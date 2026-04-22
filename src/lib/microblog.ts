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
  
  // Convert binary image_data (Buffer) to Base64 string to be serializable
  return res.rows.map(row => ({
    ...row,
    image_data: row.image_data ? row.image_data.toString('base64') : null
  }));
}

export async function addMicroblogPost(content: string, imageData?: Buffer | null): Promise<number> {
  await ensureInitialized();
  const res = await pool.query(
    'INSERT INTO microblog_posts (content, image_data) VALUES ($1, $2) RETURNING id',
    [content, imageData || null]
  );
  return res.rows[0].id;
}
