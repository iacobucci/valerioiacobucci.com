import { getMicroblogPost, getMicroblogPostByHash } from '@/lib/microblog';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let post;
  
  if (/^\d+$/.test(id)) {
    post = await getMicroblogPost(parseInt(id) + 1);
  } else {
    post = await getMicroblogPostByHash(id);
  }

  if (!post || !post.image_data) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const buffer = Buffer.from(post.image_data, 'base64');
  
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
