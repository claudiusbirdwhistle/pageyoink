import { Page } from "puppeteer";

// Common cookie consent framework selectors
const COOKIE_BANNER_SELECTORS = [
  // Generic cookie banners
  '[class*="cookie-banner"]',
  '[class*="cookie-consent"]',
  '[class*="cookie-notice"]',
  '[class*="cookie-popup"]',
  '[class*="cookieBanner"]',
  '[class*="cookieConsent"]',
  '[class*="cookieNotice"]',
  '[id*="cookie-banner"]',
  '[id*="cookie-consent"]',
  '[id*="cookie-notice"]',
  '[id*="cookieBanner"]',
  '[id*="cookieConsent"]',

  // Popular consent management platforms
  "#onetrust-banner-sdk", // OneTrust
  "#onetrust-consent-sdk",
  ".onetrust-pc-dark-filter",
  "#CybotCookiebotDialog", // Cookiebot
  "#CybotCookiebotDialogBodyUnderlay",
  '[class*="cc-window"]', // Cookie Consent by Osano
  '[class*="cc-banner"]',
  "#cookieConsentContainer", // Generic
  ".js-cookie-consent",
  "#gdpr-cookie-notice",
  "#cookie-law-info-bar", // Cookie Law Info WP plugin
  ".cli-modal-container",
  "#moove_gdpr_cookie_info_bar", // Moove GDPR WP plugin
  '[data-testid="cookie-policy-manage-dialog"]',
  ".evidon-barrier", // Evidon/Crownpeak
  "#truste-consent-track", // TrustArc
  "#consent_blackbar",
  "#qc-cmp2-container", // Quantcast
  ".qc-cmp2-container",
  "#sp_message_container_0", // Sourcepoint
  '[class*="consent-manager"]',
  '[class*="gdpr"]',
  '[class*="privacy-banner"]',
  '[class*="privacy-notice"]',

  // HubSpot cookie banner
  "#hs-eu-cookie-confirmation",
  "#hs-banner-parent",

  // Generic role-based
  '[role="dialog"][aria-label*="cookie" i]',
  '[role="dialog"][aria-label*="consent" i]',
  '[role="dialog"][aria-label*="privacy" i]',
  '[role="alertdialog"][aria-label*="cookie" i]',
  '[role="region"][aria-label*="cookie" i]',
];

// Common popup/modal/overlay selectors
const POPUP_SELECTORS = [
  // Newsletter/signup popups
  '[class*="newsletter-popup"]',
  '[class*="newsletter-modal"]',
  '[class*="signup-popup"]',
  '[class*="signup-modal"]',
  '[class*="subscribe-popup"]',
  '[class*="subscribe-modal"]',
  '[class*="email-popup"]',
  '[class*="email-modal"]',

  // Generic popups
  '[class*="popup-overlay"]',
  '[class*="modal-overlay"]',
  '[class*="popup-backdrop"]',
  '[class*="modal-backdrop"]:not(.modal-backdrop)', // Exclude Bootstrap's required backdrop

  // Chat widgets
  "#intercom-container", // Intercom
  "#intercom-frame",
  ".intercom-lightweight-app",
  ".intercom-messenger-frame",
  "#drift-widget-container", // Drift
  "#drift-frame-controller",
  "#hubspot-messages-iframe-container", // HubSpot
  'iframe[title="Chat Widget"]', // HubSpot chat iframe
  "#fc_frame", // Freshchat
  ".crisp-client", // Crisp
  "#zsiq_float", // Zoho SalesIQ
  "[data-id='zsalesiq']",
  ".zopim", // Zendesk Chat (legacy)
  "#launcher", // Zendesk
  "#tidio-chat", // Tidio
  "#tawk-bubble-container", // Tawk.to
  "[class*='tawk-']",
  "#fb-root", // Facebook Messenger
  ".fb-customerchat",
  "#beacon-container", // Help Scout Beacon
  "[class*='helpscout']",
  "#front-chat-container", // Front
  "[class*='olark']", // Olark
  "#livechat-compact-container", // LiveChat
  "#livechat-full",
  "#chat-application", // Generic
  'iframe[title*="chat" i]',
  'iframe[title*="messenger" i]',
];

/**
 * Remove cookie banners, consent dialogs, chat widgets, and common popups
 * from the page before taking a screenshot.
 */
export async function cleanPage(page: Page): Promise<void> {
  const allSelectors = [...COOKIE_BANNER_SELECTORS, ...POPUP_SELECTORS];

  await page.evaluate((selectors) => {
    // Phase 1: Hide elements matching known selectors
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          (el as HTMLElement).style.setProperty("display", "none", "important");
          (el as HTMLElement).style.setProperty("visibility", "hidden", "important");
        });
      } catch {
        // Invalid selector, skip
      }
    }

    // Phase 2: Text-content-based detection for cookie banners
    // Find fixed/sticky elements containing cookie-related text
    const fixedElements = document.querySelectorAll(
      "div, section, aside, dialog, [role='dialog'], [role='alertdialog'], [role='banner'], [role='region']",
    );
    for (const el of fixedElements) {
      const style = window.getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "sticky") continue;

      const text = ((el as HTMLElement).innerText || "").toLowerCase();
      const hasCookieText =
        (text.includes("cookie") || text.includes("consent")) &&
        (text.includes("accept") ||
          text.includes("decline") ||
          text.includes("agree") ||
          text.includes("preferences") ||
          text.includes("manage"));

      if (hasCookieText) {
        (el as HTMLElement).style.setProperty("display", "none", "important");
      }
    }

    // Phase 3: High z-index overlay detection
    const allElements = document.querySelectorAll(
      "div, section, aside, dialog",
    );
    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      const zIndex = parseInt(style.zIndex, 10);
      const position = style.position;
      const rect = el.getBoundingClientRect();

      if (
        zIndex > 9000 &&
        (position === "fixed" || position === "absolute")
      ) {
        const coversWidth = rect.width > window.innerWidth * 0.5;
        const coversHeight = rect.height > window.innerHeight * 0.3;
        // Full-width banner (like cookie notices at top/bottom)
        const isFullWidthBanner =
          rect.width > window.innerWidth * 0.9 && rect.height > 40;

        if ((coversWidth && coversHeight) || isFullWidthBanner) {
          (el as HTMLElement).style.setProperty("display", "none", "important");
        }
      }
    }

    // Phase 4: Remove backdrop/overlay divs that block interaction
    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      const position = style.position;
      const rect = el.getBoundingClientRect();

      if (
        (position === "fixed" || position === "absolute") &&
        rect.width >= window.innerWidth * 0.95 &&
        rect.height >= window.innerHeight * 0.95
      ) {
        const bg = style.backgroundColor;
        const opacity = parseFloat(style.opacity);
        if (bg.includes("rgba") || (opacity > 0 && opacity < 1)) {
          (el as HTMLElement).style.setProperty("display", "none", "important");
        }
      }
    }

    // Remove any overflow:hidden on body (often set by modals)
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }, allSelectors);
}
