import { Page } from "puppeteer";
import { getBrowser } from "./browser.js";
import { cleanPage } from "./cleanup.js";
import { waitForPageReady } from "./readiness.js";

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

export async function takeScreenshot(
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

    if (smartWait) {
      await waitForPageReady(page, Math.min(effectiveTimeout, 10_000));
    }

    if (clean) {
      await cleanPage(page);
    }

    const screenshotOptions: Parameters<Page["screenshot"]>[0] = {
      type: format,
      fullPage,
      encoding: "binary",
    };

    if (format === "jpeg" && quality !== undefined) {
      screenshotOptions.quality = Math.min(Math.max(quality, 1), 100);
    }

    const buffer = (await page.screenshot(screenshotOptions)) as Buffer;

    return {
      buffer,
      contentType: format === "png" ? "image/png" : "image/jpeg",
    };
  } finally {
    await page.close();
  }
}
