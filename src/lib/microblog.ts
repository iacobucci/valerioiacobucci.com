import db, { MicroblogPost } from './db';

export async function getMicroblogPosts(limit = 20, offset = 0): Promise<MicroblogPost[]> {
  const stmt = db.prepare('SELECT * FROM microblog_posts ORDER BY created_at DESC LIMIT ? OFFSET ?');
  return stmt.all(limit, offset) as MicroblogPost[];
}

export async function addMicroblogPost(content: string, imageUrl?: string | null): Promise<number | bigint> {
  const stmt = db.prepare('INSERT INTO microblog_posts (content, image_url) VALUES (?, ?)');
  const result = stmt.run(content, imageUrl || null);
  return result.lastInsertRowid;
}
