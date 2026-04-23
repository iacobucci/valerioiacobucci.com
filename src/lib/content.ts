import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const extension = "mdx";

export interface ContentMetadata {
  slug: string;
  type: string;
  title: string;
  date?: string;
  updated?: string;
  readingTime?: number;
  tags?: string[];
  content: string;
  order?: number;
  description?: string;
  cover?: string;
  isFallback: boolean;
  language: string;
  draft?: boolean;
  selected?: boolean;
  [key: string]: unknown;
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export async function getPost(type: string, locale: string, slug: string): Promise<ContentMetadata | null> {
  const contentDir = type === 'blog'
    ? path.join(process.cwd(), 'content', slug)
    : path.join(process.cwd(), 'content', type, slug);
  
  if (!fs.existsSync(contentDir) || !fs.statSync(contentDir).isDirectory()) {
    return null;
  }

  let filePath = path.join(contentDir, `${locale}.${extension}`);
  let actualLocale = locale;
  let isFallback = false;

  if (!fs.existsSync(filePath)) {
    // Try English
    const enPath = path.join(contentDir, `en.${extension}`);
    if (fs.existsSync(enPath)) {
      filePath = enPath;
      actualLocale = 'en';
      isFallback = true;
    } else {
      // Try any mdx file
      const files = fs.readdirSync(contentDir).filter(f => f.endsWith(`.${extension}`));
      if (files.length > 0) {
        filePath = path.join(contentDir, files[0]);
        actualLocale = files[0].replace(`.${extension}`, "");
        isFallback = true;
      } else {
        return null;
      }
    }
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    type,
    isFallback,
    language: actualLocale,
    title: data.title || slug,
    date: data.date ? (data.date instanceof Date ? data.date.toISOString() : data.date) : undefined,
    updated: data.updated ? (data.updated instanceof Date ? data.updated.toISOString() : data.updated) : undefined,
    readingTime: calculateReadingTime(content),
    tags: data.tags || [],
    content,
    draft: data.draft === true,
    selected: data.selected === true,
    ...data
  } as ContentMetadata;
}

export async function getPosts(type: string, locale: string, includeDrafts = false): Promise<ContentMetadata[]> {
  const contentDir = type === 'blog'
    ? path.join(process.cwd(), 'content')
    : path.join(process.cwd(), 'content', type);
  
  if (!fs.existsSync(contentDir)) {
    return [];
  }

  const slugs = fs.readdirSync(contentDir).filter(file => {
    const fullPath = path.join(contentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (type === 'blog') {
        // Only include directories that have at least one .mdx file
        return fs.readdirSync(fullPath).some(f => f.endsWith(`.${extension}`));
      }
      return true;
    }
    return false;
  });

  const allContent = await Promise.all(slugs.map(async (slug) => {
    return await getPost(type, locale, slug);
  }));

  return allContent
    .filter((content): content is ContentMetadata => content !== null)
    .filter((content) => includeDrafts || process.env.NODE_ENV === 'development' || !content.draft);
}
