import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/content';
import { projects } from '@/lib/projects';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'en';
  const blogPosts = await getPosts('blog', locale, true);

  // Load translations for static pages and projects
  let messages;
  try {
    messages = (await import(`../../../../messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`../../../../messages/en.json`)).default;
  }

  const nav = messages.nav || {};
  const projectList = messages.projects?.list || {};

  const results = [
    ...blogPosts.map(p => ({
      title: p.title,
      type: 'blog',
      href: `/blog/${p.slug}`,
      description: p.description,
      draft: p.draft,
      isFavorite: p.selected
    })),
    ...projects.map(p => ({
      title: projectList[p.slug]?.title || p.slug,
      type: 'project',
      href: `/projects#${p.slug}`,
      description: projectList[p.slug]?.description || '',
      isFavorite: false
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
