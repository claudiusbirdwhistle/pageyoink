import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { trackUsage } from "../src/services/usage.js";
import { FastifyInstance } from "fastify";

describe("Usage endpoint", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 401 without API key", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/usage",
    });

    expect(response.statusCode).toBe(401);
  });

  it("returns usage data for an API key", async () => {
    // Seed some usage data
    trackUsage("test-usage-key", "/v1/screenshot");
    trackUsage("test-usage-key", "/v1/screenshot");
    trackUsage("test-usage-key", "/v1/pdf");

    const response = await app.inject({
      method: "GET",
      url: "/v1/usage",
      headers: { "x-api-key": "test-usage-key" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.totalRequests).toBe(3);
    expect(body.apiKey).toContain("...");
    expect(body.period).toBeDefined();
    expect(body.byEndpoint).toBeDefined();
    expect(body.byEndpoint.length).toBeGreaterThan(0);
  });

  it("supports days parameter", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/usage?days=7",
      headers: { "x-api-key": "test-usage-key" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.period.days).toBe(7);
  });

  it("returns empty usage for unknown key", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/usage",
      headers: { "x-api-key": "nonexistent-key" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.totalRequests).toBe(0);
  });
});
