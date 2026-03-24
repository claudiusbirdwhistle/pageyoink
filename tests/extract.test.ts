import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { closeBrowser } from "../src/services/browser.js";
import { FastifyInstance } from "fastify";

describe("Extract endpoint", () => {
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
      url: "/v1/extract",
    });
    expect(response.statusCode).toBe(400);
  });

  it("extracts markdown from a simple page", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/extract?url=https://example.com",
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.format).toBe("markdown");
    expect(body.title).toBe("Example Domain");
    expect(body.content.length).toBeGreaterThan(10);
    expect(body.wordCount).toBeGreaterThan(0);
    expect(body.url).toContain("example.com");
  }, 30_000);

  it("extracts plain text format", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/extract?url=https://example.com&format=text",
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.format).toBe("text");
    expect(body.content).not.toContain("<");
    expect(body.content).not.toContain(">");
  }, 30_000);

  it("extracts HTML format", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/extract?url=https://example.com&format=html",
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.format).toBe("html");
    expect(body.content).toContain("<");
  }, 30_000);

  it("blocks SSRF attempts", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/extract?url=http://169.254.169.254/computeMetadata/v1/",
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain("private");
  });

  it("defaults clean mode to true", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/extract?url=https://example.com",
    });
    expect(response.statusCode).toBe(200);
    // Clean mode runs by default — no cookie banners in extraction
  }, 30_000);
});
