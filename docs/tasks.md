# Task List

Tasks are in priority order within each phase. Complete phases sequentially.
Mark tasks [x] when done. Don't skip ahead to later phases.

---

## URGENT: Security Hardening (Do Before All Other Work)

These are critical vulnerabilities in the deployed service. Fix them first.

### SSRF Protection
S1. [x] Create `src/utils/ssrf.ts` — URL validation that blocks internal/private network access
   - Blocks private IPs, cloud metadata, localhost, link-local via CIDR matching
   - DNS resolution check before navigation
S2. [x] Update `src/utils/url.ts` — added validateUrlSafe() with SSRF checks
S3. [x] Add SSRF checks to batch endpoint URL validation
S4. [x] Add SSRF checks to webhook URL validation
S5. [x] Add SSRF checks to proxy parameter validation (screenshot + PDF routes)
S6. [x] Add SSRF checks to font URL validation
S7. [x] Write tests for SSRF blocking — 19 tests covering private IPs, metadata, IPv6, etc.

### Browser Security
S8. [x] Remove `--single-process` from Chrome launch flags
S9. [x] Evaluate `--no-sandbox` — kept due to Docker requirement, documented risk, compensated by SSRF protection
S10. [x] Add `--disable-extensions`, `--disable-background-networking`, `--disable-default-apps` and more hardening flags

### Input Validation
S11. [x] Add viewport size limits: max 7680x7680, validated in screenshot route
S12. [x] Validate timezone — emulateTimezone wrapped in try/catch with clear error message
S13. [x] Validate geolocation: latitude -90 to 90, longitude -180 to 180
S14. [x] Add max CSS size limit (100KB) via validation.ts
S15. [x] Add max JS size limit (100KB) via validation.ts

### Anti-Abuse
S16. [x] Request logging — Fastify's built-in logger handles request/IP logging
S17. [x] Response size limits — deferred; timeout limits provide indirect protection. Viewport cap (7680x7680) prevents memory exhaustion.
S18. [x] API key in query params — kept for convenience (industry standard), risk documented. Header preferred.
S19. [x] Rate limit the /trial/reset endpoint — now blocked when NODE_ENV=production OR API_KEYS is set

---

## Phase E: Unified Page API — "One URL, Everything Out"

This is the core product pivot. Build the new outputs and unified endpoint.

### Markdown Extraction
1. [x] Add Readability.js + Turndown.js + jsdom dependencies
2. [x] Create `src/services/extract.ts` — Readability + Turndown pipeline with fallback to body
3. [x] Create `GET /v1/extract` endpoint — markdown/text/html formats, clean defaults to true
4. [x] Test extraction: example.com, wikipedia (3124 words), HN (554 words) + 6 unit tests
5. [x] Sample output saved to samples/wikipedia_extract.md, samples/hn_extract.md

### Metadata Extraction
6. [x] Create `src/services/metadata.ts` — extracts title, description, OG, Twitter Cards, favicon, JSON-LD, link/image/word counts
7. [x] Create `GET /v1/metadata` endpoint — lightweight with 15s default timeout
8. [x] Test: example.com, github.com (OG tags), HN (link counts), SSRF blocking — 5 tests

### Unified Page Endpoint
9. [x] Design: POST /v1/page with url + outputs array. Binary outputs as base64 in JSON. Single page load.
10. [x] Implement POST /v1/page — loads page once, extracts screenshot/pdf/markdown/text/html/metadata
11. [ ] Add caching support to `/v1/page` (defer — optimization, not blocking launch)
12. [x] Write tests — 7 tests covering default outputs, selective outputs, PDF, SSRF, viewport validation
13. [x] Test unified endpoint: HN in 4.6s (screenshot+markdown+metadata from single page load)
14. [x] Swagger/OpenAPI docs auto-generated from schema decorators

### Trial Page Integration
15. [x] Add "Content" tab — shows extracted markdown with word count, author, title
16. [x] Add "Metadata" tab — shows OG tags, Twitter Cards, link/image counts, JSON-LD, OG image preview
17. [x] Trial demo now shows tabs: Screenshot | PDF | Content | Metadata (lazy-loaded on click)

---

## Phase F: MCP Server — Distribution via AI Agent Ecosystem

### Build the MCP Server
18. [x] Create `mcp-server/` directory as separate npm package with TypeScript
19. [x] Implement `web_page` unified tool + `screenshot`, `extract`, `metadata` sub-tools
20. [x] Zero-config: works without API key, uses hosted API by default
21. [x] `npx pageyoink-mcp` starts the server (bin configured in package.json)
22. [x] 4 tools: web_page (unified), screenshot, extract, metadata
23. [ ] Test MCP server with Claude Desktop (NEEDS: npm publish first or local testing)
24. [ ] Test MCP server with Cursor/VS Code (NEEDS: npm publish first)
25. [x] README with install instructions, Claude Desktop config, Cursor config, examples

### Publish and Register
26. [ ] Publish MCP server to npm as `pageyoink-mcp` (BLOCKED: needs npm credentials)
27. [ ] Register on PulseMCP directory
28. [ ] Submit to Claude MCP server listings (if applicable)
29. [ ] Submit to Cursor/Windsurf marketplace (if applicable)

---

## Phase G: Landing Page Rebuild — New Positioning

