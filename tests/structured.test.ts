import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { closeBrowser } from "../src/services/browser.js";
import { FastifyInstance } from "fastify";

describe("Structured extraction (POST /v1/extract/structured)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeBrowser();
  });

  it("returns 400 for missing URL", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/extract/structured",
      payload: {},
    });
    expect(response.statusCode).toBe(400);
  });

  it("auto-extract mode returns structured data without schema", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/extract/structured",
      payload: { url: "https://example.com" },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.jsonLd).toBeDefined();
    expect(body.og).toBeDefined();
    expect(body.meta).toBeDefined();
    expect(body.url).toContain("example.com");
  }, 30_000);

  it("schema mode maps fields from structured data", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/extract/structured",
      payload: {
        url: "https://example.com",
        schema: { title: "string", description: "string" },
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toBeDefined();
    expect(body.source).toBeDefined();
  }, 30_000);

  it("SSRF blocking works", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/extract/structured",
      payload: { url: "http://169.254.169.254/latest/meta-data" },
    });
    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBeDefined();
  });
});
