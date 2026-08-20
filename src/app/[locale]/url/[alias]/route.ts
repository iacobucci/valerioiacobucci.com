import { NextRequest, NextResponse } from 'next/server';
import { getLinkByAlias } from '@/lib/links';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; alias: string }> }
) {
  const { alias } = await params;

  if (!alias) {
    return new NextResponse('Short link not found', { status: 404 });
  }

  const targetUrl = getLinkByAlias(alias);

  if (!targetUrl) {
    return new NextResponse('Short link not found', { status: 404 });
  }

  // Normalize destination URL
  let destination = targetUrl.trim();
  if (!destination.startsWith('http://') && !destination.startsWith('https://') && !destination.startsWith('/')) {
    destination = `https://${destination}`;
  }

  if (destination.startsWith('/')) {
    destination = new URL(destination, request.url).toString();
  }

  return NextResponse.redirect(destination, 307);
}
