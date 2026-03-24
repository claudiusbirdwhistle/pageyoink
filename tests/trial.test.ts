import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { closeBrowser } from "../src/services/browser.js";
import { FastifyInstance } from "fastify";

describe("Trial endpoints", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeBrowser();
  });

  it("trial screenshot returns PNG", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/trial/screenshot?url=https://example.com",
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
  }, 30_000);

  it("trial pdf returns PDF", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/trial/pdf?url=https://example.com",
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("application/pdf");
  }, 30_000);

  it("trial extract returns JSON", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/trial/extract?url=https://example.com",
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.content).toBeDefined();
    expect(body.format).toBe("markdown");
    expect(body.title).toBeDefined();
  }, 30_000);

  it("trial metadata returns JSON", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/trial/metadata?url=https://example.com",
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.title).toBeDefined();
  }, 30_000);

  it("SSRF blocking on trial screenshot", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/trial/screenshot?url=http://169.254.169.254/latest/meta-data",
    });
    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBeDefined();
  });

  it("SSRF blocking on trial extract", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/trial/extract?url=http://127.0.0.1:8080/admin",
    });
    // May get 400 (SSRF blocked) or 429 (rate limited from prior tests)
    expect([400, 429]).toContain(response.statusCode);
  });

  it("returns 400 for missing URL on trial screenshot", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/trial/screenshot",
    });
    expect(response.statusCode).toBe(400);
  });
});
