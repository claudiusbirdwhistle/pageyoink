# Competitive Analysis — Screenshot & PDF API Market

Last updated: 2026-03-23

## Competitors Analyzed

### Established Players
1. **ScreenshotAPI.net** — Feature-rich, changed ownership multiple times
2. **ApiFlash.com** — Screenshot-only, strong DX, affordable entry
3. **PDFShift.io** — PDF-focused specialist
4. **URL2PNG** — Oldest player (~2011), very basic
5. **Restpack.io** — Screenshot + PDF, acquired 2021

### Newer Entrants (Added 2026-03)
6. **ScreenshotOne** — 1M+ monthly renders, 1000+ active devs, GPU rendering
7. **Urlbox** — Enterprise-grade, stealth rendering, compliance-focused
8. **SnapRender** — Cheapest at scale, no feature gating
9. **ScrapFly** — Anti-bot specialist, 175+ country proxies
10. **PageBolt** — Video recording, MCP server/AI agent integration
11. **CaptureKit** — AI-powered content extraction + screenshots
12. **GetScreenshot** — Budget option starting at $5/mo
13. **ScreenshotMachine** — Simple/affordable since 2012

---

## Feature Comparison Matrix

✅ = Supported | ❌ = Not supported | 🔶 = Partial

| Feature | PageYoink | ScreenshotAPI | ApiFlash | PDFShift | Urlbox | ScreenshotOne | SnapRender |
|---------|-----------|---------------|----------|----------|--------|---------------|------------|
| **Screenshot (URL→PNG/JPEG)** | ✅ | ✅ | ✅ (+WebP) | ✅ | ✅ | ✅ | ✅ |
| **PDF from URL** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **PDF from HTML** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Batch Processing** | ✅ (dedicated endpoint) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Visual Diff** | ✅ (pixelmatch) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Cookie Banner Removal** | ✅ (4-phase) | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Chat Widget Removal** | ✅ | ✅ | ❌ | ❌ | 🔶 | ❌ | ❌ |
| **Text-Based Banner Detection** | ✅ (unique) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Smart Wait / Readiness** | ✅ (DOM+fonts+images+anim) | 🔶 (networkidle) | 🔶 | ❌ | 🔶 | 🔶 | 🔶 |
| **Lazy-Load Scrolling** | ✅ (max_scroll cap) | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **CSS Injection** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **JS Injection** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Custom Headers** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Custom Cookies** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Proxy Support** | ✅ (BYO) | ✅ (free+BYO) | ✅ (BYO) | ❌ | ✅ | ✅ | ❌ |
| **Geolocation Spoofing** | ✅ | ✅ | ✅ (Enterprise) | ❌ | ✅ | ✅ (18 countries) | ❌ |
| **Ad Blocking** | ✅ (network+stealth) | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Element Capture** | ✅ (CSS selector) | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Click Automation** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Caching with TTL** | ✅ (in-memory) | ✅ (CDN) | ✅ (30d) | ❌ | ✅ | ✅ (Cloudflare 30d) | ✅ |
| **S3 Export** | ✅ (service layer) | ✅ (BYOB) | ✅ | ✅ | ✅ (S3/R2/GCS) | ✅ | ❌ |
| **PDF Headers/Footers** | ✅ (HTML templates) | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **PDF Watermarks** | ✅ (text, configurable) | ❌ | ❌ | ✅ (text+image) | ❌ | ❌ | ❌ |
| **PDF Scale/Zoom** | ✅ (0.1-2.0) | ❌ | ❌ | ✅ | 🔶 | ❌ | ❌ |
| **PDF Max Pages** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **PDF Encryption** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Video Capture** | ❌ | ✅ (MP4/GIF) | ❌ | ❌ | ✅ (preview) | ✅ (scrolling) | ❌ |
| **Anti-Bot Bypass** | ❌ | ❌ | ❌ | ❌ | ✅ (stealth) | ❌ | ❌ |
| **AI Content Extraction** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **WebP Output** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Usage API** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Swagger/OpenAPI** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **SDKs** | Node/Python/Go | Samples only | 6+ langs | 8 lang guides | Node/Ruby | 5+ langs | Node |
| **Webhook Delivery** | ✅ (batch) | ✅ (bulk) | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Custom Fonts** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## Pricing Comparison (Updated 2026-03)

| Tier | PageYoink | ScreenshotAPI | ApiFlash | Urlbox | ScreenshotOne | SnapRender | ScrapFly |
|------|-----------|---------------|----------|--------|---------------|------------|----------|
| **Free** | 100/mo | 100 (trial) | 100/mo | 100/mo | 100/mo | 500/mo | — |
| **~$9-19/mo** | 5,000 ($9) | 1,000 ($9) | 1,000 ($7) | 2,000 ($19) | 1,000 ($17) | N/A | N/A |
| **~$29/mo** | 25,000 ($29) | 10,000 ($29) | N/A | N/A | N/A | 10,000 ($29) | 3,333 ($30) |
| **~$79-99/mo** | 100,000 ($79) | N/A | N/A | 5,000 ($49) | 10,000 ($99) | 50,000 ($79) | N/A |
| **High volume** | N/A | 100K ($175) | 100K ($180) | 25K ($149) | Custom | Custom | Custom |

