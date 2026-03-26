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

  // Fix 2: Replace images with high-quality canvases for PDF rendering.
  // Chrome's PDF engine aggressively compresses <img> elements but preserves
  // <canvas> content at higher quality. This can increase PDF size significantly
  // but produces much sharper images.
  await page.evaluate(`(function() {
    var imgs = document.querySelectorAll("img");
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (!img.complete || !img.naturalWidth || img.naturalWidth < 10) continue;
      // Skip tiny images (icons, spacers, tracking pixels)
      if (img.offsetWidth < 50 || img.offsetHeight < 50) continue;
      // Skip images not visible (hidden, off-screen, display:none, ad elements)
      var rect = img.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      var imgStyle = window.getComputedStyle(img);
      if (imgStyle.display === "none" || imgStyle.visibility === "hidden") continue;
      if (rect.left < -1000 || rect.top < -1000) continue;

      try {
        var canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.style.width = img.offsetWidth + "px";
        canvas.style.height = img.offsetHeight + "px";
        canvas.style.maxWidth = "100%";
        canvas.style.height = "auto";
        canvas.style.display = img.style.display || "inline";

        var ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          img.parentNode.replaceChild(canvas, img);
        }
      } catch(e) {
        // CORS or other error — skip this image, keep the original
      }
    }
  })()`);

  // Fix 3: Inject print-specific CSS for common layout issues
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

        /* Ensure images and canvases don't overflow their containers */
        img, canvas, picture, video, figure {
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
