# PageYoink

**Yoink pages into screenshots and PDFs.** Fast, intelligent capture API.

PageYoink is a screenshot and PDF API that goes beyond basic capture services. It automatically removes cookie banners, fundraising popups, and chat widgets, waits for JavaScript-heavy pages to finish rendering, blocks ads (with a stealth mode that bypasses anti-adblock detection), and compares pages visually — all through a simple REST API.

## Quick Start

```bash
# Take a clean screenshot (no cookie banners, no ads)
curl "https://api.pageyoink.dev/v1/screenshot?url=https://example.com&clean=true&block_ads=stealth" \
  -H "x-api-key: YOUR_KEY" -o screenshot.png

# Generate a PDF
curl "https://api.pageyoink.dev/v1/pdf?url=https://example.com&block_ads=true" \
  -H "x-api-key: YOUR_KEY" -o document.pdf

# Compare two pages visually
curl -X POST "https://api.pageyoink.dev/v1/diff" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url1":"https://example.com","url2":"https://example.org","format":"image"}' \
  -o diff.png
```

## SDKs

### Node.js
```javascript
import PageYoink from 'pageyoink';

const client = new PageYoink({ apiKey: 'YOUR_KEY' });
const png = await client.screenshot({ url: 'https://example.com', clean: true });
```

### Python
```python
from pageyoink import PageYoink

client = PageYoink(api_key="YOUR_KEY")
png = client.screenshot("https://example.com", clean=True)
```

### Go
```go
client := pageyoink.New("YOUR_KEY")
png, err := client.Screenshot(pageyoink.ScreenshotOptions{
    URL:   "https://example.com",
    Clean: true,
})
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/screenshot` | URL to PNG/JPEG with full capture options |
| GET | `/v1/pdf` | URL to PDF |
| POST | `/v1/pdf` | HTML/URL to PDF with headers, footers, watermarks |
| POST | `/v1/batch` | Async batch processing (up to 50 URLs) |
| GET | `/v1/batch/:jobId` | Check batch job status and retrieve results |
| POST | `/v1/diff` | Visual diff between two URLs |
| GET | `/v1/usage` | Per-key usage dashboard with daily breakdown |
| GET | `/docs` | Interactive Swagger UI documentation |
| GET | `/internal/health` | Health check with usage stats |

## Screenshot & PDF Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | Target URL (required) |
| `format` | string | `png`, `jpeg` (screenshot) / `A4`, `Letter`, `Legal`, `A3` (PDF) |
| `quality` | number | JPEG quality 1-100 |
| `width`, `height` | number | Viewport dimensions (default 1280x720) |
| `viewports` | number | Number of viewport heights to capture (e.g., `viewports=3` = 3x the height). Alternative to specifying exact pixel height. |
| `full_page` | boolean | Capture entire scrollable page |
| `device_scale_factor` | number | Retina/HiDPI rendering (1x, 2x) |
| `clean` | boolean | Auto-remove cookie banners, fundraising popups, chat widgets |
| `smart_wait` | boolean | Wait for DOM stability + fonts + images + animations |
| `block_ads` | string | `"true"` = network-level blocking (fast, detectable). `"stealth"` = post-load visual hiding (slower, undetectable by anti-adblock scripts). |
| `max_scroll` | number | Cap lazy-load scrolling (viewport heights, default 10) |
| `css` | string | Inject custom CSS before capture |
| `js` | string | Execute custom JavaScript before capture |
| `user_agent` | string | Custom user-agent string |
| `selector` | string | Capture specific element by CSS selector |
| `transparent` | boolean | Transparent PNG background (PNG only) |
| `click` | string | CSS selector to click before capture |
| `click_count` | number | Number of times to click (max 10) |
| `ttl` | number | Cache duration in seconds (default 86400) |
| `fresh` | boolean | Bypass cache, force new capture |
| `timeout` | number | Navigation timeout in ms (default 30000) |

### PDF-Only Parameters (POST body)

