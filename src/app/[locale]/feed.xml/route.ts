import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/content';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const siteUrl = 'https://valerioiacobucci.com';
  
  const blogPosts = await getPosts('blog', locale);
  const favorites = await getPosts('favorites', locale);
  
  const allPosts = [...blogPosts, ...favorites].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const feedItems = allPosts.map((post) => {
    const url = `${siteUrl}/${locale}/${post.type}/${post.slug}`;
    const description = (post.description as string) || '';
    const date = post.date ? new Date(post.date).toUTCString() : new Date().toUTCString();
    
    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
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
