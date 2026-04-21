import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const extension = "mdx";

export interface ContentMetadata {
  slug: string;
  title: string;
  date?: string;
  readingTime?: number;
  tags?: string[];
  content: string;
  order?: number;
  description?: string;
  isFallback: boolean;
  [key: string]: unknown;
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export async function getPost(type: string, locale: string, slug: string): Promise<ContentMetadata | null> {
  const contentDir = path.join(process.cwd(), 'content', type);
  let filePath = path.join(contentDir, slug, `${locale}.${extension}`);
  let isFallback = false;

  if (!fs.existsSync(filePath) && locale !== 'en') {
    filePath = path.join(contentDir, slug, `en.${extension}`);
    isFallback = true;
  }

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    isFallback,
    title: data.title || slug,
    date: data.date ? (data.date instanceof Date ? data.date.toISOString() : data.date) : undefined,
    readingTime: calculateReadingTime(content),
    tags: data.tags || [],
    content,
    ...data
  } as ContentMetadata;
}

export async function getPosts(type: string, locale: string): Promise<ContentMetadata[]> {
  const contentDir = path.join(process.cwd(), 'content', type);
  
  if (!fs.existsSync(contentDir)) {
    return [];
  }

  const slugs = fs.readdirSync(contentDir).filter(file =>
    fs.statSync(path.join(contentDir, file)).isDirectory()
  );

  const allContent = await Promise.all(slugs.map(async (slug) => {
    return await getPost(type, locale, slug);
  }));

  return allContent.filter((content): content is ContentMetadata => content !== null);
}
