import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const extension = "mdx";

export interface ContentMetadata {
  slug: string;
  title: string;
  date?: string;
  order?: number;
  [key: string]: any;
}

export async function getContentMDX(type: string, slug: string, locale: string) {
	try {
		// Try requested locale
		const mod = await import(
			`@/../content/${type}/${slug}/${locale}.${extension}`
		);
		return { content: mod, isFallback: false };
	} catch (e) {
		// If requested locale is not English, try English as fallback
		if (locale !== 'en') {
			try {
				const mod = await import(
					`@/../content/${type}/${slug}/en.${extension}`
				);
				return { content: mod, isFallback: true };
			} catch (fallbackError) {
				console.error(`Error importing fallback MDX: content/${type}/${slug}/en.${extension}`, fallbackError);
				return null;
			}
		}

		console.error(`Error importing MDX: content/${type}/${slug}/${locale}.${extension}`, e);
		return null;
	}
}

export async function getAllContent(type: string, locale: string): Promise<ContentMetadata[]> {
  const contentDir = path.join(process.cwd(), 'content', type);
  
  if (!fs.existsSync(contentDir)) {
    return [];
  }

  const slugs = fs.readdirSync(contentDir).filter(file =>
    fs.statSync(path.join(contentDir, file)).isDirectory()
  );

  const allContent = slugs.map(slug => {
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
    const { data } = matter(fileContents);

    return {
      slug,
      isFallback,
      title: data.title || slug,
      date: data.date ? (data.date instanceof Date ? data.date.toISOString() : data.date) : undefined,
      order: data.order,
      ...data
    } as ContentMetadata;
  }).filter(content => content !== null) as ContentMetadata[];

  return allContent;
}

/**
 * @deprecated Use getContentMDX instead
 */
export async function getPostMDX(slug: string, locale: string) {
	return getContentMDX('blog', slug, locale);
}
