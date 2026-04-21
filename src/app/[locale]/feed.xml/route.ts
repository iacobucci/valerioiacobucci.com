import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/content';
import { getMicroblogPosts } from '@/lib/microblog';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const siteUrl = 'https://valerioiacobucci.com';
  
  const blogPosts = await getPosts('blog', locale);
  const microblogPosts = await getMicroblogPosts(50);
  
  // Combine and sort all types of posts
  const allItems = [
    ...blogPosts.map(p => ({ 
      title: p.title,
      slug: p.slug,
      date: p.date,
      description: p.description,
      feedType: 'blog' as const,
      url: `${siteUrl}/${locale}/blog/${p.slug}`
    })),
    ...microblogPosts.map(p => ({
      title: p.content.slice(0, 50),
      slug: '', 
      date: p.created_at,
      description: p.content,
      feedType: 'microblog' as const,
      url: `${siteUrl}/${locale}/microblog`
    }))
  ].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const feedItems = allItems.map((item) => {
    const url = item.url;
    const description = (item.description as string) || '';
    const date = item.date ? new Date(item.date).toUTCString() : new Date().toUTCString();
    
    return `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="false">${url}-${item.date}</guid>
      <pubDate>${date}</pubDate>
      <description><![CDATA[${description}]]></description>
    </item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Valerio Iacobucci</title>
    <link>${siteUrl}</link>
    <description>Thoughts on engineering and whatever else.</description>
    <language>${locale}</language>
    <atom:link href="${siteUrl}/${locale}/feed.xml" rel="self" type="application/rss+xml" />
    ${feedItems}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
