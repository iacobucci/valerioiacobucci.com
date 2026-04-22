import { Pool } from 'pg';

export interface MicroblogPost {
  id: number;
  content: string;
  image_data: string | null; // Stored as Base64 string for serializability
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
      // Create table if not exists with all columns
      await client.query(`
        CREATE TABLE IF NOT EXISTS microblog_posts (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          image_data BYTEA,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
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
