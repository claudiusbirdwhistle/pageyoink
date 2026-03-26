import { execFile } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

/**
 * Convert a PDF buffer to PDF/A format using Ghostscript.
 * PDF/A is an ISO-standardized subset of PDF for long-term archival.
 * Embeds all fonts, disables encryption, requires metadata.
 *
 * @param pdfBuffer - Input PDF buffer
 * @param level - PDF/A conformance level: "1b", "2b", or "3b"
 * @returns PDF/A buffer
 */
export async function convertToPdfA(
  pdfBuffer: Buffer,
  level: "1b" | "2b" | "3b" = "2b",
): Promise<Buffer> {
  const id = randomUUID();
  const inputPath = join(tmpdir(), `pageyoink-pdfa-in-${id}.pdf`);
  const outputPath = join(tmpdir(), `pageyoink-pdfa-out-${id}.pdf`);

  try {
    await writeFile(inputPath, pdfBuffer);

    // Map level to Ghostscript PDFA definition
    const pdfaDefMap: Record<string, string> = {
      "1b": "/pdfaid1b",
      "2b": "/pdfaid2b",
      "3b": "/pdfaid3b",
    };

    // Ghostscript requires a .ps preamble for PDF/A. We use the built-in one.
    const gsArgs = [
      "-dBATCH",
      "-dNOPAUSE",
      "-dQUIET",
      "-sDEVICE=pdfwrite",
      "-dPDFA=2",           // PDF/A-2
      "-dPDFACompatibilityPolicy=1", // Downgrade non-compliant features instead of failing
      "-sColorConversionStrategy=UseDeviceIndependentColor",
      `-sOutputFile=${outputPath}`,
      inputPath,
    ];

    // Adjust PDFA level
    if (level === "1b") {
      gsArgs[5] = "-dPDFA=1";
    } else if (level === "3b") {
      gsArgs[5] = "-dPDFA=3";
    }

    await new Promise<void>((resolve, reject) => {
      execFile("gs", gsArgs, { timeout: 30_000 }, (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(`Ghostscript PDF/A conversion failed: ${stderr || error.message}`));
        } else {
          resolve();
        }
      });
    });

    const result = await readFile(outputPath);
    return result;
  } finally {
    // Clean up temp files
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

/**
 * Check if Ghostscript is available on the system.
 */
export async function isGhostscriptAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile("gs", ["--version"], { timeout: 5000 }, (error) => {
      resolve(!error);
    });
  });
}
