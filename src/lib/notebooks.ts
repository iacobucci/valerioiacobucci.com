import fs from 'fs';
import path from 'path';
import { NotebookFileData } from '@/components/notebook/types';

const contentRoot = path.join(process.cwd(), 'content');

// In-memory cache for production
const notebookCache = new Map<string, { data: NotebookFileData; mtime: number }>();

export function invalidateNotebookCache(fullPath?: string): void {
  if (fullPath) {
    notebookCache.delete(fullPath);
  } else {
    notebookCache.clear();
  }
}

export function resolveNotebookPath(
  src: string,
  slug?: string
): { fullPath: string; relativePath: string } {
  let normalizedSrc = src.trim();
  if (!normalizedSrc.endsWith('.json')) {
    normalizedSrc += '.json';
  }

  // Prevent directory traversal attacks
  const safeSrc = path.normalize(normalizedSrc).replace(/^(\.\.[\/\\])+/, '');

  // 1. Explicit relative path: ./foo.json
  if (normalizedSrc.startsWith('./') && slug) {
    const rel = path.join(slug, normalizedSrc.slice(2));
    const full = path.join(contentRoot, rel);
    return { fullPath: full, relativePath: rel };
  }

  // 2. Explicit absolute relative to content: /notebooks/foo.json
  if (normalizedSrc.startsWith('/')) {
    const rel = normalizedSrc.slice(1);
    const full = path.join(contentRoot, rel);
    return { fullPath: full, relativePath: rel };
  }

  // 3. Article-specific: check content/<slug>/notebooks/<src> or content/<slug>/<src>
  if (slug) {
    const slugNb = path.join(contentRoot, slug, 'notebooks', safeSrc);
    if (fs.existsSync(slugNb)) {
      return { fullPath: slugNb, relativePath: path.join(slug, 'notebooks', safeSrc) };
    }
    const slugDirect = path.join(contentRoot, slug, safeSrc);
    if (fs.existsSync(slugDirect)) {
      return { fullPath: slugDirect, relativePath: path.join(slug, safeSrc) };
    }
  }

  // 4. Shared notebooks: content/notebooks/<src>
  const sharedPath = path.join(contentRoot, 'notebooks', safeSrc);
  if (fs.existsSync(sharedPath)) {
    return { fullPath: sharedPath, relativePath: path.join('notebooks', safeSrc) };
  }

  // 5. Fallback for new files:
  if (slug && safeSrc.includes('/')) {
    const rel = path.join(slug, safeSrc);
    return { fullPath: path.join(contentRoot, rel), relativePath: rel };
  }

  // Default to shared notebooks
  const defaultRel = path.join('notebooks', safeSrc);
  return { fullPath: path.join(contentRoot, defaultRel), relativePath: defaultRel };
}

export function loadNotebook(
  src: string,
  slug?: string
): { data: NotebookFileData | null; relativePath: string } {
  try {
    const { fullPath, relativePath } = resolveNotebookPath(src, slug);

    if (!fs.existsSync(fullPath)) {
      return { data: null, relativePath };
    }

    const stats = fs.statSync(fullPath);
    const mtime = stats.mtimeMs;

    // Use cache in production
    if (process.env.NODE_ENV !== 'development') {
      const cached = notebookCache.get(fullPath);
      if (cached && cached.mtime === mtime) {
        return { data: cached.data, relativePath };
      }
    }

    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const parsed = JSON.parse(fileContent) as NotebookFileData;

    // Validate structure
    const data: NotebookFileData = {
      title: parsed.title || path.basename(src, '.json'),
      cells: Array.isArray(parsed.cells)
        ? parsed.cells.map(c => ({
            type: c.type === 'markdown' ? 'markdown' : 'code',
            source: typeof c.source === 'string' ? c.source : '',
          }))
        : [],
    };

    notebookCache.set(fullPath, { data, mtime });
    return { data, relativePath };
  } catch (error) {
    console.error(`Error loading notebook ${src}:`, error);
    return { data: null, relativePath: src };
  }
}

export function saveNotebook(
  src: string,
  data: NotebookFileData,
  slug?: string
): { success: boolean; relativePath: string; error?: string } {
  try {
    const { fullPath, relativePath } = resolveNotebookPath(src, slug);

    // Security check: ensure path is within contentRoot
    const resolvedFullPath = path.resolve(fullPath);
    if (!resolvedFullPath.startsWith(contentRoot)) {
      throw new Error('Access denied: path is outside content directory');
    }

    // Ensure directory exists
    const dir = path.dirname(resolvedFullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Clean data structure to persist
    const cleanData: NotebookFileData = {
      title: data.title || path.basename(src, '.json'),
      cells: data.cells.map(c => ({
        type: c.type === 'markdown' ? 'markdown' : 'code',
        source: c.source,
      })),
    };

    fs.writeFileSync(resolvedFullPath, JSON.stringify(cleanData, null, 2), 'utf8');
    invalidateNotebookCache(resolvedFullPath);

    return { success: true, relativePath };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`Error saving notebook ${src}:`, err);
    return { success: false, relativePath: src, error: err.message };
  }
}
