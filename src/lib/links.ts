import fs from 'fs';
import path from 'path';

// In-memory cache for links.json
let cachedLinks: Record<string, string> | null = null;
let lastLinksMtime: number = 0;

const LINKS_PATH = path.join(process.cwd(), 'content', 'links.json');

/**
 * Loads links from links.json with in-memory caching validated against file mtime.
 */
export function getLinks(): Record<string, string> {
  try {
    if (!fs.existsSync(LINKS_PATH)) {
      return {};
    }

    const stats = fs.statSync(LINKS_PATH);
    const mtime = stats.mtimeMs;

    // Return cached links if file has not been modified
    if (cachedLinks !== null && mtime === lastLinksMtime) {
      return cachedLinks;
    }

    const fileContent = fs.readFileSync(LINKS_PATH, 'utf8');
    const parsed = JSON.parse(fileContent);

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      cachedLinks = parsed as Record<string, string>;
    } else {
      cachedLinks = {};
    }

    lastLinksMtime = mtime;
    return cachedLinks;
  } catch (error) {
    console.error('Error reading links.json:', error);
    return cachedLinks || {};
  }
}

/**
 * Resolves a target destination URL from an alias.
 */
export function getLinkByAlias(alias: string): string | undefined {
  const links = getLinks();
  if (links[alias]) {
    return links[alias];
  }

  // Fallback: case-insensitive match
  const lowerAlias = alias.toLowerCase();
  const matchedKey = Object.keys(links).find(key => key.toLowerCase() === lowerAlias);
  if (matchedKey) {
    return links[matchedKey];
  }

  return undefined;
}

/**
 * Explicitly invalidates the in-memory links cache.
 */
export function invalidateLinksCache(): void {
  cachedLinks = null;
  lastLinksMtime = 0;
}

/**
 * Generates a 32-bit hexadecimal word (8 lowercase hex digits, e.g. "abcdef01").
 * Optionally checks against an array of existing keys to avoid collisions.
 */
export function generate32BitHex(existingKeys: string[] = []): string {
  const existingSet = new Set(existingKeys);
  let hex = '';
  do {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      hex = array[0].toString(16).padStart(8, '0');
    } else {
      hex = Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0');
    }
  } while (existingSet.has(hex));

  return hex;
}
