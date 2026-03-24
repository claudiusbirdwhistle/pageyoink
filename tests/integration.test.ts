import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { closeBrowser } from "../src/services/browser.js";
import { FastifyInstance } from "fastify";

/**
 * Integration tests against real-world sites.
 * These verify that outputs are non-trivial and properly formed.
 */
describe("Integration: real-world quality", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeBrowser();
  });

  // F1: Screenshot quality
  describe("F1: Screenshot quality", () => {
    it("screenshot is not blank (file size > threshold)", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/screenshot?url=https://example.com",
      });
      expect(response.statusCode).toBe(200);
      // A non-blank screenshot of example.com should be > 5KB
      expect(response.rawPayload.length).toBeGreaterThan(5000);
    }, 30_000);

    it("screenshot dimensions match requested viewport", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/screenshot?url=https://example.com&width=800&height=600&format=png",
      });
      expect(response.statusCode).toBe(200);
      // PNG header contains width at bytes 16-19 (big-endian)
      const buf = response.rawPayload;
      const width = buf.readUInt32BE(16);
      expect(width).toBe(800);
    }, 30_000);
  });

  // F2: PDF quality
  describe("F2: PDF quality", () => {
    it("PDF has content (starts with %PDF-)", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/pdf?url=https://example.com",
      });
      expect(response.statusCode).toBe(200);
      const text = response.rawPayload.toString("latin1", 0, 5);
      expect(text).toBe("%PDF-");
    }, 30_000);

    it("PDF is reasonably sized", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/pdf?url=https://example.com",
      });
      expect(response.statusCode).toBe(200);
      // A PDF of example.com should be > 1KB
      expect(response.rawPayload.length).toBeGreaterThan(1000);
    }, 30_000);
  });

  // F3: Markdown extraction quality
  describe("F3: Markdown extraction", () => {
    it("example.com extraction has meaningful content", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/extract?url=https://example.com",
      });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.wordCount).toBeGreaterThan(0);
      expect(body.content.length).toBeGreaterThan(10);
      expect(body.title).toBe("Example Domain");
    }, 30_000);

    it("non-article pages fall back gracefully", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/extract?url=https://www.google.com",
      });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      // Google.com won't have article content, should still return something
      expect(body.content).toBeDefined();
      expect(body.title).toBeDefined();
    }, 30_000);
  });

  // F4: Metadata extraction quality
  describe("F4: Metadata extraction", () => {
    it("extracts basic metadata from example.com", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/metadata?url=https://example.com",
      });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.title).toBeDefined();
      expect(body.stats).toBeDefined();
      expect(body.stats.wordCount).toBeGreaterThan(0);
    }, 30_000);
  });

  // F5: Unified /v1/page quality
  describe("F5: Unified page endpoint", () => {
    it("returns requested outputs from single page load", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/page",
        payload: {
          url: "https://example.com",
          outputs: ["screenshot", "markdown", "metadata"],
        },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json();

      // Screenshot is an object with base64, contentType, size
      expect(body.screenshot).toBeDefined();
      expect(body.screenshot.base64.length).toBeGreaterThan(100);
      expect(body.screenshot.contentType).toBe("image/png");

      // Markdown content
      expect(body.markdown).toBeDefined();
      expect(body.markdown.content.length).toBeGreaterThan(10);

      // Metadata
      expect(body.metadata).toBeDefined();
      expect(body.metadata.title).toBeDefined();
    }, 60_000);

    it("base64 screenshot decodes to valid PNG", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/page",
        payload: {
          url: "https://example.com",
          outputs: ["screenshot"],
        },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json();

      const buf = Buffer.from(body.screenshot.base64, "base64");
      // PNG magic bytes
      expect(buf[0]).toBe(0x89);
      expect(buf[1]).toBe(0x50); // P
      expect(buf[2]).toBe(0x4e); // N
      expect(buf[3]).toBe(0x47); // G
    }, 30_000);

    it("base64 PDF decodes to valid PDF", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/page",
        payload: {
          url: "https://example.com",
          outputs: ["pdf"],
        },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json();

      const buf = Buffer.from(body.pdf.base64, "base64");
      const header = buf.toString("latin1", 0, 5);
      expect(header).toBe("%PDF-");
    }, 30_000);
  });
});
