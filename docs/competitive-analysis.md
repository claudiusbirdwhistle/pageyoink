# Competitive Analysis — Screenshot & PDF API Market

Last updated: 2026-03-22

## Competitors Analyzed

1. **ScreenshotAPI.net** — Most feature-rich competitor
2. **ApiFlash.com** — Screenshot-only, strong DX
3. **PDFShift.io** — PDF-focused specialist
4. **URL2PNG** — Oldest player (~2011), very basic
5. **Restpack.io** — Screenshot + PDF, acquired 2021

---

## Feature Comparison Matrix

| Feature | PageYoink | ScreenshotAPI | ApiFlash | PDFShift | URL2PNG | Restpack |
|---------|-----------|---------------|----------|----------|---------|----------|
| **Screenshot (URL→PNG/JPEG)** | Yes | Yes | Yes (+ WebP) | Yes (PNG/JPEG/WebP) | PNG only | Yes (PNG/JPG) |
| **PDF from URL** | Yes | Yes (via file_type) | No | Yes | No | Yes |
| **PDF from HTML** | Yes | Yes (custom_html) | No | Yes | No | Yes |
| **OG Image Generation** | Yes (templated) | No | No | No | No | No |
| **Batch Processing** | Yes (dedicated endpoint) | Yes (JSON + CSV) | No (concurrent only) | No (concurrent only) | No | No (worker concurrency) |
| **Cookie Banner Removal** | Yes (4-phase detection) | Yes (no_cookie_banners) | Yes (no_cookie_banners) | No (manual CSS/JS) | No | Yes (block_cookie_warnings) |
| **Chat Widget Removal** | Yes (built-in) | Yes (block_chat_widgets) | No | No | No | No |
| **Text-Based Banner Detection** | Yes (scans fixed elements for cookie text) | No | No | No | No | No |
| **Smart Wait / Readiness** | Yes (DOM stability + fonts + images + animations) | networkidle + CSS selector + delay | networkidle + CSS selector + delay | No | "Say Cheese" (requires page modification) | networkidle + CSS selector + delay |
| **Lazy-Load Scrolling** | Yes (with max_scroll cap) | Yes (lazy_load param) | Yes (scroll_page param) | No | No | No |
| **Full Page Capture** | Yes | Yes | Yes | N/A (PDF is always full) | Yes | Yes |
| **Viewport Config** | Yes | Yes (up to 7680x4320) | Yes | N/A | Yes | Yes (320-2000) |
| **Retina/HiDPI** | Yes (deviceScaleFactor) | Yes (up to 5K) | Yes (2x) | Yes (zoom param) | No | Yes (2x) |
| **CSS Injection** | No | Yes | Yes | Yes | Yes (URL only) | Yes |
| **JS Injection** | No | Yes | Yes | Yes | No | Yes |
| **Custom Headers** | No | Yes | Yes | Yes | No | Yes |
| **Custom Cookies** | No | Yes (+ cookie templates) | Yes | Yes | No | No |
| **Proxy Support** | No | Yes (free + BYO) | Yes (BYO) | No | No | No |
| **Geolocation Spoofing** | No | Yes | Yes (Enterprise) | No | No | No |
| **Ad Blocking** | No | Yes | Yes | No | No | Yes |
| **Element Capture** | No | Yes (CSS selector) | Yes (CSS selector) | No | No | Yes (CSS selector) |
| **Click Automation** | No | Yes (selector_to_click) | No | No | No | No |
| **S3 Export** | No | Yes (BYOB) | Yes | Yes | No | No |
| **PDF Encryption** | No | No | No | Yes (40/128-bit) | No | Yes (40/128-bit) |
| **PDF Headers/Footers** | No | No | No | Yes (HTML templates) | No | Yes (with placeholders) |
| **PDF Watermarks** | No | No | No | Yes (text + image) | No | No |
| **Video Capture** | No | Yes (MP4/GIF/WebM) | No | No | No | No |
| **HTML/Text Extraction** | No | Yes | Yes | No | No | No |
| **Usage Dashboard (API)** | Yes (/v1/usage) | No (dashboard only) | Yes (quota endpoint) | Yes (credits/usage) | No | Yes (usage endpoint) |
| **Swagger/OpenAPI Docs** | Yes (/docs) | No | No | Yes (openapi.json) | No | No |
| **SDK** | Node.js | Code samples only | Node, Python, PHP, Ruby + more | Integration guides (8 langs) | Community only | Node, PHP, Go |
| **Webhook Delivery** | Yes (batch) | Yes (bulk) | No | Yes (async) | No | No |
| **Caching** | No | Yes (configurable TTL) | Yes (24h default, up to 30d) | No | Yes (30d default) | Yes (configurable) |
| **Persistent Storage** | SQLite (usage + jobs) | Cloud | AWS Lambda (ephemeral) | Not stored by default | Fastly CDN | Optional CDN |

---

## Pricing Comparison

