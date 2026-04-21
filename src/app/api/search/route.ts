import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/content';
import { routing } from '@/i18n/routing';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'en';
  
  const blogPosts = await getPosts('blog', locale);
  const favorites = await getPosts('favorites', locale);
  
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
    // Static pages
    { title: 'Home', type: 'page', href: '/' },
    { title: 'Blog', type: 'page', href: '/blog' },
    { title: 'Favorites', type: 'page', href: '/favorites' },
    { title: 'CV', type: 'page', href: '/cv' },
    { title: 'Projects', type: 'page', href: '/projects' },
  ];
  
  return NextResponse.json(results);
}
