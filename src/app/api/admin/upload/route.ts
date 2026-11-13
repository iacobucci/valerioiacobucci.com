import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/auth';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { spawnSync } from 'child_process';
import { invalidateTodoCache } from '@/lib/todo-cache';
import { invalidateLinksCache } from '@/lib/links';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CONTENT_PATH = path.join(process.cwd(), 'content');

function resolveAndValidateDir(relativePath: string): string {
  const fullPath = path.resolve(CONTENT_PATH, relativePath || '');
  if (!fullPath.startsWith(CONTENT_PATH)) {
    throw new Error("Invalid path: Out of bounds");
  }
  return fullPath;
}

export async function POST(request: NextRequest) {
  // 1. Authorize admin immediately before reading/streaming any body data
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!request.body) {
    return NextResponse.json({ error: "No request body provided" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const dir = searchParams.get('dir') || '';
  const filename = searchParams.get('filename');
  const isZip = searchParams.get('extractZip') === 'true';

  if (!filename) {
    return NextResponse.json({ error: "Missing filename parameter" }, { status: 400 });
  }

  const safeFilename = path.basename(filename);
  if (!safeFilename || safeFilename === '.' || safeFilename === '..') {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  let dirPath: string;
  try {
    dirPath = resolveAndValidateDir(dir);
  } catch {
    return NextResponse.json({ error: "Invalid directory path" }, { status: 400 });
  }

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const nodeStream = Readable.fromWeb(request.body as any);

  if (isZip) {
    const tempZipPath = path.join('/tmp', `upload-${Date.now()}-${Math.random().toString(36).slice(2)}.zip`);
    const writeStream = fs.createWriteStream(tempZipPath);

    try {
      await pipeline(nodeStream, writeStream);

      const unzipResult = spawnSync('unzip', ['-o', tempZipPath, '-d', dirPath]);
      if (unzipResult.status !== 0) {
        const errMsg = unzipResult.stderr?.toString() || 'Failed to extract ZIP archive';
        return NextResponse.json({ error: errMsg }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "ZIP extracted successfully" });
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Upload stream failed" }, { status: 500 });
    } finally {
      if (fs.existsSync(tempZipPath)) {
        try {
          fs.unlinkSync(tempZipPath);
        } catch {}
      }
    }
  } else {
    const fullPath = path.join(dirPath, safeFilename);
    if (!path.resolve(fullPath).startsWith(CONTENT_PATH)) {
      return NextResponse.json({ error: "Invalid file target path" }, { status: 400 });
    }

    const writeStream = fs.createWriteStream(fullPath);

    try {
      await pipeline(nodeStream, writeStream);

      if (safeFilename === 'todo.txt') {
        invalidateTodoCache();
      } else if (safeFilename === 'links.json') {
        invalidateLinksCache();
      }

      return NextResponse.json({ success: true, filename: safeFilename });
    } catch (err: any) {
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch {}
      }
      return NextResponse.json({ error: err.message || "File write stream failed" }, { status: 500 });
    }
  }
}
