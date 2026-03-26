import { PDFDocument } from "pdf-lib";
import { getBrowser, launchProxyBrowser } from "./browser.js";
import { cleanPage } from "./cleanup.js";
import { waitForPageReady, installMutationTracker } from "./readiness.js";
import { triggerLazyImages } from "./lazy-load.js";
import { enableAdBlocking } from "./adblock.js";
import { hideAdsStealthily } from "./stealth-adblock.js";
import { applyPrintFixes } from "./print-fix.js";
import { analyzePage, getAdaptiveDelays } from "./page-analysis.js";

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
  blockAds?: boolean | "stealth";
  css?: string;
  js?: string;
  headers?: Record<string, string>;
  cookies?: Array<{ name: string; value: string; domain?: string }>;
  userAgent?: string;
  proxy?: string;
  headerTemplate?: string;
  footerTemplate?: string;
  displayHeaderFooter?: boolean;
  pageRanges?: string;
  scale?: number;
  maxPages?: number;
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
    css,
    js,
    headers,
    cookies,
    userAgent,
    proxy,
    headerTemplate,
    footerTemplate,
    displayHeaderFooter = false,
    pageRanges,
    scale,
    maxPages,
  } = options;

  const effectiveTimeout = Math.min(timeout, MAX_TIMEOUT);

  const proxyBrowser = proxy ? await launchProxyBrowser(proxy) : null;
  const browser = proxyBrowser || (await getBrowser());
  const page = await browser.newPage();

  try {
    // Set desktop retina viewport so sites serve high-resolution images
    // Without this, Puppeteer defaults to 800x600 at 1x DPR and sites
    // serve mobile/low-res images via srcset/picture elements
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });

    if (blockAds === true) {
      await enableAdBlocking(page);
    }

    if (userAgent) {
      await page.setUserAgent(userAgent);
    }

    if (headers) {
      await page.setExtraHTTPHeaders(headers);
    }

    if (cookies && cookies.length > 0 && url) {
      const parsedUrl = new URL(url);
      const cookieObjects = cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain || parsedUrl.hostname,
      }));
      await page.setCookie(...cookieObjects);
    }

    if (url) {
      await page.goto(url, {
        waitUntil: "load",
        timeout: effectiveTimeout,
      });
    } else if (html) {
      await page.setContent(html, {
        waitUntil: "load",
        timeout: effectiveTimeout,
      });
    }

    // Adaptive delay based on page complexity
    const analysis = await analyzePage(page);
    const delays = getAdaptiveDelays(analysis);
    await new Promise((r) => setTimeout(r, html ? 300 : delays.postLoadDelay));

    // Install mutation tracker for smart_wait (must be after goto/setContent)
    if (smartWait) {
      await installMutationTracker(page);
    }

    // Inject custom CSS after page load
    if (css) {
      await page.addStyleTag({ content: css });
    }

    // Execute custom JS in page context (sandboxed by Puppeteer)
    if (js) {
      await page.evaluate(`(function(){${js}})()`);
    }

    // Scroll through page to trigger lazy-loaded images (PDFs always capture full page)
    // For PDFs, scroll the entire page unless user specified a limit
    const scrollDepth = maxScroll ?? Math.ceil(
      await page.evaluate(`document.body.scrollHeight / window.innerHeight`) + 2
    );
    await triggerLazyImages(page, scrollDepth, {
      skipPhase2: delays.skipPhase2Scroll,
      imageWaitTimeout: delays.imageWaitTimeout,
      postPaintDelay: delays.postPaintDelay,
    });

    if (smartWait) {
      await waitForPageReady(page, Math.min(effectiveTimeout, 10_000));
    }

    if (clean) {
      await cleanPage(page);
    }

    if (blockAds === "stealth") {
      await hideAdsStealthily(page);
    }

    // Apply print-mode CSS fixes (carousel overflow, flex-wrap, etc.)
    await applyPrintFixes(page);

    const pdfOptions: Parameters<typeof page.pdf>[0] = {
      format,
      landscape,
      printBackground,
      margin: margin || {
        top: displayHeaderFooter ? "1in" : "0.5in",
        right: "0.5in",
        bottom: displayHeaderFooter ? "1in" : "0.5in",
        left: "0.5in",
      },
    };

    if (scale !== undefined) {
      const clampedScale = Math.max(0.1, Math.min(2.0, scale));
      pdfOptions.scale = clampedScale;
    }

    if (displayHeaderFooter || headerTemplate || footerTemplate) {
      pdfOptions.displayHeaderFooter = true;
      pdfOptions.headerTemplate = headerTemplate || "<span></span>";
      pdfOptions.footerTemplate =
        footerTemplate ||
        '<div style="font-size:10px;text-align:center;width:100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>';
    }

    if (pageRanges) {
      pdfOptions.pageRanges = pageRanges;
    }

    const buffer = await page.pdf(pdfOptions);
    let finalBuffer = Buffer.from(buffer);

    if (maxPages && maxPages > 0) {
      const pdfDoc = await PDFDocument.load(finalBuffer);
      const totalPages = pdfDoc.getPageCount();
      if (totalPages > maxPages) {
        for (let i = totalPages - 1; i >= maxPages; i--) {
          pdfDoc.removePage(i);
        }
        finalBuffer = Buffer.from(await pdfDoc.save());
      }
    }

    return { buffer: finalBuffer };
  } finally {
    await page.close();
    if (proxyBrowser) {
      await proxyBrowser.close();
    }
  }
}
