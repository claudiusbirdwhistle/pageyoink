# Project Status

## Last Updated
2026-03-23

## System State
- **Deployed:** Yes — Google Cloud Run (us-east1)
- **URL:** https://pageyoink-1085551159615.us-east1.run.app
- **CI:** Cloud Build auto-deploy on push to main (trigger may need setup — check console)
- **Health:** Running, 28 tests passing
- **Paying customers:** 0
- **Monthly revenue:** $0

## Infrastructure
- **Hosting:** Google Cloud Run (2 vCPU, 2GB RAM, 0-5 instances, scale to zero)
- **Database:** Google Firestore (us-east1, free tier)
- **Cache:** In-memory (lost on scale-to-zero, optimization only)
- **GCP Project:** pageyoink-api (claudius.birdwhistle@gmail.com)
- **GitHub:** claudiusbirdwhistle/pageyoink
- **CI/CD:** cloudbuild.yaml — Docker build + deploy on git push

## What's Built

### Endpoints (11 + docs)
- GET / — Landing page with interactive trial demo
- GET /docs — Swagger UI with full parameter descriptions
- GET /internal/health — Health check + usage stats
- GET /v1/screenshot — URL to PNG/JPEG
- GET /v1/pdf — URL to PDF
- POST /v1/pdf — HTML/URL to PDF (full options: headers, footers, watermark, proxy)
- POST /v1/batch — Async batch processing (up to 50 URLs)
- GET /v1/batch/:jobId — Batch job status + results
- POST /v1/diff — Visual diff between two URLs (pixelmatch)
- GET /v1/usage — Per-key usage dashboard
- GET /trial/screenshot — Free trial (5/day per IP, no API key)
- GET /trial/pdf — Free trial PDF

### Screenshot Parameters
url, format, quality, width, height, viewports, full_page, device_scale_factor,
clean, smart_wait, block_ads (true/stealth), max_scroll, css, js, user_agent,
selector, transparent, click, click_count, fonts, ttl, fresh, timeout,
proxy, geolocation, timezone

### PDF Parameters (POST body)
All screenshot params plus: html, headers, cookies, headerTemplate, footerTemplate,
displayHeaderFooter, pageRanges, watermark, landscape, margin, printBackground

### Key Features
- **4-phase clean mode** — selector blocklist + text-content scanning + z-index overlay + backdrop removal. Handles cookie banners, fundraising popups (Wikipedia, Guardian), chat widgets (Intercom, HubSpot, Drift, Zendesk, etc.)
- **Stealth ad blocking** — post-load visual hiding, undetectable by anti-adblock scripts (3-phase: selector, iframe domain, IAB size heuristic)
- **Network ad blocking** — Ghostery engine (uBlock/EasyList compatible)
- **Smart wait** — network request tracking + DOM mutation tracking + fonts + images + animations, two-phase stability (resets on new activity)
- **Lazy-load scrolling** — max_scroll cap prevents infinite scroll, event-based image wait
- **Auto retry** — transient Chrome crashes retried automatically
- **Print-mode PDF fixes** — carousel overflow detection
- **Response caching** — in-memory with TTL, X-Cache HIT/MISS header
- **URL auto-normalization** — bare domains (bbc.com) auto-prepend https://

### SDKs
- Node.js (sdk/) — full TypeScript types
- Python (sdk-python/) — httpx client
- Go (sdk-go/) — zero dependencies

### Performance
- Default: `load` event + 1s render delay (~2-3s per capture)
- Previous: `networkidle2` (~8-15s per capture)
- smart_wait available for JS-heavy sites needing full readiness detection

## What's NOT Done Yet

### Next Priority: API Enhancements + SDK Updates
See `docs/tasks.md` — remaining tasks include:
- Add zoom (scale) and max_pages parameters to PDF API
- Update SDKs to reflect current API surface
- Research competitive landscape and pricing
- Add zoom and max_pages to API

### Blocked on Human
- [ ] Set API_KEYS environment variable in Cloud Run (currently auth disabled)
- [ ] Create RapidAPI listing
- [ ] Set up Stripe for direct sales
- [ ] Register pageyoink.dev domain (optional)
- [ ] Set up Cloud Build trigger (GitHub connection made, trigger may need creation in console)

### Remaining Icebox
- PDF encryption (needs native qpdf)
- Video capture (complex)
- Geo-distributed rendering (needs infrastructure)

## Known Issues
- Cloud Run cold start: 5-10 seconds on first request after scale-to-zero
- BBC "Weekend Reads" carousel: images don't render in PDF (Chromium print limitation, partially mitigated by print-fix.ts)
- OG image feature was removed (too basic compared to Bannerbear)
- `__name` decorator bug: never declare named functions inside page.evaluate() — see docs/agent-loop.md and memory
