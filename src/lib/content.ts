import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const extension = "mdx";

export interface ContentMetadata {
  slug: string;
  type: string;
  title: string;
  category?: string;
  categories?: string[];
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
  preview?: boolean;
  preview_passcode?: string;
  selected?: boolean;
  song?: any;
  music?: any;
  [key: string]: unknown;
}

// In-memory cache for production
const contentCache = new Map<string, { data: ContentMetadata, mtime: number }>();

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

  // HMR Support in Development
  if (process.env.NODE_ENV === 'development') {
    try {
      // This dynamic import tells Turbopack to watch the content directory for changes.
      if (type === 'blog') {
        await import(`../../content/${slug}/${actualLocale}.mdx`);
      } else {
        await import(`../../content/${type}/${slug}/${actualLocale}.mdx`);
      }
    } catch (e) {
      // We don't actually need the import to succeed, just to be tracked.
    }
  }

  // Production Cache Logic
  try {
    const stats = fs.statSync(filePath);
    const mtime = stats.mtimeMs;
    const cached = contentCache.get(filePath);

    if (cached && cached.mtime === mtime) {
      return { 
        ...cached.data, 
        isFallback: cached.data.language !== locale 
      };
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    const parts = slug.split('/');
    const category = parts.length > 1 ? parts.slice(0, -1).join('/') : undefined;
    const categories = parts.length > 1 ? parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/')) : undefined;

    const postData: ContentMetadata = {
      ...data,
      slug,
      type,
      category,
      categories,
      isFallback: actualLocale !== locale,
      language: actualLocale,
      title: data.title || parts[parts.length - 1],
      date: data.date ? (data.date instanceof Date ? data.date.toISOString() : data.date) : undefined,
      updated: data.updated ? (data.updated instanceof Date ? data.updated.toISOString() : data.updated) : undefined,
      readingTime: calculateReadingTime(content),
      tags: data.tags || [],
      content,
      draft: data.draft === true,
      preview: data.preview === true,
      preview_passcode: data.preview_passcode ? String(data.preview_passcode) : undefined,
      selected: data.selected === true
    };

    contentCache.set(filePath, { data: postData, mtime });
    return postData;
  } catch (error) {
    console.error(`Error loading post ${slug}:`, error);
    return null;
  }
}

function findArticleSlugs(baseDir: string, currentDir = baseDir): string[] {
  if (!fs.existsSync(currentDir)) return [];
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  // If currentDir (other than baseDir) contains any .mdx file, treat currentDir as an article
  if (currentDir !== baseDir && entries.some(e => !e.isDirectory() && e.name.endsWith(`.${extension}`))) {
    return [path.relative(baseDir, currentDir)];
  }

  const slugs: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== '.git' && entry.name !== 'node_modules' && entry.name !== 'public' && entry.name !== 'apps') {
      const subPath = path.join(currentDir, entry.name);
      slugs.push(...findArticleSlugs(baseDir, subPath));
    }
  }
  return slugs;
}

export async function getPosts(type: string, locale: string, includeDrafts = false): Promise<ContentMetadata[]> {
  const contentDir = type === 'blog'
    ? path.join(process.cwd(), 'content')
    : path.join(process.cwd(), 'content', type);
  
  if (!fs.existsSync(contentDir)) {
    return [];
  }

  const slugs = type === 'blog'
    ? findArticleSlugs(contentDir)
    : fs.readdirSync(contentDir).filter(file => {
        const fullPath = path.join(contentDir, file);
        return fs.statSync(fullPath).isDirectory();
      });

  const allContent = await Promise.all(slugs.map(async (slug) => {
    return await getPost(type, locale, slug);
  }));

  return allContent
    .filter((content): content is ContentMetadata => content !== null)
    .filter((content) => includeDrafts || process.env.NODE_ENV === 'development' || !content.draft);
}
