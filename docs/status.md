# Project Status

## Last Updated
2026-03-24

## System State
- **Deployed:** Yes — Google Cloud Run (us-east1)
- **URL:** https://pageyoink-1085551159615.us-east1.run.app
- **CI:** Cloud Build auto-deploy on push to main
- **Health:** Running, 83 tests passing
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

### Endpoints (15 + docs)
- GET / — Landing page with tabbed multi-output demo
- GET /docs — Swagger UI with full parameter descriptions
- GET /internal/health — Health check + usage stats
- **POST /v1/page** — Unified endpoint (screenshot + PDF + markdown + metadata from single page load)
- GET /v1/extract — Markdown/text/HTML content extraction (Readability + Turndown)
- GET /v1/metadata — OG tags, Twitter Cards, JSON-LD, page stats
- GET /v1/screenshot — URL to PNG/JPEG
- GET /v1/pdf — URL to PDF
- POST /v1/pdf — HTML/URL to PDF (full options: headers, footers, watermark, proxy)
- POST /v1/batch — Async batch processing (up to 50 URLs)
- GET /v1/batch/:jobId — Batch job status + results
- POST /v1/diff — Visual diff between two URLs (pixelmatch)
- GET /v1/usage — Per-key usage dashboard
- GET /trial/screenshot, /trial/pdf, /trial/extract, /trial/metadata — Free trial endpoints

### Key Features
- **Unified page capture** — POST /v1/page returns any combination of outputs from a single page load
- **LLM-ready extraction** — Mozilla Readability + Turndown for clean Markdown
- **Metadata extraction** — OG tags, Twitter Cards, JSON-LD, page stats, favicon
- **4-phase clean mode** — cookie banners, chat widgets, text scanning, overlay detection
- **Stealth ad blocking** — network blocking (Ghostery) + post-load visual hiding
- **Smart wait** — DOM stability + fonts + images + animations
- **Security hardened** — SSRF protection, input validation, browser hardening
- **MCP server** — pageyoink-mcp package for AI agent web access

### SDKs
- Node.js (sdk/) — page(), extract(), metadata(), screenshot, PDF, diff, batch
- Python (sdk-python/) — same methods
- Go (sdk-go/) — same methods

### Landing Page
- New positioning: "One URL. Everything you need."
- Tabbed demo: Screenshot | PDF | Content | Metadata
- Updated pricing: Free 200, Builder $12, Pro $39, Scale $99
- AI Agent section with MCP install command
- Unified endpoint featured as primary

## What's NOT Done Yet

### Blocked on Human
- [ ] Set up Stripe for payment processing
- [ ] Implement API key provisioning and tier-based rate limiting
- [ ] Register pageyoink.dev domain
- [ ] Publish pageyoink-mcp to npm
- [ ] Create Product Hunt and Hacker News listings
- [ ] Build LangChain/CrewAI integrations

### Deferred (Post-Launch)
- Caching for /v1/page endpoint
- Parallel extraction optimization
- Social share preview renderer
- Responsive multi-viewport preview
- Table extraction as JSON
- Top 50 website clean mode testing

## Known Issues
- Cloud Run cold start: 5-10 seconds on first request after scale-to-zero
- BBC carousel images don't render in PDF (Chromium limitation)
- NYTimes print stylesheet hides masthead logo (site-specific)
- `__name` decorator bug: never use named functions in page.evaluate()
