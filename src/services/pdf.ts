import { PDFDocument } from "pdf-lib";
import { getBrowser, getStealthBrowser, launchProxyBrowser, launchHttp1Browser } from "./browser.js";
import { cleanPage } from "./cleanup.js";
import { waitForPageReady, installMutationTracker } from "./readiness.js";
import { triggerLazyImages } from "./lazy-load.js";
import { enableAdBlocking } from "./adblock.js";
import { hideAdsStealthily } from "./stealth-adblock.js";
import { applyPrintFixes } from "./print-fix.js";
import { analyzePage, getAdaptiveDelays, getOptimizedParams } from "./page-analysis.js";

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
  blockAds?: boolean | "cosmetic";
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
  optimize?: boolean;
  antibot?: boolean;
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

      // HTTP/2 protocol errors: retry with HTTP/2 disabled
      if (lastError.message.includes("ERR_HTTP2_PROTOCOL_ERROR")) {
        try {
          return await attemptPdf({ ...options, _disableHttp2: true } as PdfOptions & { _disableHttp2: boolean });
        } catch (retryErr) {
          throw retryErr instanceof Error ? retryErr : lastError;
        }
      }

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

async function attemptPdf(options: PdfOptions & { _disableHttp2?: boolean }): Promise<PdfResult> {
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
    optimize = false,
    antibot = true,
  } = options;

  const effectiveTimeout = Math.min(timeout, MAX_TIMEOUT);

  const http1Browser = options._disableHttp2 ? await launchHttp1Browser() : null;
  const proxyBrowser = proxy ? await launchProxyBrowser(proxy) : null;
  const browser = http1Browser || proxyBrowser || (antibot ? await getStealthBrowser() : await getBrowser());
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

    // Auto-optimize: apply optimized PDF params if enabled and not explicitly set
    let effectiveFormat = format;
    let effectiveLandscape = landscape;
    let effectiveScale = scale;
    let effectiveMargin = margin;
    if (optimize) {
      const optimized = getOptimizedParams(analysis);
      if (!format) effectiveFormat = optimized.pdfFormat as typeof format;
      if (!landscape) effectiveLandscape = optimized.pdfLandscape;
      if (scale === undefined) effectiveScale = optimized.pdfScale;
      if (!margin) effectiveMargin = { top: optimized.pdfMargin, right: optimized.pdfMargin, bottom: optimized.pdfMargin, left: optimized.pdfMargin };
    }

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

    if (blockAds === "cosmetic") {
      await hideAdsStealthily(page);
    }

    // For PDFs, upgrade cosmetic ad hiding to display:none since
    // anti-adblock detection doesn't matter in print context.
    // Also catches ads that the offscreen method doesn't fully hide in print.
    if (blockAds) {
      await page.evaluate(`(function() {
        var selectors = ${JSON.stringify([
          'ins.adsbygoogle', '[id^="google_ads_"]', '[id^="div-gpt-ad"]',
          '.google-ad', 'iframe[id^="google_ads_iframe"]', '[data-google-query-id]',
          '.trc_rbox_container', '[id^="taboola-"]', '.taboola-widget',
          '.ob-widget', '[class*="outbrain"]', '[class*="advertisement"]',
          '[class*="ad-banner"]', '[class*="ad-unit"]', '[class*="ad-container"]',
          '[class*="ad-wrapper"]', '[class*="ad-slot"]', '[class*="sponsored-content"]',
          '[data-ad-slot]', '[data-ad-unit]', '[aria-label="advertisement" i]',
          // BBC-specific
          '.dotcom-ad', '.dotcom-slot', '[id^="dotcom-"]',
        ])};
        for (var i = 0; i < selectors.length; i++) {
          try {
            document.querySelectorAll(selectors[i]).forEach(function(el) {
              el.style.setProperty("display", "none", "important");
            });
          } catch(e) {}
        }
        // Also hide ad iframes by domain
        var adDomains = ${JSON.stringify([
          "doubleclick.net", "googlesyndication.com", "googleadservices.com",
          "amazon-adsystem.com", "taboola.com", "outbrain.com", "media.net",
          "adnxs.com", "criteo.com", "pubmatic.com",
        ])};
        var iframes = document.querySelectorAll("iframe");
        for (var j = 0; j < iframes.length; j++) {
          var src = iframes[j].src || "";
          for (var k = 0; k < adDomains.length; k++) {
            if (src.includes(adDomains[k])) {
              iframes[j].style.setProperty("display", "none", "important");
              break;
            }
          }
        }
      })()`);
    }

    // Freeze all CSS animations and transitions for consistent static capture
    await page.evaluate(`(function() {
      var style = document.createElement('style');
      style.textContent = '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }';
      document.head.appendChild(style);
    })()`);

    // Apply print-mode CSS fixes (carousel overflow, flex-wrap, etc.)
    await applyPrintFixes(page);

    const pdfOptions: Parameters<typeof page.pdf>[0] = {
      format: effectiveFormat,
      landscape: effectiveLandscape,
      printBackground,
      margin: effectiveMargin || {
        top: displayHeaderFooter ? "1in" : "0.5in",
        right: "0.5in",
        bottom: displayHeaderFooter ? "1in" : "0.5in",
        left: "0.5in",
      },
    };

    if (effectiveScale !== undefined) {
      const clampedScale = Math.max(0.1, Math.min(2.0, effectiveScale));
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
    if (http1Browser) {
      await http1Browser.close();
    }
  }
}
