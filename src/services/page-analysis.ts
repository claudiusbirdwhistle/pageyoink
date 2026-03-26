import { Page } from "puppeteer";

export type PageComplexity = "short" | "medium" | "long";

export interface PageAnalysis {
  complexity: PageComplexity;
  viewportPages: number;
  lazyImageCount: number;
  totalImageCount: number;
}

/**
 * Analyze a loaded page to determine its complexity.
 * Call after page.goto() and the initial render delay.
 * Returns classification used by adaptive capture pipeline.
 */
export async function analyzePage(page: Page): Promise<PageAnalysis> {
  const result = await page.evaluate(`(function() {
    var viewportHeight = window.innerHeight || 720;
    var scrollHeight = document.body.scrollHeight || viewportHeight;
    var viewportPages = scrollHeight / viewportHeight;

    var images = document.querySelectorAll("img");
    var totalImageCount = images.length;
    var lazyImageCount = 0;
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      if (img.loading === "lazy" || img.getAttribute("data-src") || img.getAttribute("data-lazy")) {
        lazyImageCount++;
      }
    }

    return {
      viewportPages: viewportPages,
      totalImageCount: totalImageCount,
      lazyImageCount: lazyImageCount
    };
  })()`) as { viewportPages: number; totalImageCount: number; lazyImageCount: number };

  let complexity: PageComplexity;
  if (result.viewportPages < 3) {
    complexity = "short";
  } else if (result.viewportPages < 10) {
    complexity = "medium";
  } else {
    complexity = "long";
  }

  return {
    complexity,
    viewportPages: Math.round(result.viewportPages * 10) / 10,
    lazyImageCount: result.lazyImageCount,
    totalImageCount: result.totalImageCount,
  };
}

/**
 * Get recommended delays based on page complexity.
 */
export function getAdaptiveDelays(analysis: PageAnalysis): {
  postLoadDelay: number;
  postPaintDelay: number;
  imageWaitTimeout: number;
  skipPhase2Scroll: boolean;
} {
  switch (analysis.complexity) {
    case "short":
      return {
        postLoadDelay: 300,
        postPaintDelay: 300,
        imageWaitTimeout: analysis.lazyImageCount > 0 ? 5000 : 2000,
        skipPhase2Scroll: true,
      };
    case "medium":
      return {
        postLoadDelay: 500,
        postPaintDelay: 500,
        imageWaitTimeout: 5000,
        skipPhase2Scroll: analysis.lazyImageCount === 0,
      };
    case "long":
    default:
      return {
        postLoadDelay: 1000,
        postPaintDelay: 1000,
        imageWaitTimeout: 10000,
        skipPhase2Scroll: false,
      };
  }
}
