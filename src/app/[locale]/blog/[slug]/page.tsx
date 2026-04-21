import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  const blogDir = path.join(process.cwd(), 'content/blog');
  const slugs = fs.readdirSync(blogDir);
  
  const params: {locale: string, slug: string}[] = [];
  
  slugs.forEach(slug => {
    routing.locales.forEach(locale => {
      params.push({ locale, slug });
    });
  });
  
  return params;
}

export default async function BlogPost({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const filePath = path.join(
    process.cwd(),
    'content/blog',
    slug,
    locale,
    'index.mdx'
  );

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { content, data } = matter(fileContent);

  return (
    <article className="max-w-3xl mx-auto py-20 px-6 prose dark:prose-invert">
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-2">{data.title}</h1>
        <time className="text-zinc-500">{data.date?.toString()}</time>
      </header>
      <MDXRemote source={content} />
    </article>
  );
}
