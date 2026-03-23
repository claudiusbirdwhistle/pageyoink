# Task Queue

## In Progress
(none)

## Up Next — Phase F: Competitive Parity (Pre-Launch)

These features are needed before public launch. Every serious competitor has them.
See `docs/competitive-analysis.md` for full details.

### Priority 1 (Must have)
All complete.

### Priority 2 (Should have)
6. [x] Element capture — `selector` param captures specific DOM element (done 2026-03-22)
7. [ ] Caching with TTL — cache screenshots/PDFs, return cached version on repeated requests (don't count against quota)
8. [ ] Print-mode CSS injection for PDFs — auto-convert horizontal carousels to wrapped layouts to fix missing images in Chrome print renderer

### Priority 3 (Nice to have before launch)
9. [x] Transparent background — transparent=true, PNG only (done 2026-03-22)

## Blocked — Waiting on Human
- [ ] Configure hosting platform — human needed for account creation (Phase C)
- [ ] Set up auto-deploy pipeline from git push (Phase C — depends on hosting)
- [ ] Create RapidAPI listing — human needed for account creation (Phase D)
- [ ] Configure pricing tiers on RapidAPI (Phase D — depends on listing)
- [ ] Set up Stripe for direct sales — human needed for account creation (Phase D)

## Done

### Phase A: Foundation (2026-03-22)
- [x] Initialize Node.js project with TypeScript
- [x] Set up project directory structure
- [x] Set up testing framework (Vitest)
- [x] Set up linting (ESLint + Prettier)
- [x] Create Fastify server with health endpoint
- [x] Write first test
- [x] Create Dockerfile with Chromium

### Phase B: Core Features (2026-03-22)
- [x] Screenshot endpoint — GET /v1/screenshot (PNG/JPEG, viewport, quality, full page)
- [x] PDF endpoints — GET /v1/pdf (URL→PDF) + POST /v1/pdf (HTML→PDF)
- [x] Input validation and error handling
- [x] Rate limiting per API key
- [x] API key authentication (x-api-key header + api_key query param)
- [x] Usage tracking per key per day (SQLite-backed)

### Phase E: Differentiation (2026-03-22)
- [x] Cookie banner / popup removal — 4-phase clean mode (selector, text-content, z-index, backdrop)
- [x] Chat widget removal — Intercom, Drift, HubSpot, Crisp, Zendesk, Tawk, Tidio, etc.
- [x] Smart readiness detection — DOM stability + fonts + images + animations
- [x] Lazy-load image scrolling with max_scroll cap (prevents infinite scroll traps)
- [x] Event-based image wait — attaches load/error listeners to pending images
- [x] OG image template endpoint — GET + POST /v1/og-image (light/dark/gradient themes)
- [x] Batch processing — POST /v1/batch with job tracking + webhook delivery
- [x] Automatic retry on transient Chrome crashes (Connection closed, Target closed)

### Infrastructure & DX (2026-03-22)
- [x] GitHub Actions CI pipeline (test + build + Docker)
- [x] Swagger/OpenAPI docs at /docs
- [x] Usage dashboard endpoint — GET /v1/usage (per-key, per-endpoint, daily)
- [x] Landing page at /
- [x] Graceful shutdown handler (SIGTERM/SIGINT)
- [x] .env.example with all config vars
- [x] Node.js SDK (zero dependencies, full TypeScript types)
- [x] Persistent storage — SQLite for usage + batch jobs
- [x] Deployment guide (Railway, Render, Fly.io)
- [x] Competitive analysis document

### Phase F: Competitive Parity (2026-03-22)
- [x] Ad blocking via @ghostery/adblocker-puppeteer — block_ads=true (uBlock/EasyList compatible)
- [x] CSS injection — css param, injected via addStyleTag after page load
- [x] JS injection — js param, executed as sandboxed IIFE in page context
- [x] Custom headers — headers param (POST body) for HTTP request headers
- [x] Custom cookies — cookies param (POST body) with auto domain detection
- [x] Custom user-agent — user_agent param
- [x] Element capture — selector param, uses element.screenshot() for pixel-perfect extraction
- [x] Transparent background — transparent=true for PNG screenshots

### Bug Fixes & Quality (2026-03-22)
- [x] Fix TypeScript readonly property error in CI
- [x] Fix Docker build — install devDeps for tsc, then prune
- [x] Fix Fastify plugin encapsulation for auth middleware
- [x] Fix test isolation — in-memory SQLite for NODE_ENV=test
- [x] Fix __name decorator leak in page.evaluate callbacks
- [x] Overhaul clean mode — verified against HubSpot, BBC, Intercom (not just example.com)

## Icebox (Post-Launch)
- [ ] Proxy support (BYO proxy)
- [ ] Geolocation spoofing
- [ ] PDF encryption and password protection
- [ ] PDF headers/footers with template variables
- [ ] PDF watermarks (text + image)
- [ ] S3 export (direct upload to customer's bucket)
- [ ] Video capture (scrolling MP4/GIF)
- [ ] Click automation (click a selector before capture)
- [ ] Custom font support
- [ ] Screenshot comparison / visual diff API
- [ ] SDK packages for Python, Go
- [ ] Additional OG image templates
- [ ] Geo-distributed rendering (edge nodes)
