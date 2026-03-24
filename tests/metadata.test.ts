import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { closeBrowser } from "../src/services/browser.js";
import { FastifyInstance } from "fastify";

describe("Metadata endpoint", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeBrowser();
  });

  it("returns 400 for missing url", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/metadata",
    });
    expect(response.statusCode).toBe(400);
  });

  it("extracts metadata from a simple page", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/metadata?url=https://example.com",
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.title).toBe("Example Domain");
    expect(body.loadedUrl).toContain("example.com");
    expect(body.stats.wordCount).toBeGreaterThan(0);
    expect(body.stats.linkCount).toBeGreaterThanOrEqual(0);
  }, 30_000);

  it("returns OG tags when present", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/metadata?url=https://github.com",
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.og.title).toBeTruthy();
    expect(body.og.image).toBeTruthy();
    expect(body.favicon).toBeTruthy();
  }, 30_000);

  it("counts links and images", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/metadata?url=https://news.ycombinator.com",
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.stats.linkCount).toBeGreaterThan(10);
    expect(body.stats.externalLinks).toBeGreaterThan(0);
  }, 30_000);

  it("blocks SSRF attempts", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/metadata?url=http://127.0.0.1/admin",
    });
    expect(response.statusCode).toBe(400);
  });
});
