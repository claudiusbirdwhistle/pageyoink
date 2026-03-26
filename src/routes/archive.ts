import { FastifyInstance } from "fastify";
import { validateUrlSafe } from "../utils/url.js";
import { classifyNavigationError } from "../utils/errors.js";
import { captureArchive } from "../services/archive.js";
import archiver from "archiver";

interface ArchiveBody {
  url: string;
  timeout?: number;
}

export async function archiveRoute(app: FastifyInstance) {
  app.post<{ Body: ArchiveBody }>(
    "/v1/archive",
    {
      schema: {
        description:
          "Timestamped web archive capture. Returns a ZIP containing: WARC file (ISO 28500), " +
          "PDF render, full-page screenshot, metadata JSON with SHA-256 content hash, " +
          "HTTP headers, resolved IP, and TLS certificate info. " +
          "NO page manipulation is applied (no clean mode, no CSS/JS injection) — " +
          "this is a raw, forensic-grade capture. " +
          "DISCLAIMER: This provides technical proof of content at a point in time. " +
          "It is NOT legal certification. Consult legal counsel regarding admissibility in your jurisdiction.",
        tags: ["Archive"],
        body: {
          type: "object",
          required: ["url"],
          properties: {
            url: {
              type: "string",
              description: "URL to archive.",
            },
            timeout: {
              type: "number",
              description: "Max page load time in ms. Default: 30000. Archives use networkidle2 for thoroughness.",
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { url: rawUrl, timeout = 30_000 } = request.body;

      const validated = await validateUrlSafe(rawUrl);
      if ("error" in validated) {
        return reply.status(400).send({ error: validated.error });
      }

      try {
        const result = await captureArchive(
          validated.url,
          Math.min(timeout, 60_000),
        );

        // Build ZIP archive
        const archive = archiver("zip", { zlib: { level: 9 } });
        const chunks: Buffer[] = [];

        archive.on("data", (chunk: Buffer) => chunks.push(chunk));

        const archivePromise = new Promise<Buffer>((resolve, reject) => {
          archive.on("end", () => resolve(Buffer.concat(chunks)));
          archive.on("error", reject);
        });

        // Add files to ZIP
        archive.append(result.warc, { name: "capture.warc" });
        archive.append(result.pdfBuffer, { name: "capture.pdf" });
        archive.append(result.screenshotBuffer, { name: "capture.png" });
        archive.append(JSON.stringify(result.metadata, null, 2), {
          name: "metadata.json",
        });
        archive.append(
          `SHA-256: ${result.contentHash}\nTimestamp: ${result.timestamp}\nURL: ${result.metadata.url}\n`,
          { name: "checksum.txt" },
        );

        await archive.finalize();
        const zipBuffer = await archivePromise;

        const filename = `archive-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;

        return reply
          .header("Content-Type", "application/zip")
          .header("Content-Disposition", `attachment; filename="${filename}"`)
          .header("X-Content-Hash", result.contentHash)
          .header("X-Capture-Timestamp", result.timestamp)
          .header("X-Capture-Id", result.metadata.captureId)
          .send(zipBuffer);
      } catch (err) {
        const classified = classifyNavigationError(err);
        request.log.error({ err }, "Archive capture failed");
        return reply
          .status(classified.statusCode)
          .send({ error: classified.message });
      }
    },
  );
}