**Key pricing observations:**
- PageYoink offers **the most requests per dollar** at the $29 and $79 tiers
- SnapRender is the only competitor with comparable volume pricing
- Urlbox and ScreenshotOne are 2-5x more expensive per request
- ScrapFly is expensive but solves anti-bot problems others can't
- PageYoink bundles screenshot + PDF + batch + diff — competitors charge separately

---

## Where PageYoink Wins

### 1. Feature Density per Dollar (Unique)
No competitor bundles screenshot + PDF + visual diff + batch processing + watermarks + headers/footers in a single API at PageYoink's price point. Most require separate subscriptions for PDF features.

### 2. Visual Diff API (Unique)
POST /v1/diff with pixelmatch pixel comparison. No competitor offers this as a built-in API endpoint.

### 3. Text-Based Cookie Detection (Unique)
Phase 2 detection scans fixed/sticky elements for cookie-related text content, catching custom implementations that selector blocklists miss.

### 4. PDF Max Pages (Unique)
Truncate output PDFs to N pages — no competitor offers this.

### 5. Stealth Ad Blocking (Rare)
Post-load visual hiding that's undetectable by anti-adblock scripts. Only PageYoink offers both network blocking AND stealth modes.

### 6. Smart Readiness Detection
DOM stability + fonts + images + animations — more comprehensive than competitors' networkidle + delay approach.

### 7. Dedicated Batch Endpoint with Webhooks
Submit 50 URLs, get webhook notification on completion. Only ScreenshotAPI also offers this.

---

## Where PageYoink Loses

### 1. Video Capture — Not Supported
ScreenshotAPI (MP4/GIF/WebM), PageBolt (MP4 with narration), and ScreenshotOne (scrolling video) offer video capture. This is increasingly requested for documentation and marketing.

**Priority: LOW — niche but differentiating. Complex to implement.**

### 2. Anti-Bot Bypass — Not Supported
ScrapFly specializes in bypassing Cloudflare, DataDome, and PerimeterX. Urlbox has stealth rendering. PageYoink uses standard Puppeteer which gets blocked by sophisticated anti-bot systems.

**Priority: MEDIUM — important for scraping use cases but niche for capture APIs.**

### 3. WebP Output Format — Not Supported
ApiFlash, PDFShift, Urlbox, and ScreenshotOne support WebP. It offers 25-34% smaller files than PNG/JPEG.

**Priority: MEDIUM — easy to add (Puppeteer supports it natively).**

### 4. PDF Encryption — Not Supported
PDFShift offers 40/128-bit PDF encryption. Enterprise customers may need password-protected PDFs.

**Priority: LOW — requires native qpdf or similar binary.**

### 5. CDN-Based Caching — Limited
PageYoink uses in-memory caching (lost on scale-to-zero). Competitors like ScreenshotOne use Cloudflare CDN (30-day persistent cache). Urlbox exports to S3/R2/GCS.

**Priority: MEDIUM — in-memory cache is adequate for now but CDN caching would improve cold-start experience.**

### 6. AI Features — Not Supported
CaptureKit offers AI content extraction. PageBolt has MCP server integration. This is an emerging differentiator.

**Priority: LOW — emerging trend, not yet table stakes.**

---

## Recommended Feature Additions (Ice Box)

Based on this analysis, potential features to consider:

1. **WebP output format** — Easy win, Puppeteer supports it natively
2. **Video capture** — High differentiator but complex implementation
3. **CDN caching** — Cloudflare or similar for persistent cache across scale-to-zero
4. **Anti-bot stealth** — Puppeteer-extra with stealth plugin
5. **AI content extraction** — Emerging trend, unique positioning opportunity
6. **MCP server** — Developer tool integration

---

## Sources

- ScreenshotAPI: screenshotapi.net/documentation
- ApiFlash: apiflash.com/documentation
- PDFShift: pdfshift.io/documentation
- URL2PNG: url2png.com/docs
- Restpack: restpack.io/screenshot/docs
- ScreenshotOne: screenshotone.com/blog/best-screenshot-apis
- Urlbox: urlbox.io/docs
- SnapRender: dev.to comparison article
- ScrapFly: scrapfly.io/blog/posts/what-is-the-best-screenshot-api
- PageBolt: dev.to comparison article
- CaptureKit: dev.to comparison article
- GetScreenshot: getscreenshotapi.com/compare
