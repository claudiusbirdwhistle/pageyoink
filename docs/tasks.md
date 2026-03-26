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
- [ ] Certified legal capture with cryptographic timestamps
- [ ] Webhook transforms (capture → POST to user's endpoint)
