# Project Status

## Last Updated
2026-03-22 — Competitive analysis complete, docs overhauled, priorities revised

## System State
- Deployed: no
- Health: runs locally, 33 tests pass across 7 test files
- CI: GREEN (tests + TypeScript build + Docker build all passing)
- Paying customers: 0
- Monthly revenue: $0

## What's Built (Phases A, B, E complete)

**10 API endpoints + docs + SDK:**
- GET / — landing page with pricing
- GET /docs — interactive Swagger UI
- GET /internal/health — health check + usage stats
- GET /v1/screenshot — URL to PNG/JPEG (clean, smart_wait, full_page, max_scroll)
- GET /v1/pdf — URL to PDF (clean, smart_wait, max_scroll)
- POST /v1/pdf — HTML to PDF
- GET/POST /v1/og-image — templated social images (light/dark/gradient)
- POST /v1/batch — async batch processing (up to 50 URLs, webhook delivery)
- GET /v1/batch/:jobId — job status + results
- GET /v1/usage — per-key usage dashboard with daily breakdown

**Infrastructure:**
- Fastify + TypeScript + Puppeteer on Node 22
- API key auth + rate limiting
- SQLite persistent storage (usage + batch jobs)
- GitHub Actions CI + Dockerfile
- Node.js SDK (zero deps)
- Graceful shutdown, .env.example, deployment guide

**Key differentiators built:**
- 4-phase clean mode (selector → text-content → z-index → backdrop detection)
- Smart readiness (DOM stable + fonts + images + animations)
- Lazy-load scrolling with max_scroll cap
- Automatic retry on transient Chrome crashes
- Bundled screenshot + PDF + OG image in one API

## What's NOT Built Yet (Competitive Gaps)

Competitive analysis (docs/competitive-analysis.md) revealed these gaps vs. ScreenshotAPI, ApiFlash, PDFShift, and Restpack:

**Must have before launch:**
- CSS/JS injection (all competitors have this)
- Custom headers, cookies, user-agent (required for authenticated captures)

**Should have:**
- Element capture by CSS selector
- Caching with configurable TTL
- Print-mode CSS to fix carousel rendering in PDFs

See docs/tasks.md "Phase F: Competitive Parity" for full list.

## Real-World Testing Results

Tested against: GitHub, HN, NYTimes, Stripe Docs, Tailwind, BBC, HubSpot, Intercom, Zendesk.

| Site | Screenshot | Clean Mode | PDF |
|------|-----------|------------|-----|
| GitHub | Good (2.9s) | Works | Good (6.5MB) |
| Hacker News | Perfect (1.1s) | Works | Perfect (278KB) |
| NYTimes | Retry needed (first attempt crashes) | Works | Good (images load with scroll) |
| Stripe Docs | Good but slow (16.7s) | Works | Good (sidebar missing — Chrome print issue) |
| Tailwind | Good (4.5s) | Works | Good |
| BBC | Good | Removes survey popup | PDF missing carousel images (Chrome print bug) |
| HubSpot | Good | Removes cookie banner + chat widget | Not tested |
| Intercom | Good | Removes cookie notice | Not tested |

**Known issues:**
- BBC "Weekend Reads" carousel images don't render in PDF (Chromium print renderer limitation)
- Stripe sidebar missing from PDF (fixed-position elements in print mode)
- NYTimes needs retry logic (transient Chrome crashes on heavy sites)

## What's Needed From Human
1. Create hosting account (Railway recommended — see docs/DEPLOY.md)
2. Set environment variables: API_KEYS, PORT, RATE_LIMIT_PER_MINUTE, DB_PATH
3. Create RapidAPI account and list the API
4. Create Stripe account for direct sales

## Current Priority
Phase F: Competitive Parity — CSS/JS injection + custom headers/cookies are the highest priority autonomous tasks remaining. These can be built without deployment.

## Environment Notes
- nvm required locally: `export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"`
- Test output goes to `samples/` (gitignored)
- GitHub: github.com/claudiusbirdwhistle/pageyoink
