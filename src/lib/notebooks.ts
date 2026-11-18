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

  // Base directory for resolving relative paths:
  // If slug is provided, resolve relative to content/<slug>
  // If slug is not provided, resolve relative to contentRoot
  const baseDir = slug ? path.join(contentRoot, slug) : contentRoot;

  let fullPath: string;
  if (normalizedSrc.startsWith('/')) {
    // Explicit path from contentRoot (e.g. /category/article/foo.json)
    fullPath = path.resolve(contentRoot, normalizedSrc.slice(1));
  } else {
    // Relative path (e.g. "signal.json", "./signal.json", or "../other-article/signal.json")
    const articleLocalPath = path.resolve(baseDir, normalizedSrc);
    // If it doesn't start with '.' and does not exist in articleLocalPath,
    // check if it was specified relative to contentRoot
    if (!normalizedSrc.startsWith('.') && !fs.existsSync(articleLocalPath)) {
      const rootRelativePath = path.resolve(contentRoot, normalizedSrc);
      if (fs.existsSync(rootRelativePath)) {
        fullPath = rootRelativePath;
      } else {
        fullPath = articleLocalPath;
      }
    } else {
      fullPath = articleLocalPath;
    }
  }

  // Security check: ensure path is strictly contained within contentRoot
  const relFromRoot = path.relative(contentRoot, fullPath);
  if (relFromRoot.startsWith('..') || path.isAbsolute(relFromRoot)) {
    throw new Error(`Access denied: path '${src}' resolves outside content directory`);
  }

  return { fullPath, relativePath: relFromRoot };
}

export function createDefaultNotebook(
  src: string,
  slug?: string,
  customTitle?: string
): { data: NotebookFileData; relativePath: string; fullPath: string } {
  const { fullPath, relativePath } = resolveNotebookPath(src, slug);

  const baseTitle = path
    .basename(src, '.json')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const title = customTitle || baseTitle || 'Interactive TypeScript Notebook';

  const defaultData: NotebookFileData = {
    title,
    cells: [
      {
        type: 'markdown',
        source: `### ${title}\nWelcome to your notebook! Run the cells below or edit the TypeScript code directly in your browser.`,
      },
      {
        type: 'code',
        source: `// TypeScript execution in browser\nconst x: number = 42;\nconsole.log("Hello from ${title}! x =", x);\nx * 2;`,
      },
    ],
  };

  saveNotebook(src, defaultData, slug);
  return { data: defaultData, relativePath, fullPath };
}

export function loadNotebook(
  src: string,
  slug?: string,
  createIfMissing = true
): { data: NotebookFileData | null; relativePath: string } {
  try {
    const { fullPath, relativePath } = resolveNotebookPath(src, slug);

    if (!fs.existsSync(fullPath)) {
      if (createIfMissing) {
        const created = createDefaultNotebook(src, slug);
        return { data: created.data, relativePath: created.relativePath };
      }
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

    // Validate structure and restore cached execution outputs
    const data: NotebookFileData = {
      title: parsed.title || path.basename(src, '.json'),
      cells: Array.isArray(parsed.cells)
        ? parsed.cells.map(c => ({
            id: typeof c.id === 'string' ? c.id : undefined,
            type: c.type === 'markdown' ? 'markdown' : 'code',
            source: typeof c.source === 'string' ? c.source : '',
            executionCount: typeof c.executionCount === 'number' ? c.executionCount : null,
            status: c.status || (Array.isArray(c.outputs) && c.outputs.length > 0 ? 'success' : 'idle'),
            outputs: Array.isArray(c.outputs) ? c.outputs : [],
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

    // Clean data structure to persist, preserving cached outputs, status and execution counts
    const cleanData: NotebookFileData = {
      title: data.title || path.basename(src, '.json'),
      cells: data.cells.map(c => ({
        id: c.id,
        type: c.type === 'markdown' ? 'markdown' : 'code',
        source: c.source,
        executionCount: typeof c.executionCount === 'number' ? c.executionCount : null,
        status: c.status || (Array.isArray(c.outputs) && c.outputs.length > 0 ? 'success' : 'idle'),
        outputs: Array.isArray(c.outputs) ? c.outputs : [],
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

/**
 * Scan MDX content for <Notebook src="..." /> tags and automatically create
 * any notebook files that do not exist yet on disk.
 */
export function ensureNotebooksExistInMdx(mdxContent: string, articleSlug?: string): string[] {
  const regex = /<Notebook\b([\s\S]*?)\/?>/g;
  const createdFiles: string[] = [];
  let match;

  while ((match = regex.exec(mdxContent)) !== null) {
    const tagAttrs = match[1];
    const srcMatch = tagAttrs.match(/\bsrc=(?:["']([^"']+)["']|\{(?:["']([^"']+)["'])\})/);
    const titleMatch = tagAttrs.match(/\btitle=(?:["']([^"']+)["']|\{(?:["']([^"']+)["'])\})/);
    const src = srcMatch ? (srcMatch[1] || srcMatch[2]) : null;
    const customTitle = titleMatch ? (titleMatch[1] || titleMatch[2]) : undefined;

    if (src) {
      try {
        const { fullPath, relativePath } = resolveNotebookPath(src, articleSlug);
        if (!fs.existsSync(fullPath)) {
          createDefaultNotebook(src, articleSlug, customTitle);
          createdFiles.push(relativePath);
        }
      } catch (err) {
        console.warn(`Could not ensure notebook '${src}' for article '${articleSlug}':`, err);
      }
    }
  }

  return createdFiles;
}
