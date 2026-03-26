# Task List

Active and pending tasks only. Completed tasks archived in docs/completed-tasks.md.

---

## Pending — Can Be Done Autonomously

### Performance & UX
- [x] Landing page: add live elapsed timer during capture ("Capturing... 3.2s")
- [x] Capture progress tracking: track pipeline stages (navigating → loaded → scrolling → rendering → complete) per request ID in memory
- [x] Status endpoint: GET /internal/status/:requestId returns current stage + elapsed time
- [x] Landing page: poll status endpoint during capture, show current stage to user
- [x] Adaptive capture pipeline based on page length (short/medium/long classification with adaptive delays)
- [x] Optimize parallel extraction in unified endpoint
- [x] Browser pool warmup (pre-warm browser on server startup)

### Caching
- [ ] Add caching support to `/v1/page`

### Features
- [ ] Social share preview
- [ ] Responsive preview
- [ ] Table extraction
- [ ] Screenshot annotation API (arrows, boxes, blur regions)
- [ ] Anti-bot stealth mode (puppeteer-extra stealth plugin)
- [ ] WebP output format
- [ ] PDF table of contents auto-generation from heading structure
- [ ] PDF/A archival format support (add Ghostscript to Docker, `pdfa=true` parameter)

### Smart Auto-Optimize (automatic formatting based on site content)
- [ ] Design: `"optimize": true` parameter on screenshot/PDF endpoints, auto values for individual params
- [ ] Page analysis script: single page.evaluate that detects content width, table count/width, article vs non-article, image-to-text ratio, lang attribute, scroll dimensions
- [ ] PDF auto-optimization: landscape for wide tables/dashboards, scale-to-fit for overflow, locale-based page size, adaptive margins
- [ ] Screenshot auto-optimization: viewport width based on content container, format (PNG vs JPEG) based on content type, device scale factor based on text density
- [ ] Auto params are overridden by any explicitly set params (user always wins)
- [ ] Tests: capture 10 diverse sites (article, dashboard, table-heavy, photo-heavy, mobile-first) with optimize=true, verify heuristic selections are correct
- [ ] Save samples to samples/auto-optimize/ for human visual review — default vs optimized side by side

### Timestamped Web Archive (Legal-Grade Capture)
- [ ] Design: new endpoint POST /v1/archive — returns timestamped, hash-verified capture package
- [ ] WARC format (ISO 28500) capture: full HTTP request/response pairs, headers, content
- [ ] SHA-256 hashing of all captured content with hash chain
- [ ] RFC 3161 timestamp integration — submit content hash to a TSA (DigiCert or similar)
- [ ] Full metadata recording: DNS resolution, resolved IP, TLS certificate details, HTTP headers, capture system info
- [ ] Separate capture path with zero page manipulation (no clean mode, no CSS/JS injection)
- [ ] PDF/A export with embedded timestamp and signature (depends on PDF/A task above)
- [ ] Response format: ZIP containing WARC file, PDF/A render, metadata JSON, RFC 3161 timestamp token
- [ ] Legal disclaimers: clear documentation that this is technical proof, not legal certification
- [ ] Tests: verify WARC validity, hash integrity, timestamp token verification

### Structured Extraction (Hybrid: JSON-LD first, LLM fallback)
- [ ] Design: extend POST /v1/extract with `schema` parameter (user-defined JSON shape)
- [ ] Step 1: Extract JSON-LD, microdata, schema.org, Open Graph from page (extend metadata.ts)
- [ ] Step 2: Schema mapper — match structured data fields to user's requested schema
- [ ] Step 3: LLM fallback — for unfilled fields, send relevant HTML chunk to LLM
- [ ] LLM integration: support user-supplied API key (`x-llm-api-key` header) for Anthropic/OpenAI
- [ ] LLM integration: proxy mode with our own Anthropic key (metered/charged per extraction)
- [ ] Auto-extract mode: `"extract": "auto"` returns all structured data without a schema
- [ ] Add `structured` as output type in POST /v1/page unified endpoint
- [ ] Tests: product pages, articles, recipes, events — JSON-LD path and LLM fallback
- [ ] Pricing: determine credit cost for LLM-backed vs free JSON-LD-only extractions

---

## Blocked — Needs Human Action

### MCP Server
- [ ] Test MCP server with Claude Desktop (NEEDS: npm publish or local testing)
- [ ] Test MCP server with Cursor/VS Code (NEEDS: npm publish)
- [ ] Publish to npm as `pageyoink-mcp` (NEEDS: npm credentials)
- [ ] Register on PulseMCP, Claude listings, Cursor marketplace (NEEDS: npm publish)
- [ ] Link MCP docs from landing page (NEEDS: hosted docs/domain)

### Launch & Distribution
- [ ] Write "PageYoink vs Firecrawl" comparison (NEEDS: hosted blog)
- [ ] Product Hunt listing (NEEDS: account + domain)
- [ ] Hacker News Show HN post (NEEDS: live domain)
- [ ] LangChain, CrewAI, n8n integrations (NEEDS: external repos)
- [ ] Watermark on free-tier
- [ ] Public reports, open-source MCP, Awesome MCP, SEO content (NEEDS: domain/npm)

### Monetization
- [ ] Set up Stripe (NEEDS: Stripe account)
- [ ] API key provisioning (NEEDS: auth infrastructure decision)
- [ ] Tier-based rate limiting (NEEDS: API key system)
- [ ] Dashboard (NEEDS: auth + Stripe)
- [ ] Set API_KEYS in Cloud Run (NEEDS: GCP console access)
- [ ] Domain setup — pageyoink.com registered, DNS verification in progress
- [ ] DNS and SSL for custom domain (NEEDS: verification to complete)

### Landing Page
- [ ] Page performance optimization
- [ ] Mobile-responsive design refinement

---

## Ice Box — Requires human approval

- [ ] Self-hosted Docker image (open core model)
- [ ] Webhook transforms (capture → POST to user's endpoint)
