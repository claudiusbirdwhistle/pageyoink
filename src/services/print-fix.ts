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
  // Use string-based script to avoid __name decorator issues in tsx dev mode
  await page.evaluate(`(function() {
    var elements = document.querySelectorAll("*");
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var style = window.getComputedStyle(el);
      var rect = el.getBoundingClientRect();

      var isHorizontalScroll =
        (style.overflowX === "hidden" ||
          style.overflowX === "scroll" ||
          style.overflowX === "auto") &&
        rect.width > 300;

      if (!isHorizontalScroll) continue;

      var isClipping = el.scrollWidth > el.clientWidth + 10;

      if (isClipping) {
        el.style.setProperty("overflow-x", "visible", "important");
        el.style.setProperty("overflow", "visible", "important");

        if (style.display === "flex" && style.flexWrap === "nowrap") {
          el.style.setProperty("flex-wrap", "wrap", "important");
        }
      }
    }
  })()`);

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
