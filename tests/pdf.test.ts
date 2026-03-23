import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PDFDocument } from "pdf-lib";
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

    it("supports scale parameter", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/pdf",
        payload: {
          html: "<html><body><h1>Scaled</h1></body></html>",
          scale: 0.5,
        },
        headers: { "content-type": "application/json" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.rawPayload.toString("ascii", 0, 5)).toBe("%PDF-");
    }, 30_000);

    it("supports maxPages parameter to truncate output", async () => {
      // Generate HTML with enough content for multiple pages
      const pages = Array.from({ length: 20 }, (_, i) =>
        `<div style="page-break-before:always"><h1>Page ${i + 1}</h1><p>Content for page ${i + 1}</p></div>`
      ).join("");
      const html = `<html><body>${pages}</body></html>`;

      const response = await app.inject({
        method: "POST",
        url: "/v1/pdf",
        payload: { html, maxPages: 3 },
        headers: { "content-type": "application/json" },
      });

      expect(response.statusCode).toBe(200);
      const doc = await PDFDocument.load(response.rawPayload);
      expect(doc.getPageCount()).toBe(3);
    }, 30_000);

    it("supports header and footer templates", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/pdf",
        payload: {
          html: "<html><body><h1>Headers Test</h1></body></html>",
          headerTemplate: '<div style="font-size:10px;text-align:center;width:100%;">My Header</div>',
          footerTemplate: '<div style="font-size:10px;text-align:center;width:100%;"><span class="pageNumber"></span></div>',
        },
        headers: { "content-type": "application/json" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    }, 30_000);

    it("supports watermark", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/pdf",
        payload: {
          html: "<html><body><h1>Watermark Test</h1></body></html>",
          watermark: { text: "DRAFT", position: "center" },
        },
        headers: { "content-type": "application/json" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    }, 30_000);
  });

  describe("GET /v1/pdf with scale and max_pages", () => {
    it("accepts scale query parameter", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/pdf?url=https://example.com&scale=0.5",
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    }, 30_000);

    it("accepts max_pages query parameter", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/pdf?url=https://example.com&max_pages=1",
      });

      expect(response.statusCode).toBe(200);
      const doc = await PDFDocument.load(response.rawPayload);
      expect(doc.getPageCount()).toBe(1);
    }, 30_000);
  });
});
