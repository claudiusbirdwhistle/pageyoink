# Task Queue

## In Progress
(none)

## Up Next (Priority Order) — Phase C: Deployment
1. [ ] Configure hosting platform (human needed for account creation)
2. [ ] Set up auto-deploy pipeline from git push
3. [ ] Verify health endpoint works in production
4. [ ] Set up log access (API or CLI based, no web dashboard needed)
5. [ ] Document deployment procedures in runbook

## Queued — Phase D: Monetization
1. [ ] Create RapidAPI listing (human needed for account creation)
2. [ ] Configure pricing tiers (free: 100 req/month, starter: $9, pro: $29, business: $79)
3. [ ] Add usage metering and enforcement
4. [ ] Set up Stripe for direct sales (human needed for account creation)
5. [ ] Build simple landing page

## Queued — Phase E: Differentiation
1. [ ] Add cookie banner / popup removal (blocklist-based)
2. [ ] Add smart readiness detection (network idle + DOM stable + fonts loaded)
3. [ ] Add OG image template endpoint with pre-built templates
4. [ ] Add batch processing endpoint with webhook delivery
5. [ ] Add content-aware PDF pagination (beta)

## Done
- [x] Initialize Node.js project with package.json, TypeScript config, and dependency installation (2026-03-22)
- [x] Set up project directory structure (src/, tests/, etc.) (2026-03-22)
- [x] Set up testing framework (Vitest) (2026-03-22)
- [x] Set up linting (ESLint + Prettier) (2026-03-22)
- [x] Create basic Fastify server with health endpoint (2026-03-22)
- [x] Write first test (health endpoint returns correct response) (2026-03-22)
- [x] Create Dockerfile for containerized deployment (2026-03-22)
- [x] Implement screenshot endpoint (URL → PNG/JPEG) (2026-03-22)
- [x] Implement HTML-to-PDF endpoint (URL or HTML → PDF) (2026-03-22)
- [x] Add input validation and error handling (2026-03-22)
- [x] Add rate limiting (per API key) (2026-03-22)
- [x] Add API key authentication (2026-03-22)
- [x] Add usage tracking (requests per key per day) (2026-03-22)
- [x] Write comprehensive tests for all endpoints (2026-03-22) — 19 tests across 4 test files

## Icebox
- [ ] Custom font support for PDF/screenshot generation
- [ ] Geo-distributed rendering (edge nodes in EU, Asia)
- [ ] Screenshot comparison / visual diff API
- [ ] Signed URL output (pre-signed S3 links for large files)
- [ ] SDK packages for Node.js, Python, Go
