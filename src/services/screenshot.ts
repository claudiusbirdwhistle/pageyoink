import { getBrowser } from "./browser.js";
import { cleanPage } from "./cleanup.js";
import { waitForPageReady } from "./readiness.js";
import { triggerLazyImages } from "./lazy-load.js";

export interface ScreenshotOptions {
  url: string;
  format?: "png" | "jpeg";
  quality?: number;
  fullPage?: boolean;
  width?: number;
  height?: number;
  deviceScaleFactor?: number;
  timeout?: number;
  clean?: boolean;
  smartWait?: boolean;
}

export interface ScreenshotResult {
  buffer: Buffer;
  contentType: string;
}

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const DEFAULT_TIMEOUT = 30_000;
const MAX_TIMEOUT = 60_000;
const MAX_RETRIES = 1;

export async function takeScreenshot(
  options: ScreenshotOptions,
): Promise<ScreenshotResult> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await attemptScreenshot(options);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Only retry on transient errors (connection closed, crashed, etc.)
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

async function attemptScreenshot(
  options: ScreenshotOptions,
): Promise<ScreenshotResult> {
  const {
    url,
    format = "png",
    quality,
    fullPage = false,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    deviceScaleFactor = 1,
    timeout = DEFAULT_TIMEOUT,
    clean = false,
    smartWait = false,
  } = options;

  const effectiveTimeout = Math.min(timeout, MAX_TIMEOUT);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({
      width,
      height,
      deviceScaleFactor,
    });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: effectiveTimeout,
    });

    // Scroll through page to trigger lazy-loaded images
    if (fullPage || smartWait) {
      await triggerLazyImages(page);
    }

    if (smartWait) {
      await waitForPageReady(page, Math.min(effectiveTimeout, 10_000));
    }

    if (clean) {
      await cleanPage(page);
    }

    const effectiveQuality =
      format === "jpeg" && quality !== undefined
        ? Math.min(Math.max(quality, 1), 100)
        : undefined;

    const buffer = (await page.screenshot({
      type: format,
      fullPage,
      encoding: "binary",
      quality: effectiveQuality,
    })) as Buffer;

    return {
      buffer,
      contentType: format === "png" ? "image/png" : "image/jpeg",
    };
  } finally {
    await page.close();
  }
}
