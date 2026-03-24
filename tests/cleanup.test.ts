import { describe, it, expect, afterAll } from "vitest";
import { getBrowser, closeBrowser } from "../src/services/browser.js";
import { cleanPage } from "../src/services/cleanup.js";

describe("Cleanup service (clean mode)", () => {
  afterAll(async () => {
    await closeBrowser();
  });

  it("hides elements matching cookie banner selectors", async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      // Create a page with a mock cookie banner
      await page.setContent(`
        <html><body>
          <div id="main">Main content</div>
          <div id="onetrust-banner-sdk" style="display:block;">Accept cookies?</div>
          <div class="cookie-banner" style="display:block;">Cookie notice</div>
        </body></html>
      `);

      await cleanPage(page);

      // Check that cookie elements are hidden
      const onetrustDisplay = await page.evaluate(
        `window.getComputedStyle(document.getElementById('onetrust-banner-sdk')).display`
      );
      expect(onetrustDisplay).toBe("none");

      const cookieBannerDisplay = await page.evaluate(
        `window.getComputedStyle(document.querySelector('.cookie-banner')).display`
      );
      expect(cookieBannerDisplay).toBe("none");

      // Main content should still be visible
      const mainDisplay = await page.evaluate(
        `window.getComputedStyle(document.getElementById('main')).display`
      );
      expect(mainDisplay).not.toBe("none");
    } finally {
      await page.close();
    }
  });

  it("restores overflow:hidden on body to auto", async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(`
        <html><body style="overflow:hidden;">
          <div>Content</div>
        </body></html>
      `);

      await cleanPage(page);

      const overflow = await page.evaluate(
        `document.body.style.overflow`
      );
      expect(overflow).toBe("auto");
    } finally {
      await page.close();
    }
  });

  it("does not change overflow:visible", async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(`
        <html><body style="overflow:visible;">
          <div>Content</div>
        </body></html>
      `);

      await cleanPage(page);

      // overflow:visible should remain unchanged
      const overflow = await page.evaluate(
        `window.getComputedStyle(document.body).overflow`
      );
      expect(overflow).toBe("visible");
    } finally {
      await page.close();
    }
  });

  it("text-based detection hides fixed cookie elements", async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(`
        <html><body>
          <div>Main content</div>
          <div id="cookie-fixed" style="position:fixed;bottom:0;width:100%;">
            We use cookies. Please accept or decline.
          </div>
        </body></html>
      `);

      await cleanPage(page);

      const display = await page.evaluate(
        `window.getComputedStyle(document.getElementById('cookie-fixed')).display`
      );
      expect(display).toBe("none");
    } finally {
      await page.close();
    }
  });
});
