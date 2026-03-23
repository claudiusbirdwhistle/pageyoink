import { getBrowser } from "./browser.js";
import { cleanPage } from "./cleanup.js";
import { waitForPageReady } from "./readiness.js";
import { triggerLazyImages } from "./lazy-load.js";
import { enableAdBlocking } from "./adblock.js";

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
  clean?: boolean;
  smartWait?: boolean;
  maxScroll?: number;
  blockAds?: boolean;
}

export interface PdfResult {
  buffer: Buffer;
}

const DEFAULT_TIMEOUT = 30_000;
const MAX_TIMEOUT = 60_000;
const MAX_RETRIES = 1;

export async function generatePdf(options: PdfOptions): Promise<PdfResult> {
  if (!options.url && !options.html) {
    throw new Error("Either url or html must be provided");
  }

  // Only retry for URL-based PDFs (HTML content won't have transient failures)
  if (!options.url) {
    return attemptPdf(options);
  }

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await attemptPdf(options);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isTransient =
        lastError.message.includes("Connection closed") ||
        lastError.message.includes("crashed") ||
        lastError.message.includes("disconnected") ||
        lastError.message.includes("Target closed");

      if (!isTransient || attempt === MAX_RETRIES) {
        throw lastError;
      }
    }
  }

  throw lastError;
}

async function attemptPdf(options: PdfOptions): Promise<PdfResult> {
  const {
    url,
    html,
    format = "A4",
    landscape = false,
    printBackground = true,
    margin,
    timeout = DEFAULT_TIMEOUT,
    clean = false,
    smartWait = false,
    maxScroll,
    blockAds = false,
  } = options;

  const effectiveTimeout = Math.min(timeout, MAX_TIMEOUT);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    if (blockAds) {
      await enableAdBlocking(page);
    }
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

    // Scroll through page to trigger lazy-loaded images (PDFs always capture full page)
    await triggerLazyImages(page, maxScroll);

    if (smartWait) {
      await waitForPageReady(page, Math.min(effectiveTimeout, 10_000));
    }

    if (clean) {
      await cleanPage(page);
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
