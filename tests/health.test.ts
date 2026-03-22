import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { FastifyInstance } from "fastify";

describe("Health endpoint", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns status ok", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/health",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.status).toBe("ok");
    expect(body.version).toBe("0.1.0");
    expect(body.uptime).toBeDefined();
    expect(body.usage).toBeDefined();
    expect(body.usage.totalKeys).toBe(0);
    expect(body.usage.totalRequests).toBe(0);
  });
});
