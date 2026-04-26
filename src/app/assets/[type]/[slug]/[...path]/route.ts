import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

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

  const stats = fs.statSync(filePath);
  const etag = `W/"${stats.size}-${stats.mtime.getTime()}"`;
  const range = request.headers.get('range');
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

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

    if (start >= stats.size) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          'Content-Range': `bytes */${stats.size}`,
        },
      });
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const stream = Readable.toWeb(file) as ReadableStream;

    return new NextResponse(stream, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': contentType,
        'ETag': etag,
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    });
  }

  const file = fs.createReadStream(filePath);
  const stream = Readable.toWeb(file) as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': stats.size.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'ETag': etag,
      'Last-Modified': stats.mtime.toUTCString(),
    },
  });
}
