import { Page } from "puppeteer";

export type PageComplexity = "short" | "medium" | "long";

export interface PageAnalysis {
  complexity: PageComplexity;
  viewportPages: number;
  lazyImageCount: number;
  totalImageCount: number;
  contentWidth: number;
  wideTableCount: number;
  isArticle: boolean;
  imageToTextRatio: number;
  lang: string | null;
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

    // Content width detection
    var mainContent = document.querySelector("main, article, [role='main'], .content, #content");
    var contentWidth = 0;
    if (mainContent) {
      contentWidth = mainContent.scrollWidth;
    } else {
      contentWidth = document.body.scrollWidth;
    }

    // Wide table detection
    var allTables = document.querySelectorAll("table");
    var wideTableCount = 0;
    for (var t = 0; t < allTables.length; t++) {
      if (allTables[t].scrollWidth > 800) wideTableCount++;
    }

    // Article detection (heuristic: has article tag, or long text content with headings)
    var hasArticleTag = !!document.querySelector("article");
    var headingCount = document.querySelectorAll("h1, h2, h3").length;
    var textLength = (document.body.innerText || "").length;
    var isArticle = hasArticleTag || (headingCount >= 2 && textLength > 2000);

    // Image to text ratio
    var imageArea = 0;
    for (var j = 0; j < images.length; j++) {
      var rect = images[j].getBoundingClientRect();
      imageArea += rect.width * rect.height;
    }
    var pageArea = scrollHeight * (window.innerWidth || 1280);
    var imageToTextRatio = pageArea > 0 ? imageArea / pageArea : 0;

    var lang = document.documentElement.lang || null;

    return {
      viewportPages: viewportPages,
      totalImageCount: totalImageCount,
      lazyImageCount: lazyImageCount,
      contentWidth: contentWidth,
      wideTableCount: wideTableCount,
      isArticle: isArticle,
      imageToTextRatio: imageToTextRatio,
      lang: lang
    };
  })()`) as {
    viewportPages: number; totalImageCount: number; lazyImageCount: number;
    contentWidth: number; wideTableCount: number; isArticle: boolean;
    imageToTextRatio: number; lang: string | null;
  };

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
    contentWidth: result.contentWidth,
    wideTableCount: result.wideTableCount,
    isArticle: result.isArticle,
    imageToTextRatio: Math.round(result.imageToTextRatio * 100) / 100,
    lang: result.lang,
  };
}

export interface OptimizedParams {
  // PDF params
  pdfLandscape: boolean;
  pdfFormat: "A4" | "Letter";
  pdfScale: number;
  pdfMargin: string;
  // Screenshot params
  screenshotFormat: "png" | "jpeg" | "webp";
  screenshotWidth: number;
  screenshotDeviceScaleFactor: number;
}

/**
 * Generate optimized capture parameters based on page analysis.
 * Explicit user params always override these recommendations.
 */
export function getOptimizedParams(analysis: PageAnalysis): OptimizedParams {
  // PDF orientation: landscape for wide tables/dashboards
  const pdfLandscape = analysis.wideTableCount >= 2 ||
    (analysis.contentWidth > 1100 && !analysis.isArticle);

  // PDF page size: locale-based
  const lang = (analysis.lang || "").toLowerCase();
  const isUSLocale = lang.startsWith("en-us") || lang === "en" || lang === "";
  const pdfFormat = isUSLocale ? "Letter" : "A4";

  // PDF scale: shrink to fit if content overflows
  let pdfScale = 1.0;
  if (analysis.contentWidth > 900) {
    pdfScale = Math.max(0.6, 900 / analysis.contentWidth);
  }

  // PDF margins: narrower for dense content, wider for articles
  const pdfMargin = analysis.isArticle ? "0.75in" : "0.4in";

  // Screenshot format: JPEG for photo-heavy, PNG for text/UI
  const screenshotFormat: "png" | "jpeg" | "webp" =
    analysis.imageToTextRatio > 0.3 ? "jpeg" : "png";

  // Screenshot width: match content container width, min 1280
  const screenshotWidth = Math.max(1280, Math.min(analysis.contentWidth + 40, 1920));

  // Device scale factor: 2x for text-heavy (sharp text), 1x for photo-heavy (smaller files)
  const screenshotDeviceScaleFactor = analysis.imageToTextRatio > 0.4 ? 1 : 2;

  return {
    pdfLandscape,
    pdfFormat,
    pdfScale: Math.round(pdfScale * 100) / 100,
    pdfMargin,
    screenshotFormat,
    screenshotWidth,
    screenshotDeviceScaleFactor,
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
