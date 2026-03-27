import { FastifyInstance } from "fastify";
import { takeScreenshot } from "../services/screenshot.js";
import { annotateScreenshot, Annotation } from "../services/annotate.js";
import { validateUrlSafe } from "../utils/url.js";
import { classifyNavigationError } from "../utils/errors.js";

interface AnnotateBody {
  url: string;
  annotations: Annotation[];
  width?: number;
  height?: number;
  fullPage?: boolean;
  clean?: boolean;
  blockAds?: boolean | "cosmetic";
  antibot?: boolean;
}

export async function annotateRoute(app: FastifyInstance) {
  app.post<{ Body: AnnotateBody }>(
    "/v1/screenshot/annotate",
    {
      schema: {
        description:
          "Take a screenshot and apply annotations (arrows, boxes, blur regions, highlights, text labels). " +
          "Useful for bug reports, QA feedback, and visual documentation.",
        tags: ["Screenshot"],
        body: {
          type: "object",
          required: ["url", "annotations"],
          properties: {
            url: { type: "string", description: "URL to screenshot." },
            annotations: {
              type: "array",
              description: "Array of annotations to apply.",
              items: {
                type: "object",
                required: ["type", "x", "y"],
                properties: {
                  type: {
                    type: "string",
                    enum: ["arrow", "box", "blur", "highlight", "text"],
                    description: "Annotation type.",
                  },
                  x: { type: "number", description: "X position." },
                  y: { type: "number", description: "Y position." },
                  width: { type: "number", description: "Width (for box, blur, highlight)." },
                  height: { type: "number", description: "Height (for box, blur, highlight)." },
                  toX: { type: "number", description: "Arrow end X." },
                  toY: { type: "number", description: "Arrow end Y." },
                  color: { type: "string", description: "Hex color (default: #ff0000)." },
                  thickness: { type: "number", description: "Line thickness (default: 3)." },
                  text: { type: "string", description: "Text content (for text type)." },
                  fontSize: { type: "number", description: "Font size (default: 24)." },
                  blurRadius: { type: "number", description: "Blur radius (default: 10)." },
                },
              },
            },
            width: { type: "number", description: "Viewport width. Default: 1280." },
            height: { type: "number", description: "Viewport height. Default: 720." },
            fullPage: { type: "boolean", description: "Capture full scrollable page." },
            clean: { type: "boolean", description: "Remove overlays before capture." },
            blockAds: { description: "Block ads. true for network blocking, 'cosmetic' for visual hiding." },
            antibot: { type: "boolean", description: "Anti-bot evasion for Cloudflare/DataDome-protected sites." },
          },
        },
      },
    },
    async (request, reply) => {
      const {
        url: rawUrl,
        annotations,
        width = 1280,
        height = 720,
        fullPage = false,
        clean = false,
        blockAds = false,
        antibot = false,
      } = request.body;

      const validated = await validateUrlSafe(rawUrl);
      if ("error" in validated) {
        return reply.status(400).send({ error: validated.error });
      }

      try {
        const result = await takeScreenshot({
          url: validated.url,
          format: "png",
          width,
          height,
          fullPage,
          clean,
          blockAds,
          antibot,
        });

        const annotated = await annotateScreenshot(result.buffer, annotations);

        return reply
          .header("Content-Type", "image/png")
          .header(
            "Content-Disposition",
            'inline; filename="annotated-screenshot.png"',
          )
          .send(annotated);
      } catch (err) {
        const classified = classifyNavigationError(err);
        request.log.error({ err }, "Annotated screenshot failed");
        return reply
          .status(classified.statusCode)
          .send({ error: classified.message });
      }
    },
  );
}
