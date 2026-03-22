import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { closeBrowser } from "../src/services/browser.js";
import { FastifyInstance } from "fastify";

describe("Batch endpoint", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeBrowser();
  });

  it("returns 400 for empty items array", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/batch",
      payload: { items: [] },
      headers: { "content-type": "application/json" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for invalid URL in batch", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/batch",
      payload: {
        items: [{ url: "not-a-url" }],
      },
      headers: { "content-type": "application/json" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("accepts a valid batch and returns job ID", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/batch",
      payload: {
        items: [{ url: "https://example.com" }],
      },
      headers: { "content-type": "application/json" },
    });

    expect(response.statusCode).toBe(202);
    const body = response.json();
    expect(body.jobId).toBeDefined();
    expect(body.status).toBe("processing");
    expect(body.total).toBe(1);
    expect(body.statusUrl).toContain(body.jobId);
  });

  it("returns job status with results when complete", async () => {
    // Submit batch
    const submitResponse = await app.inject({
      method: "POST",
      url: "/v1/batch",
      payload: {
        items: [{ url: "https://example.com", type: "screenshot" }],
      },
      headers: { "content-type": "application/json" },
    });

    const { jobId } = submitResponse.json();

    // Wait for processing (includes lazy-load scrolling time)
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Check status
    const statusResponse = await app.inject({
      method: "GET",
      url: `/v1/batch/${jobId}`,
    });

    expect(statusResponse.statusCode).toBe(200);
    const body = statusResponse.json();
    expect(body.status).toBe("complete");
    expect(body.results).toHaveLength(1);
    expect(body.results[0].status).toBe("success");
    expect(body.results[0].data).toBeDefined(); // base64 encoded
    expect(body.results[0].contentType).toBe("image/png");
  }, 15_000);

  it("returns 404 for unknown job ID", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/batch/nonexistent-id",
    });

    expect(response.statusCode).toBe(404);
  });
});
