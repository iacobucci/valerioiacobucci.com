import { NextRequest, NextResponse } from 'next/server';
import { getMicroblogPosts } from '@/lib/microblog';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const posts = await getMicroblogPosts(limit, offset);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Failed to fetch microblog posts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
