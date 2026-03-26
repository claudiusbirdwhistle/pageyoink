import { Page } from "puppeteer";

const DEFAULT_MAX_SCROLL_SCREENS = 10;
const MAX_SCROLL_TIME_MS = 15_000;

export interface LazyLoadOptions {
  maxScrollScreens?: number;
  skipPhase2?: boolean;
  imageWaitTimeout?: number;
  postPaintDelay?: number;
}

/**
 * Scroll through the page to trigger lazy-loaded images,
 * then scroll back to top and wait for all images to finish loading.
 * Caps scrolling to avoid infinite scroll traps.
 *
 * @param maxScrollScreens - Max viewport heights to scroll (default 10)
 * @param opts - Adaptive options from page analysis
 */
export async function triggerLazyImages(
  page: Page,
  maxScrollScreens: number = DEFAULT_MAX_SCROLL_SCREENS,
  opts: LazyLoadOptions = {},
): Promise<void> {
  const {
    skipPhase2 = false,
    imageWaitTimeout = 10000,
    postPaintDelay = 1000,
  } = opts;
  // Phase 1: Scroll through the page to trigger lazy loading
  // Use string-based script to avoid __name decorator issues in tsx dev mode
  await page.evaluate(`(function(maxScreens, maxTimeMs) {
    return new Promise(function(resolve) {
      var viewportHeight = window.innerHeight;
      var maxScrollPx = viewportHeight * maxScreens;
      var scrollStep = viewportHeight * 0.8;
      var startTime = Date.now();

      var currentPosition = 0;
      var lastScrollHeight = document.body.scrollHeight;
      var stableCount = 0;

      var interval = setInterval(function() {
        var elapsed = Date.now() - startTime;
        var scrollHeight = document.body.scrollHeight;

        var atMaxDepth = currentPosition >= maxScrollPx;
        var pastContent = currentPosition >= scrollHeight;
        var timedOut = elapsed >= maxTimeMs;

        if (scrollHeight === lastScrollHeight) {
          stableCount++;
        } else {
          stableCount = 0;
          lastScrollHeight = scrollHeight;
        }
        var contentStable =
          stableCount >= 3 && currentPosition >= scrollHeight;

        if (atMaxDepth || pastContent || contentStable || timedOut) {
          window.scrollTo(0, 0);
          clearInterval(interval);
          resolve();
          return;
        }

        currentPosition += scrollStep;
        window.scrollTo(0, currentPosition);
      }, 200);
    });
  })(${maxScrollScreens}, ${MAX_SCROLL_TIME_MS})`);

  // Phase 2: Scroll again slowly to let intersection observers fire
  // Some sites (NYTimes) use JS intersection observers that need elements
  // to be in the viewport briefly for content to render
  // Skip for short pages or pages with no lazy images
  if (!skipPhase2) {
    const phase2TimeMs = Math.min(MAX_SCROLL_TIME_MS, 10_000);
    await page.evaluate(`(function(maxTimeMs) {
      return new Promise(function(resolve) {
        var viewportHeight = window.innerHeight;
        var scrollHeight = document.body.scrollHeight;
        var step = viewportHeight * 0.5;
        var startTime = Date.now();
        var y = 0;

        function scrollNext() {
          if (y >= scrollHeight || Date.now() - startTime > maxTimeMs) {
            window.scrollTo(0, 0);
            resolve();
            return;
          }
          window.scrollTo(0, y);
          y += step;
          setTimeout(scrollNext, 150);
        }
        scrollNext();
      });
    })(${phase2TimeMs})`);
  }

  // Phase 3: Force all lazy images to load eagerly
  await page.evaluate(`(function() {
    var images = Array.from(document.querySelectorAll("img"));
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      if (img.loading === "lazy") {
        img.loading = "eager";
      }
      if (img.src && !img.src.startsWith("data:") && img.naturalWidth === 0) {
        var src = img.src;
        img.src = "";
        img.src = src;
      }
    }
    var pictures = document.querySelectorAll("picture");
    pictures.forEach(function(pic) {
      var img = pic.querySelector("img");
      if (img && img.naturalWidth === 0 && img.src) {
        var sources = pic.querySelectorAll("source");
        sources.forEach(function(s) { s.remove(); });
        var src = img.src;
        img.src = "";
        img.src = src;
      }
    });
  })()`);

  // Phase 4: Wait for all images to finish loading
  await page.evaluate(`(function() {
    var images = Array.from(document.querySelectorAll("img"));
    var promises = images
      .filter(function(img) { return img.src && !img.src.startsWith("data:") && !img.complete; })
      .map(function(img) {
        return new Promise(function(resolve) {
          img.addEventListener("load", function() { resolve(); }, { once: true });
          img.addEventListener("error", function() { resolve(); }, { once: true });
          if (img.complete) resolve();
        });
      });

    return Promise.race([
      Promise.all(promises),
      new Promise(function(resolve) { setTimeout(resolve, ${imageWaitTimeout}); })
    ]);
  })()`);

  // Phase 5: Wait for browser to finish painting
  await new Promise((resolve) => setTimeout(resolve, postPaintDelay));
}
