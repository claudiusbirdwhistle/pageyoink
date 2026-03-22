# Project Status

## Last Updated
2026-03-22 — All autonomous work complete. Waiting on human for deployment + marketplace accounts.

## System State
- Deployed: no
- Health: runs locally, 29 tests pass across 6 test files
- Last known error rate: n/a
- Paying customers: 0
- Monthly revenue: $0

## What's Built
Full API with 8 endpoints:
- GET /internal/health — health check + usage stats
- GET /v1/screenshot — URL to PNG/JPEG (with clean mode + smart wait)
- GET /v1/pdf — URL to PDF (with clean mode + smart wait)
- POST /v1/pdf — HTML to PDF
- GET /v1/og-image — template-based social images (query params)
- POST /v1/og-image — template-based social images (JSON body)
- POST /v1/batch — async batch processing (up to 50 URLs)
- GET /v1/batch/:jobId — check batch job status
- GET / — landing page

Infrastructure:
- API key auth (x-api-key header or api_key query param)
- Rate limiting (configurable per minute)
- Usage tracking per API key per day
- GitHub Actions CI (test + build + Docker)
- Dockerfile with Chromium for Puppeteer
- Landing page with pricing tiers

## What's Needed From Human
1. Create hosting account (Railway, Render, or Fly.io) and connect GitHub repo
2. Create RapidAPI account and list the API
3. Create Stripe account for direct sales
4. Set environment variables: API_KEYS, PORT, RATE_LIMIT_PER_MINUTE

## Warnings
- nvm required: `export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"`
- Usage tracking and batch jobs are in-memory — need persistent storage for production
