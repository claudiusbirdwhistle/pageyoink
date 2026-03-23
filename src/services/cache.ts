const DEFAULT_TTL = 86400; // 24 hours in seconds
const MAX_CACHE_SIZE = 500; // Max entries to prevent memory bloat

interface CacheEntry {
  buffer: Buffer;
  contentType: string;
  createdAt: number;
  ttl: number;
}

// In-memory cache — persists within a single container instance.
// On Cloud Run, this survives across requests to the same instance
// but is lost on scale-to-zero. This is acceptable — cache is an
// optimization, not a requirement.
const cache = new Map<string, CacheEntry>();

function cacheKey(params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key];
        }
        return acc;
      },
      {} as Record<string, unknown>,
    );

  // Simple hash — no need for crypto in memory cache
  const str = JSON.stringify(sorted);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return String(hash);
}

export function cacheGet(
  params: Record<string, unknown>,
): { buffer: Buffer; contentType: string } | null {
  const key = cacheKey(params);
  const entry = cache.get(key);

  if (!entry) return null;

  const age = (Date.now() - entry.createdAt) / 1000;
  if (age > entry.ttl) {
    cache.delete(key);
    return null;
  }

  return {
    buffer: entry.buffer,
    contentType: entry.contentType,
  };
}

export function cacheSet(
  params: Record<string, unknown>,
  buffer: Buffer,
  contentType: string,
  ttl: number = DEFAULT_TTL,
): void {
  // Evict oldest entries if cache is full
  if (cache.size >= MAX_CACHE_SIZE) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [k, v] of cache.entries()) {
      if (v.createdAt < oldestTime) {
        oldestTime = v.createdAt;
        oldestKey = k;
      }
    }
    if (oldestKey) cache.delete(oldestKey);
  }

  cache.set(cacheKey(params), {
    buffer,
    contentType,
    createdAt: Date.now(),
    ttl,
  });
}

export function cacheCleanup(): number {
  let cleaned = 0;
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if ((now - entry.createdAt) / 1000 > entry.ttl) {
      cache.delete(key);
      cleaned++;
    }
  }
  return cleaned;
}
