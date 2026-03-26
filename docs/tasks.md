# Task List

Active and pending tasks only. Completed tasks archived in docs/completed-tasks.md.

---

## Pending — Can Be Done Autonomously

### Features
- [ ] Social share preview
- [ ] Responsive preview
- [ ] Screenshot annotation API (arrows, boxes, blur regions)
- [x] Anti-bot stealth mode (puppeteer-extra stealth plugin)
- [ ] PDF table of contents auto-generation from heading structure
- [ ] PDF/A archival format support (add Ghostscript to Docker, `pdfa=true` parameter)

### Timestamped Web Archive (Legal-Grade Capture)
- [x] Design: new endpoint POST /v1/archive — returns timestamped, hash-verified capture package
- [x] WARC format (ISO 28500) capture: full HTTP request/response pairs, headers, content
- [x] SHA-256 hashing of all captured content with hash chain
- [ ] RFC 3161 timestamp integration — submit content hash to a TSA (DigiCert or similar)
- [x] Full metadata recording: DNS resolution, resolved IP, TLS certificate details, HTTP headers, capture system info
- [x] Separate capture path with zero page manipulation (no clean mode, no CSS/JS injection)
- [ ] PDF/A export with embedded timestamp and signature (depends on PDF/A task above)
- [x] Response format: ZIP containing WARC file, PDF render, metadata JSON, checksum
- [x] Legal disclaimers: clear documentation that this is technical proof, not legal certification
- [x] Tests: verify ZIP format, hash integrity, SSRF blocking

### Structured Extraction (remaining)
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

---

## Ice Box — Requires human approval

- [ ] Self-hosted Docker image (open core model)
- [ ] Webhook transforms (capture → POST to user's endpoint)
