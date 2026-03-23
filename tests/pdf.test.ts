import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { closeBrowser } from "../src/services/browser.js";
import { FastifyInstance } from "fastify";

describe("PDF endpoint", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeBrowser();
  });

  describe("GET /v1/pdf (URL to PDF)", () => {
    it("returns 400 for missing url parameter", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/pdf",
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 400 for empty url", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/pdf?url=",
      });

      expect(response.statusCode).toBe(400);
    });

    it("generates a PDF from a URL", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/pdf?url=https://example.com",
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
      // PDF files start with %PDF
      expect(response.rawPayload.toString("ascii", 0, 5)).toBe("%PDF-");
    }, 30_000);
  });

  describe("POST /v1/pdf (HTML to PDF)", () => {
    it("returns 400 for missing html field", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/pdf",
        payload: {},
        headers: { "content-type": "application/json" },
      });

      expect(response.statusCode).toBe(400);
    });

    it("generates a PDF from HTML", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/pdf",
        payload: {
          html: "<html><body><h1>Hello PageYoink</h1><p>This is a test PDF.</p></body></html>",
        },
        headers: { "content-type": "application/json" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.rawPayload.toString("ascii", 0, 5)).toBe("%PDF-");
    }, 30_000);

    it("supports landscape mode", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/pdf",
        payload: {
          html: "<html><body><h1>Landscape</h1></body></html>",
          landscape: true,
        },
        headers: { "content-type": "application/json" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    }, 30_000);
  });
});
