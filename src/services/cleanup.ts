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
  "#drift-widget-container", // Drift
  "#drift-frame-controller",
  "#hubspot-messages-iframe-container", // HubSpot
  "#fc_frame", // Freshchat
  ".crisp-client", // Crisp
  "#zsiq_float", // Zoho SalesIQ
  "[data-id='zsalesiq']",
  ".zopim", // Zendesk Chat (legacy)
  "#launcher", // Zendesk
  "#tidio-chat", // Tidio
  "#tawk-bubble-container", // Tawk.to
  "[class*='tawk-']",
];

/**
 * Remove cookie banners, consent dialogs, chat widgets, and common popups
 * from the page before taking a screenshot.
 */
export async function cleanPage(page: Page): Promise<void> {
  const allSelectors = [...COOKIE_BANNER_SELECTORS, ...POPUP_SELECTORS];

  await page.evaluate((selectors) => {
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          (el as HTMLElement).style.display = "none";
        });
      } catch {
        // Invalid selector, skip
      }
    }

    // Also hide elements with high z-index that cover the viewport
    // (likely overlays/modals)
    const allElements = document.querySelectorAll(
      "div, section, aside, dialog",
    );
    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      const zIndex = parseInt(style.zIndex, 10);
      const position = style.position;

      if (
        zIndex > 9000 &&
        (position === "fixed" || position === "absolute") &&
        el.getBoundingClientRect().width > window.innerWidth * 0.5 &&
        el.getBoundingClientRect().height > window.innerHeight * 0.3
      ) {
        (el as HTMLElement).style.display = "none";
      }
    }

    // Remove any overflow:hidden on body (often set by modals)
    document.body.style.overflow = "auto";
  }, allSelectors);
}
