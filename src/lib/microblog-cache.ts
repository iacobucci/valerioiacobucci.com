import { MicroblogPostSerializable } from './db';

// Global cache to persist posts between navigations on the client
export let cachedMicroblogPosts: MicroblogPostSerializable[] | null = null;

export function setCachedMicroblogPosts(posts: MicroblogPostSerializable[]) {
  // If we already have more posts, don't overwrite with fewer (e.g. home only has 3)
  // but do update the first ones if they are newer
  if (!cachedMicroblogPosts || posts.length >= cachedMicroblogPosts.length) {
    cachedMicroblogPosts = posts;
  } else {
    // If we have fewer posts (e.g. from home), update only the overlapping part
    const newCache = [...cachedMicroblogPosts];
    posts.forEach((post, index) => {
      newCache[index] = post;
    });
    cachedMicroblogPosts = newCache;
  }
}