| Tier | PageYoink | ScreenshotAPI | ApiFlash | PDFShift | URL2PNG | Restpack |
|------|-----------|---------------|----------|----------|---------|----------|
| **Free** | 100 req/mo | 100 (7-day trial) | 100/mo | 50/mo | None | 7-day trial |
| **~$9/mo** | 5,000 req | 1,000 ($9) | 1,000 ($7) | ~500 ($9 est) | N/A | 1,000 ($9.95) |
| **~$29/mo** | 25,000 req | 10,000 ($29) | N/A | ~2,500 ($24) | 5,000 ($29) | N/A |
| **~$79/mo** | 100,000 req | N/A | N/A | N/A | N/A | N/A |
| **~$100+/mo** | N/A | 100,000 ($175) | 10,000 ($35) / 100K ($180) | Custom slider | 20,000 ($99) | 10,000 ($39.95) / 40K ($99.95) |

**Key pricing observations:**
- PageYoink is **competitively priced** at lower tiers and offers more requests per dollar than most competitors
- ApiFlash and ScreenshotAPI offer the most generous quotas at higher tiers
- Restpack charges **separately** for Screenshot and PDF APIs — PageYoink bundles both
- URL2PNG has no free tier and is the most expensive per-request
- PDFShift uses a credit system (1 credit = 1 conversion up to 5MB)

---

## Where PageYoink Wins

### 1. Bundled API (Unique)
No competitor offers screenshot + PDF + OG image generation in a single API with unified pricing. ScreenshotAPI and Restpack offer screenshot + PDF but as separate products. ApiFlash and URL2PNG are screenshot-only. PDFShift is PDF-only. PageYoink is the only one-API-one-bill solution.

### 2. OG Image Templates (Unique)
No competitor offers templated social image generation. This is a feature category that currently requires a separate service (like Bannerbear at $630K ARR).

### 3. Text-Based Cookie Detection (Unique)
All competitors that offer cookie banner removal use selector-based blocklists only. PageYoink's Phase 2 detection scans fixed/sticky elements for cookie-related text content (e.g., "cookie" + "accept"/"decline"), catching custom implementations that no blocklist would match (verified: works on HubSpot where selector-only approaches fail).

### 4. Dedicated Batch Endpoint
Only ScreenshotAPI also offers a batch endpoint. ApiFlash, PDFShift, Restpack, and URL2PNG all require client-side concurrent requests for batch processing. PageYoink's batch endpoint with job tracking and webhook delivery is simpler to use.

### 5. Self-Service Usage API
GET /v1/usage provides per-key, per-endpoint, daily usage breakdowns. Most competitors only show usage in a web dashboard, not via API.

### 6. Smart Readiness Detection
PageYoink checks DOM stability + fonts loaded + images decoded + animations settled. Competitors rely on networkidle + optional CSS selector + fixed delay. PageYoink's approach is more comprehensive for JS-heavy sites.

---

## Where PageYoink Loses

### 1. CSS/JS Injection — Not Supported
ScreenshotAPI, ApiFlash, PDFShift, and Restpack all allow injecting custom CSS and JavaScript before capture. This is a **significant gap** — developers use this to:
- Hide specific elements
- Click "Accept" on custom popups
- Wait for specific JS conditions
- Style pages for capture

**Priority: HIGH — should be added before launch.**

### 2. Element Capture — Not Supported
ScreenshotAPI, ApiFlash, and Restpack allow capturing a specific DOM element by CSS selector. Useful for capturing just a chart, a form, or a specific component.

**Priority: MEDIUM — nice to have, not blocking.**

### 3. Custom Headers/Cookies/User-Agent — Not Supported
All major competitors support custom HTTP headers, cookies, and user-agent strings. Essential for:
- Capturing authenticated pages
- Bypassing paywalls with session cookies
- Testing responsive design with mobile user-agents

**Priority: HIGH — should be added before launch.**

### 4. Proxy Support — Not Supported
ScreenshotAPI (free + BYO) and ApiFlash (BYO) offer proxy routing. Useful for bypassing geo-restrictions and bot detection.

**Priority: LOW — can be added later.**

### 5. Caching — Not Supported
ApiFlash, ScreenshotAPI, URL2PNG, and Restpack all cache screenshots. Cached results don't count against quota. This saves customers money on repeated captures.

**Priority: MEDIUM — reduces costs for customers with repeated URLs.**

### 6. PDF Features — Limited
PDFShift and Restpack offer PDF encryption, watermarks, headers/footers, and page range selection. PageYoink's PDF output is basic — format, margins, landscape only.

**Priority: MEDIUM — important for enterprise customers.**

### 7. Video Capture — Not Supported
ScreenshotAPI uniquely offers MP4/GIF/WebM scrolling video capture. This is a niche but differentiating feature.

**Priority: LOW — niche use case.**

---

## Pre-Launch Priority List

Based on this analysis, these features should be added before public launch to reach competitive parity on essentials:

1. **CSS/JS injection** — all serious competitors have this
2. **Custom headers, cookies, user-agent** — required for authenticated captures
3. **Element capture by CSS selector** — ScreenshotAPI, ApiFlash, Restpack have it
4. **Caching with configurable TTL** — saves customers money, reduces server load

These can be deferred post-launch:
- Proxy support
- PDF encryption/watermarks/headers/footers
- S3 export
- Geolocation spoofing
- Video capture
- Ad blocking (separate from cookie/popup removal)

---

## Sources

- ScreenshotAPI: screenshotapi.net/documentation
- ApiFlash: apiflash.com/documentation
- PDFShift: pdfshift.io/documentation
- URL2PNG: url2png.com/docs
- Restpack: restpack.io/screenshot/docs, restpack.io/html2pdf/docs
