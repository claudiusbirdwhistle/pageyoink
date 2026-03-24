import { Page } from "puppeteer";

/**
 * Apply targeted fixes for Chrome's PDF renderer.
 *
 * Handles:
 * 1. Horizontal scroll containers (carousels) where content is clipped
 * 2. Overlapping absolute/relative positioned elements in print
 * 3. Headers/mastheads hidden by site print stylesheets
 * 4. Fixed/sticky elements that don't flow in print
 */
export async function applyPrintFixes(page: Page): Promise<void> {
  // Fix 1: Horizontal scroll containers (carousels)
  await page.evaluate(() => {
    const elements = document.querySelectorAll("*");
    for (const el of elements) {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      // Only target horizontal scroll containers:
      // - Has overflow-x hidden/scroll/auto
      // - Is wider than 300px (not a small UI element)
      // - Has children that extend beyond its bounds (content is clipped)
      const isHorizontalScroll =
        (style.overflowX === "hidden" ||
          style.overflowX === "scroll" ||
          style.overflowX === "auto") &&
        rect.width > 300;

      if (!isHorizontalScroll) continue;

      // Check if this element has content wider than its visible area
      const htmlEl = el as HTMLElement;
      const isClipping = htmlEl.scrollWidth > htmlEl.clientWidth + 10;

      if (isClipping) {
        // This is a carousel/horizontal scroll container with clipped content
        htmlEl.style.setProperty("overflow-x", "visible", "important");
        htmlEl.style.setProperty("overflow", "visible", "important");

        // If it's a flex container with nowrap, allow wrapping
        if (style.display === "flex" && style.flexWrap === "nowrap") {
          htmlEl.style.setProperty("flex-wrap", "wrap", "important");
        }
      }
    }
  });

  // Fix 2: Inject print-specific CSS for common layout issues
  await page.addStyleTag({
    content: `
      @media print {
        /* Force header/masthead visibility — many sites hide these in print */
        header, [role="banner"] {
          display: block !important;
          visibility: visible !important;
          position: static !important;
        }
        header * {
          visibility: visible !important;
        }

        /* Convert fixed/sticky elements to static for print flow */
        [style*="position: fixed"], [style*="position: sticky"] {
          position: static !important;
        }

        /* Prevent absolute-positioned elements from overlapping in print */
        figure, [class*="story-wrapper"], article {
          position: relative !important;
          overflow: visible !important;
        }

        /* Ensure images don't overflow their containers */
        img, picture, video, figure {
          max-width: 100% !important;
          height: auto !important;
          page-break-inside: avoid;
        }

        /* Prevent content from being clipped */
        [style*="overflow: hidden"] {
          overflow: visible !important;
        }
      }
    `,
  });
}
