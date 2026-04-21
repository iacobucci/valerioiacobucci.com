import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/content';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'en';
  const blogPosts = await getPosts('blog', locale);
  const favorites = await getPosts('favorites', locale);

  // Load translations for static pages
  let messages;
  try {
    messages = (await import(`../../../../messages/${locale}.json`)).default;
  } catch (e) {
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
    ...favorites.map(p => ({
      title: p.title,
      type: 'favorites',
      href: `/favorites/${p.slug}`,
      description: p.description
    })),
    // Localized Static pages
    { title: nav.home || 'Home', type: 'page', href: '/' },
    { title: nav.blog || 'Blog', type: 'page', href: '/blog' },
    { title: nav.cv || 'CV', type: 'page', href: '/cv' },
    { title: nav.favorites || 'Favorites', type: 'page', href: '/favorites' },
    { title: nav.projects || 'Projects', type: 'page', href: '/projects' },
  ];
  
  return NextResponse.json(results);
}
