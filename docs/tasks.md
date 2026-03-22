# Task Queue

## In Progress
(none)

## Up Next (Priority Order)
1. [ ] Add OG image template endpoint with pre-built templates (Phase E)
2. [ ] Add batch processing endpoint with webhook delivery (Phase E)
3. [ ] Add content-aware PDF pagination beta (Phase E)
4. [ ] Build simple landing page (Phase D)

## Blocked — Waiting on Human
- [ ] Configure hosting platform — human needed for account creation (Phase C)
- [ ] Set up auto-deploy pipeline from git push (Phase C — depends on hosting)
- [ ] Create RapidAPI listing — human needed for account creation (Phase D)
- [ ] Set up Stripe for direct sales — human needed for account creation (Phase D)

## Done
- [x] Initialize Node.js project (2026-03-22)
- [x] Set up project directory structure (2026-03-22)
- [x] Set up testing framework — Vitest (2026-03-22)
- [x] Set up linting — ESLint + Prettier (2026-03-22)
- [x] Create Fastify server with health endpoint (2026-03-22)
- [x] Write first test (2026-03-22)
- [x] Create Dockerfile (2026-03-22)
- [x] Implement screenshot endpoint — GET /v1/screenshot (2026-03-22)
- [x] Implement PDF endpoints — GET + POST /v1/pdf (2026-03-22)
- [x] Add input validation and error handling (2026-03-22)
- [x] Add rate limiting per API key (2026-03-22)
- [x] Add API key authentication (2026-03-22)
- [x] Add usage tracking per key per day (2026-03-22)
- [x] Set up GitHub Actions CI pipeline (2026-03-22)
- [x] Add cookie banner / popup removal — clean mode (2026-03-22)
- [x] Add smart readiness detection — smart_wait mode (2026-03-22)

## Icebox
- [ ] Custom font support for PDF/screenshot generation
- [ ] Geo-distributed rendering (edge nodes in EU, Asia)
- [ ] Screenshot comparison / visual diff API
- [ ] Signed URL output (pre-signed S3 links for large files)
- [ ] SDK packages for Node.js, Python, Go
- [ ] Persistent usage storage (SQLite or Redis)
