# Completed Tasks Archive

Moved from docs/tasks.md to reduce context size for Ralph Loop cycles.
See git history for implementation details.

---

## Security Hardening (S1-S19) — ALL COMPLETE
- SSRF protection (S1-S7): ssrf.ts, validateUrlSafe(), batch/webhook/proxy/font URL checks, 19 tests
- Browser security (S8-S10): removed --single-process, hardening flags, --no-sandbox documented
- Input validation (S11-S15): viewport limits, timezone, geolocation, CSS/JS size limits
- Anti-abuse (S16-S19): request logging, response limits, API key in params, trial reset blocked in prod

## Phase E: Unified Page API — COMPLETE
- Markdown extraction: Readability + Turndown, GET /v1/extract, tested on wikipedia/HN
- Metadata extraction: OG/Twitter/JSON-LD, GET /v1/metadata, tested
- Unified endpoint: POST /v1/page, single page load, all outputs, 7 tests, Swagger docs
- Caching: in-memory JSON cache for /v1/page with X-Cache header
- Trial integration: Content + Metadata tabs, lazy-loaded

## Phase G: Landing Page — COMPLETE
- Hero section: redesigned, tabbed demo, all tabs working
- AI Agent section: MCP install command, tools listed
- API section: unified endpoint featured, code examples
- Pricing: 4 tiers, explainer text
- Polish: title, meta description, footer, mobile responsive, performance optimized

## Phase H: Launch Prep — COMPLETE (except blocked items)
- Documentation: getting started guide, Swagger docs, code examples
- SDK updates: Node.js, Python, Go SDKs updated
- Launch blog post: written

## Quality & Benchmarks
- Benchmark: 4.6s unified endpoint on HN
- Error handling, edge cases, request IDs, clean mode tested across 10+ sites

## Audit Tasks (A1-H5) — ALL 51 COMPLETE
See docs/audit-tasks.md for full details. Includes __name fixes, bug fixes,
landing page UX, route/service/integration tests, error handling, security.

## Performance & UX (completed 2026-03-25)
- Live elapsed timer + progress stage tracking on landing page
- Status endpoint: GET /internal/status/:requestId
- Adaptive capture pipeline: short/medium/long page classification with adaptive delays
- Parallel metadata + content extraction in unified endpoint
- Browser pre-warm on server startup

## Smart Auto-Optimize (completed 2026-03-25)
- `optimize=true` parameter on screenshot/PDF endpoints
- Page analysis: content width, tables, article detection, image ratio, lang attribute
- PDF: landscape for wide tables, scale-to-fit, locale page size, adaptive margins
- Screenshot: viewport width, format selection (PNG vs JPEG), DPR based on content
- Auto params overridden by explicit user params
- Test samples saved to samples/auto-optimize/

## Structured Extraction (completed 2026-03-25)
- POST /v1/extract/structured endpoint
- JSON-LD, microdata, schema.org, Open Graph extraction
- Schema mapper: match structured data to user-defined field types
- LLM fallback: Anthropic API (Haiku) for unfilled fields
- User-supplied API key or server proxy mode
- Auto-extract mode (omit schema for all structured data)
- Added as `structured` output type in POST /v1/page
- Tests: auto-extract, schema mode, SSRF blocking

## Features (completed 2026-03-25)
- Table extraction: `tables=true` on extract endpoint returns JSON arrays
- WebP screenshot format: `format=webp` support
