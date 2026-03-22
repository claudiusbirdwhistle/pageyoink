import { getBrowser } from "./browser.js";

export interface PdfOptions {
  url?: string;
  html?: string;
  format?: "A4" | "Letter" | "Legal" | "A3";
  landscape?: boolean;
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  timeout?: number;
}

export interface PdfResult {
  buffer: Buffer;
}

const DEFAULT_TIMEOUT = 30_000;
const MAX_TIMEOUT = 60_000;

export async function generatePdf(options: PdfOptions): Promise<PdfResult> {
  const {
    url,
    html,
    format = "A4",
    landscape = false,
    printBackground = true,
    margin,
    timeout = DEFAULT_TIMEOUT,
  } = options;

  if (!url && !html) {
    throw new Error("Either url or html must be provided");
  }

  const effectiveTimeout = Math.min(timeout, MAX_TIMEOUT);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    if (url) {
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: effectiveTimeout,
      });
    } else if (html) {
      await page.setContent(html, {
        waitUntil: "networkidle2",
        timeout: effectiveTimeout,
      });
    }

    const buffer = await page.pdf({
      format,
      landscape,
      printBackground,
      margin: margin || {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
    });

    return { buffer: Buffer.from(buffer) };
  } finally {
    await page.close();
  }
}
