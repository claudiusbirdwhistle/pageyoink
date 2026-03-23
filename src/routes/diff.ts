import { FastifyInstance } from "fastify";
import { takeScreenshot } from "../services/screenshot.js";
import { compareImages } from "../services/diff.js";

interface DiffBody {
  url1: string;
  url2: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
  clean?: boolean;
  blockAds?: boolean;
  threshold?: number;
  format?: "json" | "image";
}

export async function diffRoute(app: FastifyInstance) {
  app.post<{ Body: DiffBody }>(
    "/v1/diff",
    {
      schema: {
        body: {
          type: "object",
          required: ["url1", "url2"],
          properties: {
            url1: { type: "string" },
            url2: { type: "string" },
            width: { type: "number" },
            height: { type: "number" },
            fullPage: { type: "boolean" },
            clean: { type: "boolean" },
            blockAds: { type: "boolean" },
            threshold: { type: "number" },
            format: { type: "string", enum: ["json", "image"] },
          },
        },
      },
    },
    async (request, reply) => {
      const {
        url1,
        url2,
        width = 1280,
        height = 720,
        fullPage = false,
        clean = false,
        blockAds = false,
        threshold = 0.1,
        format = "json",
      } = request.body;

      // Validate URLs
      for (const url of [url1, url2]) {
        try {
          const parsed = new URL(url);
          if (!["http:", "https:"].includes(parsed.protocol)) {
            return reply.status(400).send({
              error: `Invalid URL: ${url}`,
            });
          }
        } catch {
          return reply.status(400).send({
            error: `Invalid URL: ${url}`,
          });
        }
      }

      try {
        // Capture both screenshots as PNG
        const [img1, img2] = await Promise.all([
          takeScreenshot({
            url: url1,
            format: "png",
            width,
            height,
            fullPage,
            clean,
            blockAds,
          }),
          takeScreenshot({
            url: url2,
            format: "png",
            width,
            height,
            fullPage,
            clean,
            blockAds,
          }),
        ]);

        const result = compareImages(img1.buffer, img2.buffer, threshold);

        if (format === "image") {
          return reply
            .header("Content-Type", "image/png")
            .header("X-Diff-Pixels", String(result.diffPixels))
            .header("X-Diff-Percentage", String(result.diffPercentage))
            .header("X-Diff-Identical", String(result.identical))
            .send(result.diffImage);
        }

        return {
          diffPixels: result.diffPixels,
          totalPixels: result.totalPixels,
          diffPercentage: result.diffPercentage,
          identical: result.identical,
          width: result.width,
          height: result.height,
          diffImage: result.diffImage.toString("base64"),
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Diff failed";
        request.log.error({ err }, "Diff failed");
        return reply.status(500).send({ error: message });
      }
    },
  );
}
