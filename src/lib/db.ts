import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { MicroblogPost } from './entities/MicroblogPost';
import { MicroblogReaction } from './entities/MicroblogReaction';

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: !isProduction, // In production, use migrations
  logging: !isProduction,
  entities: [MicroblogPost, MicroblogReaction],
  subscribers: [],
  migrations: [],
});

let initializationPromise: Promise<DataSource> | null = null;

export async function getDataSource() {
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = AppDataSource.initialize().then((ds) => {
    return ds;
  }).catch(err => {
    initializationPromise = null;
    throw err;
  });

  return initializationPromise;
}

// Keep the interface for compatibility or refine it
export type { MicroblogPost as MicroblogPostEntity };
export type { MicroblogReaction as MicroblogReactionEntity };

export interface MicroblogPostSerializable {
  id: number;
  content: string;
  image_data: string | null;
  created_at: string;
  reactions?: MicroblogReactionSerializable[];
}

export interface MicroblogReactionSerializable {
  id: number;
  userId: string;
  username: string;
  userImage: string | null;
  emoji: string;
}
