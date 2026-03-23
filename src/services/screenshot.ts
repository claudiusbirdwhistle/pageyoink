import { getBrowser } from "./browser.js";
import { cleanPage } from "./cleanup.js";
import { waitForPageReady } from "./readiness.js";
import { triggerLazyImages } from "./lazy-load.js";
import { enableAdBlocking } from "./adblock.js";

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
  maxScroll?: number;
  blockAds?: boolean;
  css?: string;
  js?: string;
  headers?: Record<string, string>;
  cookies?: Array<{ name: string; value: string; domain?: string }>;
  userAgent?: string;
  selector?: string;
  transparentBg?: boolean;
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
    maxScroll,
    blockAds = false,
    css,
    js,
    headers,
    cookies,
    userAgent,
    selector,
    transparentBg = false,
  } = options;

  const effectiveTimeout = Math.min(timeout, MAX_TIMEOUT);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    if (blockAds) {
      await enableAdBlocking(page);
    }

    if (userAgent) {
      await page.setUserAgent(userAgent);
    }

    if (headers) {
      await page.setExtraHTTPHeaders(headers);
    }

    if (cookies && cookies.length > 0) {
      const parsedUrl = new URL(url);
      const cookieObjects = cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain || parsedUrl.hostname,
      }));
      await page.setCookie(...cookieObjects);
    }

    await page.setViewport({
      width,
      height,
      deviceScaleFactor,
    });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: effectiveTimeout,
    });

    // Inject custom CSS after page load
    if (css) {
      await page.addStyleTag({ content: css });
    }

    // Execute custom JS in page context (sandboxed by Puppeteer).
    // This is an intentional feature for pre-capture page manipulation,
    // matching competitor APIs (ApiFlash, ScreenshotAPI, Restpack).
    if (js) {
      await page.evaluate(`(function(){${js}})()`);
    }

    // Scroll through page to trigger lazy-loaded images
    if (fullPage || smartWait) {
      await triggerLazyImages(page, maxScroll);
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

    let buffer: Buffer;

    if (selector) {
      // Element capture: screenshot a specific DOM element
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found for selector: ${selector}`);
      }
      buffer = (await element.screenshot({
        type: format,
        encoding: "binary",
        quality: effectiveQuality,
        omitBackground: transparentBg && format === "png",
      })) as Buffer;
    } else {
      buffer = (await page.screenshot({
        type: format,
        fullPage,
        encoding: "binary",
        quality: effectiveQuality,
        omitBackground: transparentBg && format === "png",
      })) as Buffer;
    }

    return {
      buffer,
      contentType: format === "png" ? "image/png" : "image/jpeg",
    };
  } finally {
    await page.close();
  }
}
