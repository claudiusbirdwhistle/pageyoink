# Task List

Active and pending tasks only. Completed tasks archived in docs/completed-tasks.md.

---

## Pending — Can Be Done Autonomously

### Performance & UX
- [ ] 106. Landing page: add live elapsed timer during capture ("Capturing... 3.2s")
- [ ] 107. Capture progress tracking: track pipeline stages (navigating → loaded → scrolling → rendering → complete) per request ID in memory
- [ ] 108. Status endpoint: GET /internal/status/:requestId returns current stage + elapsed time
- [ ] 109. Landing page: poll status endpoint during capture, show current stage to user
- [ ] 110. Reduce hardcoded 1s post-load delays — make adaptive or shorter for simple pages
- [ ] 111. Skip lazy image scrolling when page has no lazy-loaded images
- [ ] 112. Reduce image wait timeout from 10s to 3-5s
- [ ] 113. Skip second scroll pass (Phase 2) when Phase 1 found no new content loading
- [ ] 74. Optimize parallel extraction in unified endpoint
- [ ] 75. Browser pool warmup (Cloud Run min-instances)

### Caching
- [ ] 11. Add caching support to `/v1/page`

### Features
- [ ] 81. Social share preview
- [ ] 82. Responsive preview
- [ ] 83. Table extraction
- [ ] 89. Screenshot annotation API (arrows, boxes, blur regions)
- [ ] 90. Anti-bot stealth mode (puppeteer-extra stealth plugin)
- [ ] 92. WebP output format
- [ ] 93. PDF table of contents auto-generation from heading structure
- [ ] 95. PDF/A archival format support (add Ghostscript to Docker, `pdfa=true` parameter)

### Smart Auto-Optimize (automatic formatting based on site content)
- [ ] 124. Design: `"optimize": true` parameter on screenshot/PDF endpoints, auto values for individual params
- [ ] 125. Page analysis script: single page.evaluate that detects content width, table count/width, article vs non-article, image-to-text ratio, lang attribute, scroll dimensions
- [ ] 126. PDF auto-optimization: landscape for wide tables/dashboards, scale-to-fit for overflow, locale-based page size, adaptive margins
- [ ] 127. Screenshot auto-optimization: viewport width based on content container, format (PNG vs JPEG) based on content type, device scale factor based on text density
- [ ] 128. Auto params are overridden by any explicitly set params (user always wins)
- [ ] 129. Tests: capture 10 diverse sites (article, dashboard, table-heavy, photo-heavy, mobile-first) with optimize=true, verify heuristic selections are correct
- [ ] 130. Save samples to samples/auto-optimize/ for human visual review — default vs optimized side by side

### Timestamped Web Archive (Legal-Grade Capture)
- [ ] 114. Design: new endpoint POST /v1/archive — returns timestamped, hash-verified capture package
- [ ] 115. WARC format (ISO 28500) capture: full HTTP request/response pairs, headers, content
- [ ] 116. SHA-256 hashing of all captured content with hash chain
- [ ] 117. RFC 3161 timestamp integration — submit content hash to a TSA (DigiCert or similar)
- [ ] 118. Full metadata recording: DNS resolution, resolved IP, TLS certificate details, HTTP headers, capture system info
- [ ] 119. Separate capture path with zero page manipulation (no clean mode, no CSS/JS injection)
- [ ] 120. PDF/A export with embedded timestamp and signature (builds on task 95)
- [ ] 121. Response format: ZIP containing WARC file, PDF/A render, metadata JSON, RFC 3161 timestamp token
- [ ] 122. Legal disclaimers: clear documentation that this is technical proof, not legal certification
- [ ] 123. Tests: verify WARC validity, hash integrity, timestamp token verification

### Structured Extraction (Hybrid: JSON-LD first, LLM fallback)
- [ ] 96. Design: extend POST /v1/extract with `schema` parameter (user-defined JSON shape)
- [ ] 97. Step 1: Extract JSON-LD, microdata, schema.org, Open Graph from page (extend metadata.ts)
- [ ] 98. Step 2: Schema mapper — match structured data fields to user's requested schema
- [ ] 99. Step 3: LLM fallback — for unfilled fields, send relevant HTML chunk to LLM
- [ ] 100. LLM integration: support user-supplied API key (`x-llm-api-key` header) for Anthropic/OpenAI
- [ ] 101. LLM integration: proxy mode with our own Anthropic key (metered/charged per extraction)
- [ ] 102. Auto-extract mode: `"extract": "auto"` returns all structured data without a schema
- [ ] 103. Add `structured` as output type in POST /v1/page unified endpoint
- [ ] 104. Tests: product pages, articles, recipes, events — JSON-LD path and LLM fallback
- [ ] 105. Pricing: determine credit cost for LLM-backed vs free JSON-LD-only extractions

---

## Blocked — Needs Human Action

### MCP Server
- [ ] 23. Test MCP server with Claude Desktop (NEEDS: npm publish or local testing)
- [ ] 24. Test MCP server with Cursor/VS Code (NEEDS: npm publish)
- [ ] 26. Publish to npm as `pageyoink-mcp` (NEEDS: npm credentials)
- [ ] 27-29. Register on PulseMCP, Claude listings, Cursor marketplace (NEEDS: npm publish)
- [ ] 41. Link MCP docs from landing page (NEEDS: hosted docs/domain)

### Launch & Distribution
- [ ] 60. Write "PageYoink vs Firecrawl" comparison (NEEDS: hosted blog)
- [ ] 61. Product Hunt listing (NEEDS: account + domain)
- [ ] 62. Hacker News Show HN post (NEEDS: live domain)
- [ ] 63-65. LangChain, CrewAI, n8n integrations (NEEDS: external repos)
- [ ] 84. Watermark on free-tier
- [ ] 85-88. Public reports, open-source MCP, Awesome MCP, SEO content (NEEDS: domain/npm)

### Monetization
- [ ] 66. Set up Stripe (NEEDS: Stripe account)
- [ ] 67. API key provisioning (NEEDS: auth infrastructure decision)
- [ ] 68. Tier-based rate limiting (NEEDS: API key system)
- [ ] 69. Dashboard (NEEDS: auth + Stripe)
- [ ] 70. Set API_KEYS in Cloud Run (NEEDS: GCP console access)
- [ ] 71. Domain setup — pageyoink.com registered, DNS verification in progress
- [ ] 72. DNS and SSL for custom domain (NEEDS: verification to complete)

### Landing Page
- [ ] 49. Page performance optimization
- [ ] 50. Mobile-responsive design refinement

---

## Ice Box — Requires human approval

- [ ] Self-hosted Docker image (open core model)
- [ ] Webhook transforms (capture → POST to user's endpoint)
