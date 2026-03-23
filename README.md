# PageYoink

**Yoink pages into screenshots, PDFs, and OG images.** One API, three outputs, zero hassle.

PageYoink is a fast, intelligent capture API that goes beyond basic screenshot services. It automatically removes cookie banners and chat widgets, waits for JavaScript-heavy pages to finish rendering, blocks ads, and generates social sharing images from templates — all through a simple REST API.

## Quick Start

```bash
# Take a screenshot
curl "https://api.pageyoink.dev/v1/screenshot?url=https://example.com&clean=true" \
  -H "x-api-key: YOUR_KEY" -o screenshot.png

# Generate a PDF
curl "https://api.pageyoink.dev/v1/pdf?url=https://example.com&block_ads=true" \
  -H "x-api-key: YOUR_KEY" -o document.pdf

# Create an OG image
curl -X POST "https://api.pageyoink.dev/v1/og-image" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Blog Post","theme":"gradient","template":"bold"}' \
  -o og.png
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
| GET/POST | `/v1/og-image` | Generate social sharing images from templates |
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
| `full_page` | boolean | Capture entire scrollable page |
| `device_scale_factor` | number | Retina/HiDPI rendering (1x, 2x) |
| `clean` | boolean | Auto-remove cookie banners, popups, chat widgets |
| `smart_wait` | boolean | Wait for DOM stability + fonts + images + animations |
| `block_ads` | boolean | Block ads via Ghostery engine (uBlock/EasyList compatible) |
| `max_scroll` | number | Cap lazy-load scrolling (viewport heights, default 10) |
| `css` | string | Inject custom CSS before capture |
| `js` | string | Execute custom JavaScript before capture |
| `user_agent` | string | Custom user-agent string |
| `selector` | string | Capture specific element by CSS selector |
| `transparent` | boolean | Transparent PNG background |
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

## OG Image Templates

Generate social sharing images (1200x630) with four built-in templates:

| Template | Style |
|----------|-------|
| `default` | Gradient background with accent bar |
| `split` | Bold brand-color left panel + dark content right |
| `minimal` | Clean white centered layout |
| `bold` | Dark background with decorative color circles |

All templates support customizable `title`, `subtitle`, `author`, `domain`, `theme` (light/dark/gradient), `brandColor`, and `fontSize`.

## What Sets PageYoink Apart

### Competitive Feature Comparison

| Feature | PageYoink | ScreenshotAPI | ApiFlash | PDFShift | URL2PNG | Restpack |
|---------|:---------:|:-------------:|:--------:|:--------:|:-------:|:--------:|
| Screenshot API | Yes | Yes | Yes | Yes | Yes | Yes |
| PDF from URL | Yes | Yes | No | Yes | No | Yes |
| PDF from HTML | Yes | Yes | No | Yes | No | Yes |
| OG Image Templates | **Yes** | No | No | No | No | No |
| Visual Diff API | **Yes** | No | No | No | No | No |
| Cookie Banner Removal | Yes | Yes | Yes | No | No | Yes |
| Text-Based Cookie Detection | **Yes** | No | No | No | No | No |
| Chat Widget Removal | Yes | Yes | No | No | No | No |
| Smart Readiness Detection | **Advanced** | Basic | Basic | No | Minimal | Basic |
| Ad Blocking | Yes | Yes | Yes | No | No | Yes |
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
| Custom Font Loading | **Yes** | No | No | No | No | No |
| Print-Mode PDF Fixes | **Yes** | No | No | No | No | No |
| SDKs | Node, Python, Go | Samples only | 5+ langs | Guides | Community | Node, PHP, Go |
| Bundled Pricing | **Yes** | Separate | Screenshot only | PDF only | Screenshot only | Separate |

**Bold** = unique to PageYoink or significantly better than competitors.

### Key Differentiators

- **One API, Three Outputs** — Screenshot + PDF + OG image under a single API key and bill. Every competitor charges separately or only offers one output type.

- **4-Phase Clean Mode** — Goes beyond selector blocklists. Scans page content for cookie-related text in fixed elements, catches custom cookie implementations that competitors miss. Verified against HubSpot, BBC, Intercom.

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
- **Ad Blocking:** Ghostery/uBlock Origin-compatible engine
- **CI:** GitHub Actions (test + build + Docker)

## License

MIT
