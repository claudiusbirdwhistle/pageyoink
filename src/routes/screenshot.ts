import { FastifyInstance } from "fastify";
import { takeScreenshot } from "../services/screenshot.js";

interface ScreenshotQuery {
  url: string;
  format?: "png" | "jpeg";
  quality?: string;
  full_page?: string;
  width?: string;
  height?: string;
  device_scale_factor?: string;
  timeout?: string;
  clean?: string;
  smart_wait?: string;
  max_scroll?: string;
}

const screenshotQuerySchema = {
  type: "object" as const,
  required: ["url"],
  properties: {
    url: { type: "string" as const },
    format: { type: "string" as const, enum: ["png", "jpeg"] },
    quality: { type: "string" as const },
    full_page: { type: "string" as const },
    width: { type: "string" as const },
    height: { type: "string" as const },
    device_scale_factor: { type: "string" as const },
    timeout: { type: "string" as const },
    clean: { type: "string" as const },
    smart_wait: { type: "string" as const },
    max_scroll: { type: "string" as const },
  },
};

export async function screenshotRoute(app: FastifyInstance) {
  app.get<{ Querystring: ScreenshotQuery }>(
    "/v1/screenshot",
    {
      schema: {
        querystring: screenshotQuerySchema,
      },
    },
    async (request, reply) => {
      const {
        url,
        format,
        quality,
        full_page,
        width,
        height,
        device_scale_factor,
        timeout,
        clean,
        smart_wait,
        max_scroll,
      } = request.query;

      // Validate URL
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return reply.status(400).send({
            error: "Invalid URL: only http and https protocols are supported",
          });
        }
      } catch {
        return reply
          .status(400)
          .send({ error: "Invalid URL: must be a valid URL" });
      }

      try {
        const result = await takeScreenshot({
          url,
          format: format || "png",
          quality: quality ? parseInt(quality, 10) : undefined,
          fullPage: full_page === "true",
          width: width ? parseInt(width, 10) : undefined,
          height: height ? parseInt(height, 10) : undefined,
          deviceScaleFactor: device_scale_factor
            ? parseFloat(device_scale_factor)
            : undefined,
          timeout: timeout ? parseInt(timeout, 10) : undefined,
          clean: clean === "true",
          smartWait: smart_wait === "true",
          maxScroll: max_scroll ? parseInt(max_scroll, 10) : undefined,
        });

        return reply
          .header("Content-Type", result.contentType)
          .header(
            "Content-Disposition",
            `inline; filename="screenshot.${format || "png"}"`,
          )
          .send(result.buffer);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Screenshot failed";
        request.log.error({ err }, "Screenshot failed");
        return reply.status(500).send({ error: message });
      }
    },
  );
}