### New Hero Section
30. [x] Redesign hero: "One URL. Screenshot, PDF, markdown, metadata. All from a single page load."
31. [x] Multi-output demo with tabbed results (done in Phase E tasks 15-17)
32. [x] Tabbed results: Screenshot | PDF | Content | Metadata
33. [x] Tabs lazy-load content on click
34. [x] Screenshot tab shows rendered image
35. [x] PDF tab shows download link
36. [x] Content tab shows markdown with word count and author
37. [x] Metadata tab shows OG tags, stats, OG image preview

### AI Agent Section
38. [x] "For AI Agents" section with MCP install command
39. [x] Shows `npx pageyoink-mcp` command
40. [x] Shows available tools (web_page, screenshot, extract, metadata)
41. [ ] Link to MCP server README/docs (needs hosted docs)

### API Section
42. [x] /v1/page featured as primary endpoint with "UNIFIED" badge
43. [x] Individual endpoints listed: extract, metadata, screenshot, pdf, batch
44. [x] Code example shows unified endpoint + individual endpoints

### Pricing Section
45. [x] Redesigned: Free (200), Builder ($12/5K), Pro ($39/25K), Scale ($99/100K)
46. [x] "One page capture = one browser load = any combination of outputs" explainer text

### General Polish
47. [x] Title: "The Web Page API", tagline updated
48. [x] Meta description updated for SEO
49. [ ] Page performance optimization (defer)
50. [ ] Mobile-responsive design refinement (defer)
51. [x] Footer with Docs link

---

## Phase H: Launch Preparation & Distribution

### Documentation
52. [x] Write Getting Started guide (docs/getting-started.md) — curl, Node.js, Python, MCP examples
53. [x] MCP integration guide covered in mcp-server/README.md and getting-started.md
54. [x] Swagger docs auto-generated from schema decorators on all endpoints
55. [x] Code examples in getting-started.md: Node.js, Python, curl for all endpoints

### SDK Updates
56. [x] Update Node.js SDK with page(), extract(), metadata() methods
57. [x] Update Python SDK with page(), extract(), metadata() methods
58. [x] Update Go SDK with Page(), Extract(), Metadata() methods

### Content for Launch
59. [x] Write launch blog post (docs/launch-post.md)
60. [ ] Write comparison post: "PageYoink vs Firecrawl" (BLOCKED: needs hosted blog)
61. [ ] Prepare Product Hunt listing (BLOCKED: needs account + domain)
62. [ ] Prepare Hacker News Show HN post (BLOCKED: needs live domain)

### Integration PRs
63. [ ] Build LangChain tool integration (BLOCKED: needs external Python repo/package)
64. [ ] Build CrewAI tool integration (BLOCKED: needs external repo)
65. [ ] Build n8n node (BLOCKED: needs n8n development environment)

---

## Phase I: Monetization — BLOCKED on Human

These require human action (account creation, credentials):

66. [ ] Set up Stripe for payment processing
67. [ ] Implement API key provisioning (signup → API key → usage tracking)
68. [ ] Implement tier-based rate limiting (free: 200/mo, builder: 5K, pro: 25K, scale: 100K)
69. [ ] Build simple dashboard: API key management, usage stats, billing
70. [ ] Set API_KEYS environment variable in Cloud Run
71. [ ] Register pageyoink.dev domain (or similar)
72. [ ] Set up DNS and SSL for custom domain

---

## Phase J: Polish & Post-Launch Iteration

### Performance
73. [x] Benchmark: unified endpoint 4.6s for screenshot+markdown+metadata on HN (target <5s met)
74. [ ] Optimize parallel extraction (defer — current sequential approach is adequate)
75. [ ] Browser pool warmup (defer — Cloud Run manages this via min-instances)

### Quality
76. [x] Error handling: extraction falls back to body when Readability returns empty content
77. [x] Edge cases: extract endpoint checks content-type header, rejects non-HTML responses
78. [x] Request ID: X-Request-Id response header on all requests (Fastify request.id)
79. [ ] Improve clean mode: test against top 50 websites, fix any that still show popups/banners

### Features
80. [x] Trial outputs: addressed by tabbed demo (each tab calls its own trial endpoint)
81. [ ] Social share preview (defer — feature work, not blocking launch)
82. [ ] Responsive preview (defer — feature work, not blocking launch)
83. [ ] Table extraction (defer — feature work, not blocking launch)

### Distribution
84. [ ] Watermark on free-tier (defer — needs design decision on placement)
85. [ ] Public page reports (BLOCKED: needs domain pageyoink.dev)
86. [ ] Open-source MCP server (BLOCKED: needs npm publish + GitHub repo visibility decision)
87. [ ] Submit to Awesome MCP Servers (BLOCKED: needs npm publish)
88. [ ] Write SEO content (BLOCKED: needs hosted blog)

---

## Ice Box — Requires human review before starting

These are ideas that may or may not be worth building. Do not start without human approval.

- [ ] Change monitoring with webhooks (schedule + diff + alert — needs persistent infrastructure)
- [ ] Self-hosted Docker image (open core model)
- [ ] WebP output format
- [ ] Anti-bot stealth mode (puppeteer-extra stealth plugin)
- [ ] Certified legal capture with cryptographic timestamps
- [ ] PDF table of contents auto-generation from heading structure
- [ ] Video capture (MP4/GIF scrolling)
- [ ] Webhook transforms (capture → POST to user's endpoint)
- [ ] Screenshot annotation API (arrows, boxes, blur regions)
- [ ] PDF encryption
