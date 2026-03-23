import crypto from "crypto";
import fs from "fs";
import path from "path";

const CACHE_DIR =
  process.env.CACHE_DIR || path.join(process.cwd(), "data", "cache");
const DEFAULT_TTL = 86400; // 24 hours in seconds

interface CacheEntry {
  contentType: string;
  createdAt: number;
  ttl: number;
}

/**
 * Generate a cache key from request parameters.
 * The key is a SHA-256 hash of the sorted, stringified params.
 */
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

  return crypto.createHash("sha256").update(JSON.stringify(sorted)).digest("hex");
}

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function dataPath(key: string): string {
  return path.join(CACHE_DIR, `${key}.data`);
}

function metaPath(key: string): string {
  return path.join(CACHE_DIR, `${key}.json`);
}

/**
 * Get a cached result if it exists and hasn't expired.
 */
export function cacheGet(
  params: Record<string, unknown>,
): { buffer: Buffer; contentType: string } | null {
  const key = cacheKey(params);
  const meta = metaPath(key);
  const data = dataPath(key);

  if (!fs.existsSync(meta) || !fs.existsSync(data)) {
    return null;
  }

  try {
    const entry: CacheEntry = JSON.parse(fs.readFileSync(meta, "utf-8"));
    const age = (Date.now() - entry.createdAt) / 1000;

    if (age > entry.ttl) {
      // Expired — clean up
      fs.unlinkSync(meta);
      fs.unlinkSync(data);
      return null;
    }

    return {
      buffer: fs.readFileSync(data),
      contentType: entry.contentType,
    };
  } catch {
    return null;
  }
}

/**
 * Store a result in the cache.
 */
export function cacheSet(
  params: Record<string, unknown>,
  buffer: Buffer,
  contentType: string,
  ttl: number = DEFAULT_TTL,
): void {
  ensureCacheDir();

  const key = cacheKey(params);
  const entry: CacheEntry = {
    contentType,
    createdAt: Date.now(),
    ttl,
  };

  fs.writeFileSync(dataPath(key), buffer);
  fs.writeFileSync(metaPath(key), JSON.stringify(entry));
}

/**
 * Clean up all expired cache entries.
 */
export function cacheCleanup(): number {
  if (!fs.existsSync(CACHE_DIR)) return 0;

  let cleaned = 0;
  const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    try {
      const metaFile = path.join(CACHE_DIR, file);
      const entry: CacheEntry = JSON.parse(fs.readFileSync(metaFile, "utf-8"));
      const age = (Date.now() - entry.createdAt) / 1000;

      if (age > entry.ttl) {
        const dataFile = metaFile.replace(".json", ".data");
        if (fs.existsSync(metaFile)) fs.unlinkSync(metaFile);
        if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
        cleaned++;
      }
    } catch {
      // Corrupted entry, skip
    }
  }

  return cleaned;
}
