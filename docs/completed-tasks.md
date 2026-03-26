# Completed Tasks Archive

Moved from docs/tasks.md to reduce context size for Ralph Loop cycles.
See git history for implementation details.

---

## Security Hardening (S1-S19) — ALL COMPLETE
- SSRF protection (S1-S7): ssrf.ts, validateUrlSafe(), batch/webhook/proxy/font URL checks, 19 tests
- Browser security (S8-S10): removed --single-process, hardening flags, --no-sandbox documented
- Input validation (S11-S15): viewport limits, timezone, geolocation, CSS/JS size limits
- Anti-abuse (S16-S19): request logging, response limits, API key in params, trial reset blocked in prod

## Phase E: Unified Page API — COMPLETE (except caching)
- Markdown extraction (1-5): Readability + Turndown, GET /v1/extract, tested on wikipedia/HN
- Metadata extraction (6-8): OG/Twitter/JSON-LD, GET /v1/metadata, tested
- Unified endpoint (9-14): POST /v1/page, single page load, all outputs, 7 tests, Swagger docs
- Trial integration (15-17): Content + Metadata tabs, lazy-loaded

## Phase G: Landing Page — COMPLETE (except deferred items)
- Hero section (30-37): redesigned, tabbed demo, all tabs working
- AI Agent section (38-40): MCP install command, tools listed
- API section (42-44): unified endpoint featured, code examples
- Pricing (45-46): 4 tiers, explainer text
- Polish (47-48, 51): title, meta description, footer

## Phase H: Launch Prep — COMPLETE (except blocked items)
- Documentation (52-55): getting started guide, Swagger docs, code examples
- SDK updates (56-58): Node.js, Python, Go SDKs updated
- Launch blog post (59): written

## Quality & Benchmarks (73, 76-80)
- Benchmark: 4.6s unified endpoint on HN
- Error handling, edge cases, request IDs, clean mode tested across 10+ sites

## Audit Tasks (A1-H5) — ALL 51 COMPLETE
See docs/audit-tasks.md for full details. Includes __name fixes, bug fixes,
landing page UX, route/service/integration tests, error handling, security.
