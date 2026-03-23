import { Page } from "puppeteer";

// Curated list of ad container selectors by ad network
const AD_SELECTORS = [
  // Google AdSense / GPT / Ad Manager
  "ins.adsbygoogle",
  '[id^="google_ads_"]',
  '[id^="div-gpt-ad"]',
  ".google-ad",
  'iframe[id^="google_ads_iframe"]',
  '[data-google-query-id]',

  // Taboola
  ".trc_rbox_container",
  '[id^="taboola-"]',
  ".taboola-widget",

  // Outbrain
  ".ob-widget",
  '[class*="outbrain"]',
  '[data-widget-id*="outbrain"]',

  // Amazon ads
  '[class*="amzn-ad"]',

  // Media.net
  '[id^="MediaNet"]',

  // Generic ad patterns
  '[class*="advertisement"]',
  '[class*="ad-banner"]',
  '[class*="ad-unit"]',
  '[class*="ad-container"]',
  '[class*="ad-wrapper"]',
  '[class*="ad-slot"]',
  '[class*="sponsored-content"]',
  '[id*="advertisement"]',
  '[data-ad-slot]',
  '[data-ad-unit]',
  '[aria-label="advertisement" i]',

  // Common wrapper patterns
  'aside[class*="ad"]',
  'div[class*="sidebar-ad"]',
  'div[class*="leaderboard"]',
  'div[class*="billboard"]',
  'div[class*="skyscraper"]',
  'div[class*="ad-break"]',
  'div[class*="dfp-"]',
];

// Known ad network domains for iframe detection
const AD_DOMAINS = [
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "amazon-adsystem.com",
  "taboola.com",
  "outbrain.com",
  "media.net",
  "adnxs.com",
  "criteo.com",
  "pubmatic.com",
  "rubiconproject.com",
  "openx.net",
  "casalemedia.com",
  "moatads.com",
  "quantserve.com",
  "adsrvr.org",
  "bidswitch.net",
  "sharethrough.com",
  "indexww.com",
];

// Common ad unit dimensions [width, height]
const COMMON_AD_SIZES = [
  [728, 90],
  [300, 250],
  [160, 600],
  [320, 50],
  [970, 250],
  [970, 90],
  [336, 280],
  [300, 600],
  [250, 250],
  [200, 200],
  [468, 60],
  [120, 600],
  [320, 100],
  [300, 50],
];

/**
 * Stealth ad hiding — lets all requests through (no network blocking),
 * then moves ad elements offscreen after page load. Uses offscreen
 * positioning instead of display:none to avoid triggering anti-adblock
 * detection scripts that check element visibility/dimensions.
 *
 * Call this AFTER page is fully loaded and detection scripts have run.
 */
export async function hideAdsStealthily(page: Page): Promise<void> {
  await page.evaluate(
    (selectors: string[], domains: string[], adSizes: number[][]) => {
      // Phase 1: Move known ad containers offscreen by selector
      for (const selector of selectors) {
        try {
          document.querySelectorAll(selector).forEach((el) => {
            const h = el as HTMLElement;
            h.style.setProperty("position", "absolute", "important");
            h.style.setProperty("left", "-9999px", "important");
            h.style.setProperty("top", "-9999px", "important");
            h.style.setProperty("pointer-events", "none", "important");
          });
        } catch {
          /* invalid selector */
        }
      }

      // Phase 2: Move iframes with ad network sources offscreen
      const iframes = document.querySelectorAll("iframe");
      for (const iframe of iframes) {
        const src = iframe.src || iframe.getAttribute("data-src") || "";
        if (domains.some((d) => src.includes(d))) {
          iframe.style.setProperty("position", "absolute", "important");
          iframe.style.setProperty("left", "-9999px", "important");
          iframe.style.setProperty("top", "-9999px", "important");
          iframe.style.setProperty("pointer-events", "none", "important");
        }
      }

      // Phase 3: Heuristic — move iframes matching common ad dimensions
      for (const iframe of iframes) {
        if (iframe.style.position === "absolute") continue; // already handled
        const rect = iframe.getBoundingClientRect();
        const isAdSize = adSizes.some(
          ([w, h]) =>
            Math.abs(rect.width - w) < 5 && Math.abs(rect.height - h) < 5,
        );
        if (isAdSize) {
          iframe.style.setProperty("position", "absolute", "important");
          iframe.style.setProperty("left", "-9999px", "important");
          iframe.style.setProperty("top", "-9999px", "important");
          iframe.style.setProperty("pointer-events", "none", "important");
        }
      }
    },
    AD_SELECTORS,
    AD_DOMAINS,
    COMMON_AD_SIZES,
  );
}
