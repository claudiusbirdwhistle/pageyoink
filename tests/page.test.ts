import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { closeBrowser } from "../src/services/browser.js";
import { FastifyInstance } from "fastify";

describe("Unified page endpoint (POST /v1/page)", () => {
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
      method: "POST",
      url: "/v1/page",
      payload: {},
      headers: { "content-type": "application/json" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("returns default outputs (screenshot, markdown, metadata)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/page",
      payload: { url: "https://example.com" },
      headers: { "content-type": "application/json" },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.outputs).toEqual(["screenshot", "markdown", "metadata"]);
    expect(body.screenshot).toBeDefined();
    expect(body.screenshot.base64).toBeTruthy();
    expect(body.screenshot.contentType).toBe("image/png");
    expect(body.markdown).toBeDefined();
    expect(body.markdown.content).toBeTruthy();
    expect(body.markdown.wordCount).toBeGreaterThan(0);
    expect(body.metadata).toBeDefined();
    expect(body.metadata.title).toBe("Example Domain");
  }, 30_000);

  it("returns only requested outputs", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/page",
      payload: { url: "https://example.com", outputs: ["metadata"] },
      headers: { "content-type": "application/json" },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.metadata).toBeDefined();
    expect(body.screenshot).toBeUndefined();
    expect(body.markdown).toBeUndefined();
    expect(body.pdf).toBeUndefined();
  }, 30_000);

  it("returns PDF when requested", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/page",
      payload: { url: "https://example.com", outputs: ["pdf"] },
      headers: { "content-type": "application/json" },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.pdf).toBeDefined();
    expect(body.pdf.base64).toBeTruthy();
    expect(body.pdf.contentType).toBe("application/pdf");
    // Verify it's valid base64 PDF
    const buffer = Buffer.from(body.pdf.base64, "base64");
    expect(buffer.toString("ascii", 0, 5)).toBe("%PDF-");
  }, 30_000);

  it("rejects invalid output types", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/page",
      payload: { url: "https://example.com", outputs: ["invalid"] },
      headers: { "content-type": "application/json" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("blocks SSRF attempts", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/page",
      payload: { url: "http://169.254.169.254/metadata" },
      headers: { "content-type": "application/json" },
    });
    expect(response.statusCode).toBe(400);
  });

  it("validates viewport limits", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/page",
      payload: {
        url: "https://example.com",
        viewport: { width: 99999 },
      },
      headers: { "content-type": "application/json" },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain("Width");
  });
});
