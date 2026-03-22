import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { closeBrowser } from "../src/services/browser.js";
import { FastifyInstance } from "fastify";

describe("Screenshot endpoint", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeBrowser();
  });

  it("returns 400 for missing url parameter", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot",
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for invalid url", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=not-a-url",
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toContain("Invalid URL");
  });

  it("returns 400 for non-http protocol", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=ftp://example.com",
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toContain("http and https");
  });

  it("takes a screenshot of a valid URL", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=https://example.com",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
    expect(response.rawPayload.length).toBeGreaterThan(1000);
  }, 30_000);

  it("supports jpeg format", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=https://example.com&format=jpeg&quality=80",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/jpeg");
    expect(response.rawPayload.length).toBeGreaterThan(500);
  }, 30_000);

  it("supports custom viewport dimensions", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=https://example.com&width=800&height=600",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
  }, 30_000);
});
