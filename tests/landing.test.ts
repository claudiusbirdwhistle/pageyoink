import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";

describe("Landing page", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET / returns 200 with HTML", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/",
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
  });

  it("contains Capture Page button", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/",
    });
    expect(response.body).toContain("Capture Page");
  });

  it("contains all 5 tabs", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/",
    });
    const body = response.body;
    expect(body).toContain('data-tab="screenshot"');
    expect(body).toContain('data-tab="pdf"');
    expect(body).toContain('data-tab="content"');
    expect(body).toContain('data-tab="metadata"');
    expect(body).toContain('data-tab="structured"');
  });

  it("contains updated branding", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/",
    });
    expect(response.body).toContain("The Web Page API");
    expect(response.body).toContain("PageYoink");
  });

  it("contains link to API docs", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/",
    });
    expect(response.body).toContain("/docs");
  });

  it("contains all 3 demo tabs", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/",
    });
    const body = response.body;
    expect(body).toContain('data-demo="capture"');
    expect(body).toContain('data-demo="clean"');
    expect(body).toContain('data-demo="diff"');
  });

  it("contains demo panel containers", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/",
    });
    const body = response.body;
    expect(body).toContain('id="demo-capture"');
    expect(body).toContain('id="demo-clean"');
    expect(body).toContain('id="demo-diff"');
  });
});
