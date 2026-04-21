import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/content';
import { getMicroblogPosts } from '@/lib/microblog';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'en';
  const blogPosts = await getPosts('blog', locale);
  const microblogPosts = await getMicroblogPosts(100);

  // Load translations for static pages
  let messages;
  try {
    messages = (await import(`../../../../messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`../../../../messages/en.json`)).default;
  }

  const nav = messages.nav || {};

  const results = [
    ...blogPosts.map(p => ({
      title: p.title,
      type: 'blog',
      href: `/blog/${p.slug}`,
      description: p.description
    })),
    ...microblogPosts.map(p => ({
      title: p.content.slice(0, 50) + (p.content.length > 50 ? '...' : ''),
      type: 'microblog',
      href: `/microblog`,
      description: p.content
    })),
    // Localized Static pages
    { title: nav.home || 'Home', type: 'page', href: '/' },
    { title: nav.blog || 'Blog', type: 'page', href: '/blog' },
    { title: nav.cv || 'CV', type: 'page', href: '/cv' },
    { title: nav.microblog || 'Microblog', type: 'page', href: '/microblog' },
    { title: nav.projects || 'Projects', type: 'page', href: '/projects' },
  ];
  
  return NextResponse.json(results);
}
