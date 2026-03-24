import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { closeBrowser } from "../src/services/browser.js";
import { FastifyInstance } from "fastify";

describe("Diff endpoint (POST /v1/diff)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeBrowser();
  });

  it("returns 400 for missing url1", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/diff",
      payload: { url2: "https://example.com" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for missing url2", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/diff",
      payload: { url1: "https://example.com" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for invalid URL", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/diff",
      payload: { url1: "not-a-url!!!", url2: "https://example.com" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("SSRF blocking on url1", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/diff",
      payload: { url1: "http://169.254.169.254/latest/meta-data", url2: "https://example.com" },
    });
    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBeDefined();
  });

  it("SSRF blocking on url2", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/diff",
      payload: { url1: "https://example.com", url2: "http://169.254.169.254/latest/meta-data" },
    });
    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBeDefined();
  });

  it("basic diff between two URLs returns JSON with diff stats", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/diff",
      payload: {
        url1: "https://example.com",
        url2: "https://example.com",
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.diffPixels).toBeDefined();
    expect(body.diffPercentage).toBeDefined();
    expect(typeof body.diffPercentage).toBe("number");
    expect(body.diffImage).toBeDefined(); // base64 string
    expect(body.identical).toBe(true); // same URL should produce identical screenshots
  }, 60_000);

  it("image format returns PNG binary", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/diff",
      payload: {
        url1: "https://example.com",
        url2: "https://example.com",
        format: "image",
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
    expect(response.headers["x-diff-pixels"]).toBeDefined();
    expect(response.headers["x-diff-percentage"]).toBeDefined();
  }, 60_000);
});
