let cachedContent: string | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedTodo(): string | null {
  const now = Date.now();
  if (cachedContent && (now - lastFetch) < CACHE_DURATION) {
    return cachedContent;
  }
  return null;
}

export function setCachedTodo(content: string) {
  cachedContent = content;
  lastFetch = Date.now();
}

export function invalidateTodoCache() {
  cachedContent = null;
  lastFetch = 0;
}
