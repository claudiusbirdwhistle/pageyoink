# Project Status

## Last Updated
2026-03-22 — CI fully green (tests + Docker), all autonomous work complete

## System State
- Deployed: no
- Health: runs locally, 33 tests pass across 7 test files
- CI: GREEN (tests + TypeScript build + Docker build all passing)
- Last known error rate: n/a
- Paying customers: 0
- Monthly revenue: $0

## What's Built
Full API with 10 endpoints + docs + SDK:
- GET / — landing page
- GET /docs — interactive Swagger UI API documentation
- GET /internal/health — health check + usage stats
- GET /v1/screenshot — URL to PNG/JPEG (clean mode + smart wait)
- GET /v1/pdf — URL to PDF (clean mode + smart wait)
- POST /v1/pdf — HTML to PDF
- GET /v1/og-image — template-based social images (query params)
- POST /v1/og-image — template-based social images (JSON body)
- POST /v1/batch — async batch processing (up to 50 URLs)
- GET /v1/batch/:jobId — check batch job status
- GET /v1/usage — per-key usage dashboard

Infrastructure:
- API key auth (x-api-key header or api_key query param)
- Rate limiting (configurable per minute)
- SQLite-backed persistent storage (usage + batch jobs)
- GitHub Actions CI (test + build + Docker) — verified green
- Dockerfile with Chromium + SQLite data volume
- OpenAPI/Swagger docs auto-generated from route schemas
- Node.js SDK (sdk/ directory, zero dependencies)
- Graceful shutdown (SIGTERM/SIGINT)
- .env.example with all config vars

## What's Needed From Human
1. Create hosting account (Railway, Render, or Fly.io) and connect GitHub repo
2. Set environment variables: API_KEYS, PORT, RATE_LIMIT_PER_MINUTE, DB_PATH
3. Create RapidAPI account and list the API
4. Create Stripe account for direct sales

## Warnings
- nvm required locally: `export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"`
