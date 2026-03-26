/**
 * JSON response cache for the unified /v1/page endpoint.
 * Stores serialized JSON responses keyed by request parameters.
 * In-memory, lost on scale-to-zero — optimization only.
 */

const DEFAULT_TTL = 3600; // 1 hour for page captures
const MAX_CACHE_SIZE = 100; // Unified responses are large, keep fewer

interface JsonCacheEntry {
  data: string; // JSON-serialized response
  createdAt: number;
  ttl: number;
}

const cache = new Map<string, JsonCacheEntry>();

function makeKey(params: Record<string, unknown>): string {
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

  const str = JSON.stringify(sorted);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "page:" + String(hash);
}

export function jsonCacheGet(
  params: Record<string, unknown>,
): Record<string, unknown> | null {
  const key = makeKey(params);
  const entry = cache.get(key);

  if (!entry) return null;

  const age = (Date.now() - entry.createdAt) / 1000;
  if (age > entry.ttl) {
    cache.delete(key);
    return null;
  }

  return JSON.parse(entry.data);
}

export function jsonCacheSet(
  params: Record<string, unknown>,
  data: Record<string, unknown>,
  ttl: number = DEFAULT_TTL,
): void {
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

  cache.set(makeKey(params), {
    data: JSON.stringify(data),
    createdAt: Date.now(),
    ttl,
  });
}
