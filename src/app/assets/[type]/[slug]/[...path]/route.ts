import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string; path: string[] }> }
) {
  const { type, slug, path: pathSegments } = await params;
  const filename = pathSegments.join('/');
  
  // Security: prevent path traversal
  if (filename.includes('..') || slug.includes('..') || type.includes('..')) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  const filePath = type === 'blog'
    ? path.join(process.cwd(), 'content', slug, filename)
    : path.join(process.cwd(), 'content', type, slug, filename);

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const extension = path.extname(filename).toLowerCase();
  
  const contentTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
  };

  const contentType = contentTypes[extension] || 'application/octet-stream';

  const stats = fs.statSync(filePath);
  const etag = `W/"${stats.size}-${stats.mtime.getTime()}"`;

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'ETag': etag,
      'Last-Modified': stats.mtime.toUTCString(),
    },
  });
}