| Parameter | Type | Description |
|-----------|------|-------------|
| `html` | string | Raw HTML to convert (instead of URL) |
| `headers` | object | Custom HTTP headers |
| `cookies` | array | Pre-set cookies (`[{name, value, domain}]`) |
| `proxy` | string | Route through a proxy server |
| `headerTemplate` | string | Custom PDF header (HTML, supports `pageNumber`, `totalPages`) |
| `footerTemplate` | string | Custom PDF footer |
| `pageRanges` | string | Select pages (e.g., `"1-3"`, `"1,3,5"`) |
| `watermark` | object | Text watermark (`{text, fontSize, color, opacity, rotation, position}`) |
| `geolocation` | object | Spoof browser location (`{latitude, longitude, accuracy}`) |
| `timezone` | string | IANA timezone (e.g., `"Europe/Paris"`) |

## Ad Blocking Modes

PageYoink offers two ad blocking strategies:

### `block_ads=true` — Network-Level Blocking
Uses the Ghostery engine (uBlock Origin / EasyList compatible) to block ad requests at the network level. Fast and thorough, but detectable by anti-adblock scripts on sites like The Guardian, Forbes, and Wired — which may show login walls or degraded content.

### `block_ads=stealth` — Stealth Mode
Lets ALL network requests through so anti-adblock detection scripts see ads loaded normally. After the page is fully loaded and detection scripts have run, ad elements are moved offscreen (not hidden — preserving dimensions to fool visibility checks). Three-phase detection:

1. **Selector-based** — 40+ selectors for Google AdSense, GPT, Taboola, Outbrain, Amazon, Media.net, and generic ad patterns
2. **Iframe-src-based** — Detects iframes from 15+ known ad network domains
3. **Heuristic size-based** — Catches iframes matching 14 standard IAB ad unit dimensions (728x90, 300x250, etc.)

Use `stealth` when a site blocks you with `true`. Use `true` when speed matters and the site doesn't have anti-adblock.

## Clean Mode

The `clean=true` parameter removes unwanted overlays using 4-phase detection:

1. **Selector blocklist** — 70+ selectors for cookie consent platforms (OneTrust, Cookiebot, TrustArc, Quantcast, HubSpot), chat widgets (Intercom, Drift, Zendesk, Crisp, Tawk, Tidio), fundraising banners (Wikipedia, Guardian), and paywall prompts
2. **Text-content scanning** — Finds fixed/sticky elements containing cookie consent or donation language, catching custom implementations no blocklist covers
3. **Z-index overlay detection** — Removes high-z-index overlays covering the viewport
4. **Backdrop removal** — Strips semi-transparent full-screen backdrop divs

## What Sets PageYoink Apart

### Competitive Feature Comparison

