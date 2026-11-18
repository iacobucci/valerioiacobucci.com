import fs from 'fs';
import path from 'path';
import { CVParsedData, parseCVMarkdown } from './cv-parser';

export * from './cv-parser';

const contentRoot = path.join(process.cwd(), 'content');

// In-memory cache for production with mtime validation
const cvCache = new Map<string, { data: CVParsedData; mtime: number }>();

export function invalidateCVCache(): void {
  cvCache.clear();
}

export function getCV(locale: string): CVParsedData {
  const cvDir = path.join(contentRoot, 'public', 'cv');
  let filePath = path.join(cvDir, `${locale}.mdx`);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(cvDir, 'en.mdx');
  }

  if (!fs.existsSync(filePath)) {
    return {
      title: 'Curriculum Vitae',
      updatedTo: 'Updated to',
      downloadPdf: 'Download PDF',
      image: '/public/cv/face.jpg',
      sections: [],
    };
  }

  const stats = fs.statSync(filePath);
  const mtime = stats.mtimeMs;
  const cached = cvCache.get(filePath);

  if (cached && cached.mtime === mtime) {
    return cached.data;
  }

  const rawMdx = fs.readFileSync(filePath, 'utf8');
  const parsed = parseCVMarkdown(rawMdx);

  cvCache.set(filePath, { data: parsed, mtime });
  return parsed;
}
