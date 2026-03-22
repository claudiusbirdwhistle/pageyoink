import Fastify from "fastify";
import cors from "@fastify/cors";
import { healthRoute } from "./routes/health.js";
import { screenshotRoute } from "./routes/screenshot.js";
import { pdfRoute } from "./routes/pdf.js";

export async function buildApp() {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "test",
  });

  await app.register(cors);
  await app.register(healthRoute);
  await app.register(screenshotRoute);
  await app.register(pdfRoute);

  return app;
}
