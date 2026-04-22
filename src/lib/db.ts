import { Pool } from 'pg';

export interface MicroblogPost {
  id: number;
  content: string;
  image_url: string | null;
  image_data: Buffer | null;
  created_at: string;
}

const isProduction = process.env.NODE_ENV === 'production';

// Configurazione Pool
const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

const pool = new Pool({
  ...poolConfig,
  // Disabilitiamo SSL di default a meno che non sia esplicitamente richiesto
  // perché una configurazione standard di Postgres su VPS non lo supporta senza certificati.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000, // 5 secondi di timeout per non bloccare il server
});

// Initialize schema
export async function initDb() {
  try {
    const client = await pool.connect();
    try {
      // Create table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS microblog_posts (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          image_url TEXT,
          image_data BYTEA,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migration: add image_data if it doesn't exist (for existing tables)
      await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
            WHERE table_name='microblog_posts' AND column_name='image_data') THEN
            ALTER TABLE microblog_posts ADD COLUMN image_data BYTEA;
          END IF;
        END $$;
      `);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('DATABASE_CONNECTION_ERROR:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      config: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        hasPassword: !!process.env.DB_PASSWORD,
        hasUrl: !!process.env.DATABASE_URL
      }
    });
    throw error;
  }
}

export default pool;
