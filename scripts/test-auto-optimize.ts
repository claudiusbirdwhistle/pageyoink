#!/usr/bin/env npx tsx
/**
 * Test auto-optimize against diverse sites.
 * Captures each site with and without optimize=true,
 * saves results to samples/auto-optimize/ for human review.
 *
 * Run: npx tsx scripts/test-auto-optimize.ts
 */

import { buildApp } from "../src/app.js";
import { closeBrowser } from "../src/services/browser.js";
import { writeFileSync, mkdirSync } from "fs";

const SITES = [
  { name: "example", url: "https://example.com", type: "simple" },
  { name: "hn", url: "https://news.ycombinator.com", type: "table-heavy" },
  { name: "wikipedia", url: "https://en.wikipedia.org/wiki/Web_scraping", type: "article" },
  { name: "github", url: "https://github.com/anthropics", type: "dashboard" },
];

async function main() {
  const app = await buildApp();
  await app.ready();

  const dir = "samples/auto-optimize";
  mkdirSync(dir, { recursive: true });

  for (const site of SITES) {
    console.log(`\nCapturing ${site.name} (${site.type})...`);

    // Default screenshot
    const defaultResp = await app.inject({
      method: "GET",
      url: `/v1/screenshot?url=${encodeURIComponent(site.url)}&clean=true`,
    });

    if (defaultResp.statusCode === 200) {
      writeFileSync(`${dir}/${site.name}-default.png`, defaultResp.rawPayload);
      console.log(`  Default: ${defaultResp.rawPayload.length} bytes`);
    } else {
      console.log(`  Default failed: ${defaultResp.statusCode}`);
    }

    // Optimized screenshot
    const optResp = await app.inject({
      method: "GET",
      url: `/v1/screenshot?url=${encodeURIComponent(site.url)}&clean=true&optimize=true`,
    });

    if (optResp.statusCode === 200) {
      writeFileSync(`${dir}/${site.name}-optimized.${optResp.headers["content-type"] === "image/jpeg" ? "jpg" : "png"}`, optResp.rawPayload);
      console.log(`  Optimized: ${optResp.rawPayload.length} bytes (${optResp.headers["content-type"]})`);
    } else {
      console.log(`  Optimized failed: ${optResp.statusCode}`);
    }

    // Default PDF
    const defaultPdf = await app.inject({
      method: "GET",
      url: `/v1/pdf?url=${encodeURIComponent(site.url)}&clean=true`,
    });

    if (defaultPdf.statusCode === 200) {
      writeFileSync(`${dir}/${site.name}-default.pdf`, defaultPdf.rawPayload);
      console.log(`  Default PDF: ${defaultPdf.rawPayload.length} bytes`);
    }

    // Optimized PDF
    const optPdf = await app.inject({
      method: "GET",
      url: `/v1/pdf?url=${encodeURIComponent(site.url)}&clean=true&optimize=true`,
    });

    if (optPdf.statusCode === 200) {
      writeFileSync(`${dir}/${site.name}-optimized.pdf`, optPdf.rawPayload);
      console.log(`  Optimized PDF: ${optPdf.rawPayload.length} bytes`);
    }
  }

  await app.close();
  await closeBrowser();
  console.log("\nDone! Review samples in samples/auto-optimize/");
}

main().catch(console.error);