| Feature | PageYoink | ScreenshotAPI | ApiFlash | PDFShift | URL2PNG | Restpack |
|---------|:---------:|:-------------:|:--------:|:--------:|:-------:|:--------:|
| Screenshot API | Yes | Yes | Yes | Yes | Yes | Yes |
| PDF from URL | Yes | Yes | No | Yes | No | Yes |
| PDF from HTML | Yes | Yes | No | Yes | No | Yes |
| Visual Diff API | **Yes** | No | No | No | No | No |
| Cookie Banner Removal | Yes | Yes | Yes | No | No | Yes |
| Fundraising Popup Removal | **Yes** | No | No | No | No | No |
| Text-Based Overlay Detection | **Yes** | No | No | No | No | No |
| Chat Widget Removal | Yes | Yes | No | No | No | No |
| Smart Readiness Detection | **Advanced** | Basic | Basic | No | Minimal | Basic |
| Ad Blocking (Network) | Yes | Yes | Yes | No | No | Yes |
| Ad Blocking (Stealth) | **Yes** | No | No | No | No | No |
| Lazy-Load Scrolling | Yes | Yes | Yes | No | No | No |
| CSS/JS Injection | Yes | Yes | Yes | Yes | CSS only | Yes |
| Custom Headers/Cookies | Yes | Yes | Yes | Yes | No | No |
| Element Capture | Yes | Yes | Yes | No | No | Yes |
| Click Automation | Yes | Yes | No | No | No | No |
| Proxy Support | Yes | Yes | Yes | No | No | No |
| Geolocation Spoofing | Yes | Yes | Enterprise | No | No | No |
| PDF Headers/Footers | Yes | No | No | Yes | No | Yes |
| PDF Watermarks | Yes | No | No | Yes | No | No |
| PDF Page Ranges | Yes | No | No | Yes | No | Yes |
| S3 Export | Yes | Yes | Yes | Yes | No | No |
| Batch Processing | Yes | Yes | No | No | No | No |
| Webhook Delivery | Yes | Yes | No | Yes | No | No |
| Response Caching | Yes | Yes | Yes | No | Yes | Yes |
| Usage API | Yes | No | Yes | Yes | No | Yes |
| Swagger/OpenAPI Docs | Yes | No | No | Yes | No | No |
| Viewport Count Param | **Yes** | No | No | No | No | No |
| Custom Font Loading | **Yes** | No | No | No | No | No |
| Print-Mode PDF Fixes | **Yes** | No | No | No | No | No |
| SDKs | Node, Python, Go | Samples only | 5+ langs | Guides | Community | Node, PHP, Go |
| Bundled Screenshot + PDF | **Yes** | Separate | Screenshot only | PDF only | Screenshot only | Separate |

**Bold** = unique to PageYoink or significantly better than competitors.

### Key Differentiators

- **Stealth Ad Blocking** — The only screenshot API with an undetectable ad blocking mode. Bypasses anti-adblock walls on The Guardian, Forbes, and similar sites.

- **4-Phase Clean Mode** — Goes beyond selector blocklists. Scans page content for cookie and fundraising text in fixed elements, catches custom implementations that competitors miss. Verified against HubSpot, BBC, Intercom, Wikipedia.

- **Smart Readiness** — Doesn't just wait for network idle. Checks DOM stability (no mutations for 500ms), fonts loaded, images decoded, and animations settled.

- **Visual Diff** — Compare two URLs pixel-by-pixel. No competitor offers this as a built-in feature.

- **Print-Mode PDF Fixes** — Auto-detects horizontal carousels and forces them to wrap for Chrome's PDF renderer. Fixes a common Chromium limitation that affects all competitors.

## Pricing

| Plan | Price | Requests/month |
|------|-------|---------------|
| Free | $0 | 100 |
| Starter | $9/mo | 5,000 |
| Pro | $29/mo | 25,000 |
| Business | $79/mo | 100,000 |

All plans include all endpoints, all features. Cached responses don't count against quota.

## Self-Hosting

PageYoink ships as a Docker container with Chromium pre-installed.

```bash
# Clone and run locally
git clone https://github.com/claudiusbirdwhistle/pageyoink.git
cd pageyoink
npm install
npm run dev

# Or via Docker
docker build -t pageyoink .
docker run -p 3000:3000 -e API_KEYS=your-key pageyoink
```

See [docs/DEPLOY.md](docs/DEPLOY.md) for deployment guides (Railway, Render, Fly.io).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `API_KEYS` | (none) | Comma-separated valid API keys. Empty = auth disabled. |
| `RATE_LIMIT_PER_MINUTE` | `60` | Max requests per API key per minute |
| `DB_PATH` | `./data/pageyoink.db` | SQLite database path |
| `CACHE_DIR` | `./data/cache` | Response cache directory |

## Architecture

- **Runtime:** Node.js 22 + TypeScript + Fastify
- **Rendering:** Puppeteer with system Chromium
- **Storage:** SQLite (usage tracking + batch jobs) + filesystem cache
- **Ad Blocking:** Ghostery engine (network) + stealth mode (visual hiding)
- **CI:** GitHub Actions (test + build + Docker)

## License

MIT
