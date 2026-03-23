# Project Status

## Last Updated
2026-03-22 — Phase F (Competitive Parity) complete. All autonomous work done.

## System State
- Deployed: no
- Health: runs locally, 33 tests pass across 7 test files
- CI: GREEN (verified — tests + build + Docker all passing)
- Paying customers: 0
- Monthly revenue: $0

## What's Built

**All features at competitive parity or better vs ScreenshotAPI, ApiFlash, PDFShift, Restpack.**

### Endpoints (10 + docs)
| Method | Path | Description |
|--------|------|-------------|
| GET | / | Landing page |
| GET | /docs | Swagger UI |
| GET | /internal/health | Health + usage stats |
| GET | /v1/screenshot | URL → PNG/JPEG |
| GET | /v1/pdf | URL → PDF |
| POST | /v1/pdf | HTML/URL → PDF (full options via JSON) |
| GET/POST | /v1/og-image | Templated social images |
| POST | /v1/batch | Async batch (up to 50 URLs) |
| GET | /v1/batch/:jobId | Job status + results |
| GET | /v1/usage | Per-key usage dashboard |

### Screenshot & PDF Parameters
| Param | Description |
|-------|-------------|
| url | Target URL |
| format | png, jpeg (screenshot) / A4, Letter, Legal, A3 (PDF) |
| quality | JPEG quality 1-100 |
| width, height | Viewport dimensions |
| full_page | Capture full scrollable page |
| device_scale_factor | Retina/HiDPI (1x, 2x) |
| clean | Remove cookie banners, popups, chat widgets (4-phase detection) |
| smart_wait | Wait for DOM stability + fonts + images + animations |
| block_ads | Block ads via Ghostery engine (uBlock/EasyList compatible) |
| max_scroll | Cap lazy-load scrolling (viewport heights, default 10) |
| css | Inject custom CSS |
| js | Execute custom JavaScript |
| user_agent | Custom user-agent |
| selector | Capture specific element by CSS selector |
| transparent | Transparent PNG background |
| ttl | Cache duration in seconds (default 24h) |
| fresh | Bypass cache |
| timeout | Navigation timeout in ms |

POST /v1/pdf also supports: headers, cookies (as JSON objects)

### Infrastructure
- Fastify + TypeScript + Puppeteer on Node 22
- API key auth + per-key rate limiting
- SQLite persistent storage (usage + batch jobs)
- Filesystem cache with TTL (X-Cache HIT/MISS header)
- GitHub Actions CI (test + build + Docker)
- Dockerfile with Chromium + data volume
- Node.js SDK (zero deps, full TypeScript types)
- Graceful shutdown, .env.example, deployment guide

### Key Differentiators vs Competitors
- **Bundled API** — screenshot + PDF + OG image in one API (unique)
- **OG image templates** — no competitor offers this
- **4-phase clean mode** — text-content detection catches custom cookie banners (verified on HubSpot)
- **Print-mode PDF fixes** — auto-detects carousels and forces overflow:visible (BBC carousel now renders)
- **Batch endpoint with webhooks** — only ScreenshotAPI also has dedicated batch
- **Usage API** — self-service per-key usage dashboard

## What's Needed From Human
1. Create hosting account (Railway recommended — see docs/DEPLOY.md)
2. Set environment variables: API_KEYS, PORT, RATE_LIMIT_PER_MINUTE, DB_PATH
3. Create RapidAPI account and list the API
4. Create Stripe account for direct sales

## Environment Notes
- nvm required: `export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"`
- Test output: `samples/` (gitignored)
- GitHub: github.com/claudiusbirdwhistle/pageyoink
