import { describe, it, expect } from "vitest";
import { cacheGet, cacheSet, cacheCleanup } from "../src/services/cache.js";

describe("Cache service", () => {
  it("cacheSet + cacheGet returns same data", () => {
    const params = { url: "https://example.com", width: 1280 };
    const buffer = Buffer.from("test data");
    cacheSet(params, buffer, "image/png");

    const result = cacheGet(params);
    expect(result).not.toBeNull();
    expect(result!.buffer.toString()).toBe("test data");
    expect(result!.contentType).toBe("image/png");
  });

  it("TTL expiry works", async () => {
    const params = { url: "https://ttl-test.com", ttlTest: true };
    const buffer = Buffer.from("expiring data");
    cacheSet(params, buffer, "text/plain", 0.1); // 0.1 second TTL

    // Should exist immediately
    expect(cacheGet(params)).not.toBeNull();

    // Wait for TTL to expire
    await new Promise((r) => setTimeout(r, 200));

    // Should be expired
    expect(cacheGet(params)).toBeNull();
  });

  it("different params produce different cache keys", () => {
    const params1 = { url: "https://a.com", width: 1280 };
    const params2 = { url: "https://b.com", width: 1280 };
    const buf1 = Buffer.from("data1");
    const buf2 = Buffer.from("data2");

    cacheSet(params1, buf1, "image/png");
    cacheSet(params2, buf2, "image/png");

    const result1 = cacheGet(params1);
    const result2 = cacheGet(params2);
    expect(result1!.buffer.toString()).toBe("data1");
    expect(result2!.buffer.toString()).toBe("data2");
  });

  it("cacheGet returns null for missing keys", () => {
    const result = cacheGet({ url: "https://nonexistent.com", rand: Math.random() });
    expect(result).toBeNull();
  });

  it("cacheCleanup removes expired entries", async () => {
    const params = { url: "https://cleanup-test.com", cleanupTest: true };
    cacheSet(params, Buffer.from("old data"), "text/plain", 0.1);

    await new Promise((r) => setTimeout(r, 200));

    const cleaned = cacheCleanup();
    expect(cleaned).toBeGreaterThanOrEqual(1);
  });
});
