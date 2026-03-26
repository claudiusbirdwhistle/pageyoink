import { getBrowser, getStealthBrowser, launchProxyBrowser } from "./browser.js";
import { cleanPage } from "./cleanup.js";
import { waitForPageReady, installMutationTracker } from "./readiness.js";
import { triggerLazyImages } from "./lazy-load.js";
import { enableAdBlocking } from "./adblock.js";
import { hideAdsStealthily } from "./stealth-adblock.js";
import { analyzePage, getAdaptiveDelays, getOptimizedParams } from "./page-analysis.js";

export interface ScreenshotOptions {
  url: string;
  format?: "png" | "jpeg" | "webp";
  quality?: number;
  fullPage?: boolean;
  width?: number;
  height?: number;
  deviceScaleFactor?: number;
  timeout?: number;
  clean?: boolean;
  smartWait?: boolean;
  maxScroll?: number;
  blockAds?: boolean | "stealth";
  viewports?: number;
  css?: string;
  js?: string;
  headers?: Record<string, string>;
  cookies?: Array<{ name: string; value: string; domain?: string }>;
  userAgent?: string;
  selector?: string;
  transparentBg?: boolean;
  clickSelector?: string;
  clickCount?: number;
  proxy?: string;
  geolocation?: { latitude: number; longitude: number; accuracy?: number };
  timezone?: string;
  fonts?: string[];
  onProgress?: (stage: string) => void;
  optimize?: boolean;
  stealth?: boolean;
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
    viewports,
    css,
    js,
    headers,
    cookies,
    userAgent,
    selector,
    transparentBg = false,
    clickSelector,
    clickCount = 1,
    proxy,
    geolocation,
    timezone,
    fonts,
    onProgress,
    optimize = false,
    stealth = false,
  } = options;

  const notify = onProgress || (() => {});
  const effectiveTimeout = Math.min(timeout, MAX_TIMEOUT);

  const proxyBrowser = proxy ? await launchProxyBrowser(proxy) : null;
  const browser = proxyBrowser || (stealth ? await getStealthBrowser() : await getBrowser());
  const page = await browser.newPage();

  try {
    if (blockAds === true) {
      await enableAdBlocking(page);
    }

    if (geolocation) {
      const context = browser.defaultBrowserContext();
      await context.overridePermissions(url, ["geolocation"]);
      await page.setGeolocation(geolocation);
    }

    if (timezone) {
      try {
        await page.emulateTimezone(timezone);
      } catch {
        throw new Error(`Invalid timezone: "${timezone}". Use IANA format (e.g., America/New_York, Europe/London, Asia/Tokyo).`);
      }
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

    // If viewports is set, multiply the base height by that number
    const effectiveHeight = viewports ? height * viewports : height;

    await page.setViewport({
      width,
      height: effectiveHeight,
      deviceScaleFactor,
    });

    notify("navigating");
    await page.goto(url, {
      waitUntil: "load",
      timeout: effectiveTimeout,
    });

    notify("loaded");

    // Adaptive delay: analyze page complexity to determine optimal timings
    const analysis = await analyzePage(page);
    const delays = getAdaptiveDelays(analysis);

    // Auto-optimize: apply optimized params if enabled and not explicitly set
    let effectiveFormat = format;
    if (optimize) {
      const optimized = getOptimizedParams(analysis);
      if (!format) effectiveFormat = optimized.screenshotFormat;
      // If viewport wasn't explicitly set, resize to optimized width
      if (!width && optimized.screenshotWidth > (page.viewport()?.width || 1280)) {
        await page.setViewport({
          width: optimized.screenshotWidth,
          height: page.viewport()?.height || 720,
          deviceScaleFactor: deviceScaleFactor || optimized.screenshotDeviceScaleFactor,
        });
      }
    }

    // Post-load rendering delay (CSS transitions, JS-injected content)
    await new Promise((r) => setTimeout(r, delays.postLoadDelay));

    // Install mutation tracker for smart_wait (must be after goto)
    if (smartWait) {
      await installMutationTracker(page);
    }

    // Load custom web fonts
    if (fonts && fonts.length > 0) {
      const fontCss = fonts
        .map((f) => `@import url('${f}');`)
        .join("\n");
      await page.addStyleTag({ content: fontCss });
      await page.evaluate(`document.fonts.ready`);
    }

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

    // Click an element before capture (e.g., "Load More", "Accept", dismiss popup)
    if (clickSelector) {
      for (let i = 0; i < Math.min(clickCount, 10); i++) {
        try {
          await page.click(clickSelector);
          await new Promise((r) => setTimeout(r, 500));
        } catch {
          break; // Element not found or not clickable, stop
        }
      }
    }

    // Scroll through page to trigger lazy-loaded images
    if (fullPage || smartWait) {
      notify("scrolling");
      await triggerLazyImages(page, maxScroll, {
        skipPhase2: delays.skipPhase2Scroll,
        imageWaitTimeout: delays.imageWaitTimeout,
        postPaintDelay: delays.postPaintDelay,
      });
    }

    if (smartWait) {
      await waitForPageReady(page, Math.min(effectiveTimeout, 10_000));
    }

    if (clean) {
      notify("cleaning");
      await cleanPage(page);
    }

    // Stealth ad blocking: move ad elements offscreen after detection scripts ran
    if (blockAds === "stealth") {
      await hideAdsStealthily(page);
    }

    const renderFormat = effectiveFormat || "png";
    const effectiveQuality =
      (renderFormat === "jpeg" || renderFormat === "webp") && quality !== undefined
        ? Math.min(Math.max(quality, 1), 100)
        : undefined;

    notify("rendering");
    let buffer: Buffer;

    if (selector) {
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found for selector: ${selector}`);
      }
      buffer = (await element.screenshot({
        type: renderFormat,
        encoding: "binary",
        quality: effectiveQuality,
        omitBackground: transparentBg && renderFormat === "png",
      })) as Buffer;
    } else {
      buffer = (await page.screenshot({
        type: renderFormat,
        fullPage,
        encoding: "binary",
        quality: effectiveQuality,
        omitBackground: transparentBg && renderFormat === "png",
      })) as Buffer;
    }

    return {
      buffer,
      contentType: renderFormat === "png" ? "image/png" : renderFormat === "webp" ? "image/webp" : "image/jpeg",
    };
  } finally {
    await page.close();
    if (proxyBrowser) {
      await proxyBrowser.close();
    }
  }
}
