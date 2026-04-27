import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const filename = pathSegments.join('/');
  
  // Security: prevent path traversal
  if (filename.includes('..')) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'content', 'apps', filename);

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const stats = fs.statSync(filePath);
  
  // If it's a directory, try to serve index.html
  if (stats.isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return NextResponse.redirect(new URL(request.nextUrl.pathname + '/index.html', request.url));
    }
    return new NextResponse('Directory listing not allowed', { status: 403 });
  }

  const etag = `W/"${stats.size}-${stats.mtime.getTime()}"`;
  const extension = path.extname(filename).toLowerCase();

  const contentTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
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
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
  };

  const contentType = contentTypes[extension] || 'application/octet-stream';

  const file = fs.createReadStream(filePath);
  const stream = Readable.toWeb(file) as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': stats.size.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache, no-store, must-revalidate', // No cache for apps updated via editor
      'ETag': etag,
      'Last-Modified': stats.mtime.toUTCString(),
    },
  });
}
