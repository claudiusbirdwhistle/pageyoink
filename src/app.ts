import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { healthRoute } from "./routes/health.js";
import { screenshotRoute } from "./routes/screenshot.js";
import { pdfRoute } from "./routes/pdf.js";
import { ogImageRoute } from "./routes/og-image.js";
import { batchRoute } from "./routes/batch.js";
import { landingRoute } from "./routes/landing.js";
import { usageRoute } from "./routes/usage.js";
import { diffRoute } from "./routes/diff.js";
import { authMiddleware } from "./middleware/auth.js";

export async function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "test",
  });

  await app.register(cors);
  await app.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_PER_MINUTE || "60", 10),
    timeWindow: "1 minute",
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
          "Yoink pages into screenshots, PDFs, and OG images. Fast, intelligent capture API.",
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
  await app.register(healthRoute);
  await app.register(screenshotRoute);
  await app.register(pdfRoute);
  await app.register(ogImageRoute);
  await app.register(batchRoute);
  await app.register(landingRoute);
  await app.register(usageRoute);
  await app.register(diffRoute);

  return app;
}
