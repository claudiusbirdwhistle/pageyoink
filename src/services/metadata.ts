import { Page } from "puppeteer";

export interface PageMetadata {
  title: string;
  description: string | null;
  canonicalUrl: string | null;
  language: string | null;
  favicon: string | null;
  og: {
    title: string | null;
    description: string | null;
    image: string | null;
    type: string | null;
    url: string | null;
    siteName: string | null;
  };
  twitter: {
    card: string | null;
    title: string | null;
    description: string | null;
    image: string | null;
    site: string | null;
  };
  stats: {
    wordCount: number;
    linkCount: number;
    internalLinks: number;
    externalLinks: number;
    imageCount: number;
    scriptCount: number;
    styleSheetCount: number;
  };
  jsonLd: unknown[] | null;
  loadedUrl: string;
}

// Helper to get meta content - defined OUTSIDE page.evaluate to avoid
// tsx __name decorator injection in browser context.
const METADATA_SCRIPT = `(() => {
  function gm(name) {
    var el = document.querySelector('meta[property="' + name + '"]') ||
             document.querySelector('meta[name="' + name + '"]');
    return el ? el.getAttribute('content') : null;
  }
  function gl(rel) {
    var el = document.querySelector('link[rel="' + rel + '"]');
    return el ? el.getAttribute('href') : null;
  }

  var links = Array.from(document.querySelectorAll('a[href]'));
  var currentHost = window.location.hostname;
  var internalLinks = 0;
  var externalLinks = 0;
  for (var i = 0; i < links.length; i++) {
    try {
      var href = links[i].href;
      if (!href || href.indexOf('javascript:') === 0 || href.indexOf('#') === 0) continue;
      var url = new URL(href, window.location.origin);
      if (url.hostname === currentHost) internalLinks++;
      else externalLinks++;
    } catch(e) {}
  }

  var bodyText = document.body ? document.body.innerText : '';
  var wordCount = bodyText.trim().split(/\\s+/).filter(function(w) { return w.length > 0; }).length;

  var jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  var jsonLd = [];
  jsonLdScripts.forEach(function(script) {
    try { jsonLd.push(JSON.parse(script.textContent || '')); } catch(e) {}
  });

  var favicon = gl('icon') || gl('shortcut icon') || gl('apple-touch-icon') || '/favicon.ico';

  return {
    title: document.title || '',
    description: gm('description'),
    canonicalUrl: gl('canonical'),
    language: document.documentElement.lang || null,
    favicon: favicon ? new URL(favicon, window.location.origin).href : null,
    og: {
      title: gm('og:title'),
      description: gm('og:description'),
      image: gm('og:image'),
      type: gm('og:type'),
      url: gm('og:url'),
      siteName: gm('og:site_name')
    },
    twitter: {
      card: gm('twitter:card'),
      title: gm('twitter:title'),
      description: gm('twitter:description'),
      image: gm('twitter:image'),
      site: gm('twitter:site')
    },
    stats: {
      wordCount: wordCount,
      linkCount: internalLinks + externalLinks,
      internalLinks: internalLinks,
      externalLinks: externalLinks,
      imageCount: document.querySelectorAll('img').length,
      scriptCount: document.querySelectorAll('script').length,
      styleSheetCount: document.querySelectorAll("link[rel='stylesheet']").length
    },
    jsonLd: jsonLd.length > 0 ? jsonLd : null,
    loadedUrl: window.location.href
  };
})()`;

/**
 * Extract comprehensive metadata from a loaded Puppeteer page.
 * Uses a string-based evaluate to avoid tsx __name decorator issues.
 */
export async function extractMetadata(page: Page): Promise<PageMetadata> {
  return page.evaluate(METADATA_SCRIPT) as Promise<PageMetadata>;
}
