import { FastifyInstance } from "fastify";
import { takeScreenshot } from "../services/screenshot.js";
import { compareImages } from "../services/diff.js";
import { validateUrlSafe } from "../utils/url.js";
import { classifyNavigationError } from "../utils/errors.js";

interface DiffBody {
  url1: string;
  url2: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
  clean?: boolean;
  blockAds?: boolean | "cosmetic";
  threshold?: number;
  format?: "json" | "image";
}

export async function diffRoute(app: FastifyInstance) {
  app.post<{ Body: DiffBody }>(
    "/v1/diff",
    {
      schema: {
        description: "Compare two URLs visually by capturing screenshots of both and computing a pixel-level diff. Returns diff statistics and a diff image highlighting changed pixels in red.",
        tags: ["Visual Diff"],
        body: {
          type: "object",
          required: ["url1", "url2"],
          properties: {
            url1: { type: "string", description: "First URL to capture and compare." },
            url2: { type: "string", description: "Second URL to capture and compare." },
            width: { type: "number", description: "Viewport width for both captures. Default: 1280." },
            height: { type: "number", description: "Viewport height for both captures. Default: 720." },
            fullPage: { type: "boolean", description: "Capture full scrollable page for both URLs. Default: false." },
            clean: { type: "boolean", description: "Remove cookie banners/popups before capture." },
            blockAds: { type: "boolean", description: "Block ads before capture." },
            threshold: { type: "number", description: "Color difference sensitivity from 0 (exact) to 1 (lenient). Lower = more sensitive to small color changes. Default: 0.1." },
            format: {
              type: "string",
              enum: ["json", "image"],
              description: "Response format. 'json': returns stats + base64 diff image. 'image': returns raw diff PNG with stats in X-Diff-* headers. Default: json.",
            },
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

      const n1 = await validateUrlSafe(url1);
      const n2 = await validateUrlSafe(url2);
      if ("error" in n1) return reply.status(400).send({ error: n1.error });
      if ("error" in n2) return reply.status(400).send({ error: n2.error });

      try {
        // Capture both screenshots as PNG
        const [img1, img2] = await Promise.all([
          takeScreenshot({
            url: n1.url!,
            format: "png",
            width,
            height,
            fullPage,
            clean,
            blockAds,
          }),
          takeScreenshot({
            url: n2.url!,
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
        const classified = classifyNavigationError(err);
        request.log.error({ err }, "Diff failed");
        return reply.status(classified.statusCode).send({ error: classified.message });
      }
    },
  );
}
