const TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_ENTRIES = 500;

interface Entry {
  originalUrl: string;
  urls: string[];
  expiresAt: number;
}

const cache = new Map<string, Entry>();

export function getCached(shortCode: string): Pick<Entry, "originalUrl" | "urls"> | null {
  const entry = cache.get(shortCode);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(shortCode);
    return null;
  }
  return { originalUrl: entry.originalUrl, urls: entry.urls };
}

export function setCached(shortCode: string, originalUrl: string, urls: string[]): void {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(shortCode, { originalUrl, urls, expiresAt: Date.now() + TTL_MS });
}

export function invalidateCached(shortCode: string): void {
  cache.delete(shortCode);
}
