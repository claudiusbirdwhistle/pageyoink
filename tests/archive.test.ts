import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { closeBrowser } from "../src/services/browser.js";
import { FastifyInstance } from "fastify";

describe("Archive endpoint (POST /v1/archive)", () => {
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
      url: "/v1/archive",
      payload: {},
    });
    expect(response.statusCode).toBe(400);
  });

  it("SSRF blocking works", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/archive",
      payload: { url: "http://169.254.169.254/latest/meta-data" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("returns ZIP archive for valid URL", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/archive",
      payload: { url: "https://example.com" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("application/zip");
    expect(response.headers["x-content-hash"]).toBeDefined();
    expect(response.headers["x-capture-timestamp"]).toBeDefined();
    expect(response.headers["x-capture-id"]).toBeDefined();

    // ZIP magic bytes: PK\x03\x04
    const buf = response.rawPayload;
    expect(buf[0]).toBe(0x50); // P
    expect(buf[1]).toBe(0x4b); // K
    expect(buf.length).toBeGreaterThan(1000);
  }, 60_000);

  it("content hash is valid SHA-256", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/archive",
      payload: { url: "https://example.com" },
    });
    expect(response.statusCode).toBe(200);
    const hash = response.headers["x-content-hash"] as string;
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  }, 60_000);
});
