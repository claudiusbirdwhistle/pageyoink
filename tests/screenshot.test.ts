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

  it("returns 400 for empty url", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=",
    });

    expect(response.statusCode).toBe(400);
  });

  it("auto-prepends https:// to bare domains", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=example.com",
    });

    // Should succeed (not 400) because example.com becomes https://example.com
    expect(response.statusCode).toBe(200);
  }, 30_000);

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

  it("supports clean mode", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=https://example.com&clean=true",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
  }, 30_000);

  it("supports selector capture", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=https://example.com&selector=h1",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
    // Element capture should be smaller than full page
    expect(response.rawPayload.length).toBeGreaterThan(100);
  }, 30_000);

  it("supports transparent background for PNG", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=https://example.com&transparent=true",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
  }, 30_000);

  it("returns X-Cache HIT on repeated request with ttl", async () => {
    // Use a unique param combo so we don't collide with other tests' cache
    const url = "/v1/screenshot?url=https://example.com&ttl=60&width=640&height=480";
    // First request — populates cache (may be MISS or HIT from prior run)
    const response1 = await app.inject({ method: "GET", url });
    expect(response1.statusCode).toBe(200);
    expect(response1.headers["x-cache"]).toBeDefined();

    // Second request — guaranteed HIT
    const response2 = await app.inject({ method: "GET", url });
    expect(response2.statusCode).toBe(200);
    expect(response2.headers["x-cache"]).toBe("HIT");
  }, 30_000);

  it("bypasses cache with fresh=true", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=https://example.com&ttl=60&fresh=true",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-cache"]).toBe("MISS");
  }, 30_000);

  it("supports CSS injection", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=https://example.com&css=" + encodeURIComponent("body{background:red}"),
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
  }, 30_000);

  it("supports JS injection", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=https://example.com&js=" + encodeURIComponent("document.title='test'"),
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
  }, 30_000);

  it("supports timezone spoofing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=https://example.com&timezone=Asia/Tokyo",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
  }, 30_000);

  it("supports geolocation spoofing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/screenshot?url=https://example.com&geolocation=48.8566,2.3522",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
  }, 30_000);
});

describe("Trial endpoints", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    // Reset trial limits
    await app.inject({ method: "DELETE", url: "/trial/reset" });
  });

  afterAll(async () => {
    await app.close();
    await closeBrowser();
  });

  it("GET /trial/screenshot returns a screenshot without API key", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/trial/screenshot?url=https://example.com",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/png");
    expect(response.headers["x-trial-remaining"]).toBeDefined();
  }, 30_000);

  it("GET /trial/pdf returns a PDF without API key", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/trial/pdf?url=https://example.com",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("application/pdf");
    expect(response.rawPayload.toString("ascii", 0, 5)).toBe("%PDF-");
  }, 30_000);

  it("GET /trial/pdf accepts PDF options (format, landscape)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/trial/pdf?url=https://example.com&format=Letter&landscape=true",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("application/pdf");
  }, 30_000);
});
