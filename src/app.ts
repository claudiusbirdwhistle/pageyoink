import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { healthRoute } from "./routes/health.js";
import { screenshotRoute } from "./routes/screenshot.js";
import { pdfRoute } from "./routes/pdf.js";
import { batchRoute } from "./routes/batch.js";
import { landingRoute } from "./routes/landing.js";
import { usageRoute } from "./routes/usage.js";
import { diffRoute } from "./routes/diff.js";
import { extractRoute } from "./routes/extract.js";
import { metadataRoute } from "./routes/metadata.js";
import { pageRoute } from "./routes/page.js";
import { trialRoute } from "./routes/trial.js";
import { structuredRoute } from "./routes/structured.js";
import { archiveRoute } from "./routes/archive.js";
import { authMiddleware } from "./middleware/auth.js";

export async function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "test",
  });

  // Global error handler: standardize all error responses to {"error":"message"}
  app.setErrorHandler(async (error, request, reply) => {
    // Fastify validation errors (schema validation)
    if (error.validation) {
      return reply.status(400).send({
        error: error.message,
      });
    }

    // Rate limit errors
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: "Too many requests. Please slow down.",
      });
    }

    // Don't leak stack traces in production
    const message = error.message || "Internal server error";
    const statusCode = error.statusCode || 500;

    if (statusCode >= 500) {
      request.log.error({ err: error }, "Unhandled error");
    }

    return reply.status(statusCode).send({
      error: process.env.NODE_ENV === "production" && statusCode >= 500
        ? "Internal server error"
        : message,
    });
  });

  // Security headers (Helmet-style)
  app.addHook("onSend", async (request, reply) => {
    reply.header("X-Request-Id", request.id);
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("X-XSS-Protection", "0"); // Modern approach: rely on CSP
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    reply.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  });

  await app.register(cors);
  await app.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_PER_MINUTE || "60", 10),
    timeWindow: "1 minute",
    addHeadersOnExceeding: { "x-ratelimit-limit": true, "x-ratelimit-remaining": true, "x-ratelimit-reset": true },
    addHeaders: { "x-ratelimit-limit": true, "x-ratelimit-remaining": true, "x-ratelimit-reset": true, "retry-after": true },
    keyGenerator: (request) => {
      return (
        (request.headers["x-api-key"] as string) ||
        (request.query as Record<string, string>)?.api_key ||
        request.ip
      );
    },
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "PageYoink API",
        description:
          "Yoink pages into screenshots and PDFs. Fast, intelligent capture API.",
        version: "0.1.0",
      },
      servers: [
        { url: "http://localhost:3000", description: "Local development" },
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: "apiKey",
            name: "x-api-key",
            in: "header",
            description: "API key for authentication",
          },
        },
      },
      security: [{ apiKey: [] }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });

  await app.register(authMiddleware);
  await app.register(trialRoute);
  await app.register(healthRoute);
  await app.register(screenshotRoute);
  await app.register(pdfRoute);
  await app.register(batchRoute);
  await app.register(landingRoute);
  await app.register(usageRoute);
  await app.register(diffRoute);
  await app.register(extractRoute);
  await app.register(metadataRoute);
  await app.register(pageRoute);
  await app.register(structuredRoute);
  await app.register(archiveRoute);

  return app;
}
