import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { closeBrowser } from "../src/services/browser.js";
import { FastifyInstance } from "fastify";

describe("OG Image endpoint", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeBrowser();
  });

  describe("GET /v1/og-image", () => {
    it("returns 400 for missing title", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/og-image",
      });

      expect(response.statusCode).toBe(400);
    });

    it("generates a PNG OG image with title", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/og-image?title=Hello%20PageYoink",
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toBe("image/png");
      expect(response.rawPayload.length).toBeGreaterThan(1000);
    }, 15_000);

    it("supports all template options", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/v1/og-image?title=Test&subtitle=A%20subtitle&author=Claude&domain=pageyoink.dev&theme=dark&font_size=large",
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toBe("image/png");
    }, 15_000);
  });

  describe("POST /v1/og-image", () => {
    it("generates an OG image from JSON body", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/og-image",
        payload: {
          title: "My Blog Post",
          subtitle: "A deep dive into APIs",
          author: "Jane Doe",
          domain: "example.com",
          theme: "gradient",
          brandColor: "#e11d48",
        },
        headers: { "content-type": "application/json" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toBe("image/png");
      expect(response.rawPayload.length).toBeGreaterThan(1000);
    }, 15_000);

    it("supports JPEG format with quality", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/og-image",
        payload: {
          title: "JPEG Test",
          format: "jpeg",
          quality: 80,
        },
        headers: { "content-type": "application/json" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toBe("image/jpeg");
    }, 15_000);
  });
});
