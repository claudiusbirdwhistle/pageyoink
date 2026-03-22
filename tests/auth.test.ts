import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";

describe("API Key Authentication", () => {
  const ORIGINAL_API_KEYS = process.env.API_KEYS;

  afterEach(() => {
    if (ORIGINAL_API_KEYS !== undefined) {
      process.env.API_KEYS = ORIGINAL_API_KEYS;
    } else {
      delete process.env.API_KEYS;
    }
  });

  it("allows requests when no API keys are configured (dev mode)", async () => {
    delete process.env.API_KEYS;
    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=invalid",
    });

    // Should get past auth (400 is from URL validation, not auth)
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("rejects requests without API key when keys are configured", async () => {
    process.env.API_KEYS = "test-key-123";
    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=https://example.com",
    });

    expect(response.statusCode).toBe(401);
    const body = response.json();
    expect(body.error).toContain("Missing API key");
    await app.close();
  });

  it("rejects requests with invalid API key", async () => {
    process.env.API_KEYS = "test-key-123";
    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=https://example.com",
      headers: { "x-api-key": "wrong-key" },
    });

    expect(response.statusCode).toBe(403);
    const body = response.json();
    expect(body.error).toContain("Invalid API key");
    await app.close();
  });

  it("accepts requests with valid API key in header", async () => {
    process.env.API_KEYS = "test-key-123";
    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=invalid-url",
      headers: { "x-api-key": "test-key-123" },
    });

    // Gets past auth, fails on URL validation
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("accepts requests with valid API key in query param", async () => {
    process.env.API_KEYS = "test-key-123";
    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=invalid-url&api_key=test-key-123",
    });

    // Gets past auth, fails on URL validation
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("always allows health endpoint without auth", async () => {
    process.env.API_KEYS = "test-key-123";
    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: "/internal/health",
    });

    expect(response.statusCode).toBe(200);
    await app.close();
  });
});
