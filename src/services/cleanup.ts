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

  // Fundraising / donation / subscription popups
  '[class*="donation-banner"]',
  '[class*="fundraising"]',
  '[class*="support-banner"]',
  '[class*="contribution"]',
  '[id*="donation"]',
  '[id*="fundraising"]',
  ".frb-banner", // Wikipedia fundraising
  "#centralNotice", // Wikipedia central notice
  "#frbanner", // Wikipedia
  '[class*="site-message"]', // Guardian
  '[data-component="epic"]', // Guardian epic contribution popup
  '[class*="reader-revenue"]', // Guardian revenue prompts
  '[class*="paywall"]',
  '[class*="subscribe-banner"]',
  '[class*="membership"]',
  '[id*="paywall"]',

  // Generic role-based
  '[role="dialog"][aria-label*="cookie" i]',
  '[role="dialog"][aria-label*="consent" i]',
  '[role="dialog"][aria-label*="privacy" i]',
  '[role="alertdialog"][aria-label*="cookie" i]',
  '[role="region"][aria-label*="cookie" i]',

  // Promotional / announcement banners
  "global-banner", // GitHub
  '[class*="global-banner"]',
  '[class*="announcement-banner"]',
  '[class*="promo-banner"]',
  '[class*="top-banner"]',
  '[class*="site-banner"]',
  '[class*="marketing-banner"]',
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

  // Use string-based script to avoid __name decorator issues in tsx dev mode
  const script = `(function(selectors) {
    // Helper: fully collapse an element so it leaves no white space
    function collapseElement(el) {
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("visibility", "hidden", "important");
      el.style.setProperty("height", "0", "important");
      el.style.setProperty("max-height", "0", "important");
      el.style.setProperty("padding", "0", "important");
      el.style.setProperty("margin", "0", "important");
      el.style.setProperty("overflow", "hidden", "important");
    }

    // Phase 1: Hide elements matching known selectors
    for (var i = 0; i < selectors.length; i++) {
      try {
        var elements = document.querySelectorAll(selectors[i]);
        elements.forEach(function(el) {
          collapseElement(el);
        });
      } catch(e) {
        // Invalid selector, skip
      }
    }

    // Phase 2: Text-content-based detection for cookie banners
    var fixedElements = document.querySelectorAll(
      "div, section, aside, dialog, [role='dialog'], [role='alertdialog'], [role='banner'], [role='region']"
    );
    for (var j = 0; j < fixedElements.length; j++) {
      var el = fixedElements[j];
      var style = window.getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "sticky") continue;

      var text = (el.innerText || "").toLowerCase();
      var hasCookieText =
        (text.includes("cookie") || text.includes("consent")) &&
        (text.includes("accept") ||
          text.includes("decline") ||
          text.includes("agree") ||
          text.includes("preferences") ||
          text.includes("manage"));

      var hasFundraisingText =
        (text.includes("donate") ||
          text.includes("donation") ||
          text.includes("contribute") ||
          text.includes("contribution") ||
          text.includes("support us") ||
          text.includes("support our")) &&
        text.length < 500;

      if (hasCookieText || hasFundraisingText) {
        collapseElement(el);
      }
    }

    // Phase 3: High z-index overlay detection
    var allElements = document.querySelectorAll(
      "div, section, aside, dialog"
    );
    for (var k = 0; k < allElements.length; k++) {
      var el2 = allElements[k];
      var style2 = window.getComputedStyle(el2);
      var zIndex = parseInt(style2.zIndex, 10);
      var position = style2.position;
      var rect = el2.getBoundingClientRect();

      if (
        zIndex > 9000 &&
        (position === "fixed" || position === "absolute")
      ) {
        var coversWidth = rect.width > window.innerWidth * 0.5;
        var coversHeight = rect.height > window.innerHeight * 0.3;
        var isFullWidthBanner =
          rect.width > window.innerWidth * 0.9 && rect.height > 40;

        if ((coversWidth && coversHeight) || isFullWidthBanner) {
          collapseElement(el2);
        }
      }
    }

    // Phase 4: Remove backdrop/overlay divs that block interaction
    for (var m = 0; m < allElements.length; m++) {
      var el3 = allElements[m];
      var style3 = window.getComputedStyle(el3);
      var position3 = style3.position;
      var rect3 = el3.getBoundingClientRect();

      if (
        (position3 === "fixed" || position3 === "absolute") &&
        rect3.width >= window.innerWidth * 0.95 &&
        rect3.height >= window.innerHeight * 0.95
      ) {
        var bg = style3.backgroundColor;
        var opacity = parseFloat(style3.opacity);
        if (bg.includes("rgba") || (opacity > 0 && opacity < 1)) {
          collapseElement(el3);
        }
      }
    }

    // Remove overflow:hidden on body (often set by modals)
    if (window.getComputedStyle(document.body).overflow === "hidden") {
      document.body.style.overflow = "auto";
    }
    if (window.getComputedStyle(document.documentElement).overflow === "hidden") {
      document.documentElement.style.overflow = "auto";
    }
  })(${JSON.stringify(allSelectors)})`;

  await page.evaluate(script);
}
