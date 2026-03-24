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
  // Use string-based script to avoid __name decorator issues in tsx dev mode
  const script = `(function(selectors, domains, adSizes) {
    // Phase 1: Move known ad containers offscreen by selector
    for (var i = 0; i < selectors.length; i++) {
      try {
        document.querySelectorAll(selectors[i]).forEach(function(el) {
          el.style.setProperty("position", "absolute", "important");
          el.style.setProperty("left", "-9999px", "important");
          el.style.setProperty("top", "-9999px", "important");
          el.style.setProperty("pointer-events", "none", "important");
        });
      } catch(e) {
        /* invalid selector */
      }
    }

    // Phase 2: Move iframes with ad network sources offscreen
    var iframes = document.querySelectorAll("iframe");
    for (var j = 0; j < iframes.length; j++) {
      var iframe = iframes[j];
      var src = iframe.src || iframe.getAttribute("data-src") || "";
      var isAdDomain = false;
      for (var k = 0; k < domains.length; k++) {
        if (src.includes(domains[k])) { isAdDomain = true; break; }
      }
      if (isAdDomain) {
        iframe.style.setProperty("position", "absolute", "important");
        iframe.style.setProperty("left", "-9999px", "important");
        iframe.style.setProperty("top", "-9999px", "important");
        iframe.style.setProperty("pointer-events", "none", "important");
      }
    }

    // Phase 3: Heuristic — move iframes matching common ad dimensions
    for (var m = 0; m < iframes.length; m++) {
      var iframe2 = iframes[m];
      if (iframe2.style.position === "absolute") continue;
      var rect = iframe2.getBoundingClientRect();
      var isAdSize = false;
      for (var n = 0; n < adSizes.length; n++) {
        if (Math.abs(rect.width - adSizes[n][0]) < 5 && Math.abs(rect.height - adSizes[n][1]) < 5) {
          isAdSize = true; break;
        }
      }
      if (isAdSize) {
        iframe2.style.setProperty("position", "absolute", "important");
        iframe2.style.setProperty("left", "-9999px", "important");
        iframe2.style.setProperty("top", "-9999px", "important");
        iframe2.style.setProperty("pointer-events", "none", "important");
      }
    }
  })(${JSON.stringify(AD_SELECTORS)}, ${JSON.stringify(AD_DOMAINS)}, ${JSON.stringify(COMMON_AD_SIZES)})`;

  await page.evaluate(script);
}
