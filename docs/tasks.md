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
11. [ ] Add caching support to `/v1/page` (same TTL/fresh mechanism as existing endpoints)
12. [x] Write tests — 7 tests covering default outputs, selective outputs, PDF, SSRF, viewport validation
13. [ ] Test unified endpoint against real sites, verify single page load (check timing)
14. [x] Swagger/OpenAPI docs auto-generated from schema decorators

### Trial Page Integration
15. [ ] Add "Content" tab to trial demo — show markdown extraction output
16. [ ] Add "Metadata" tab to trial demo — show OG tags, structured data, page info
17. [ ] The trial demo should now show tabs: Screenshot | PDF | Content | Metadata

---

## Phase F: MCP Server — Distribution via AI Agent Ecosystem

### Build the MCP Server
18. [ ] Create `mcp-server/` directory as a separate npm package
19. [ ] Implement single `web_page` MCP tool:
    - Input: `{ url: string, outputs?: string[], clean?: boolean, viewport?: { width: number, height: number } }`
    - Calls the PageYoink `/v1/page` endpoint
    - Returns structured result with all requested outputs
    - For screenshots: return image data that MCP clients can display
    - For markdown: return text content directly
    - For metadata: return structured JSON
20. [ ] Zero-config setup: works without API key on free tier (auto-provisions based on install ID or IP)
21. [ ] `npx pageyoink-mcp` should start the server with no configuration needed
22. [ ] Add a `pageyoink` convenience tool alias: `web_page` is the primary, but also register `screenshot`, `pdf`, `extract` as focused sub-tools for agents that prefer explicit tool selection
23. [ ] Test MCP server with Claude Desktop
24. [ ] Test MCP server with Cursor/VS Code
25. [ ] Write clear README for the MCP server package with install instructions

### Publish and Register
26. [ ] Publish MCP server to npm as `pageyoink-mcp` (BLOCKED: needs npm credentials)
27. [ ] Register on PulseMCP directory
28. [ ] Submit to Claude MCP server listings (if applicable)
29. [ ] Submit to Cursor/Windsurf marketplace (if applicable)

---

## Phase G: Landing Page Rebuild — New Positioning

### New Hero Section
30. [ ] Redesign landing page hero: "One URL. Everything you need." (or similar — think about the exact copy)
31. [ ] Replace single URL input + Screenshot/PDF buttons with a multi-output demo
32. [ ] Demo should show tabbed results: Screenshot | PDF | Content | Metadata
33. [ ] Each tab loads its content from the trial endpoint when clicked (not all at once)
34. [ ] Screenshot tab: show the rendered image (existing behavior)
35. [ ] PDF tab: show download link + page count + file size (existing behavior, enhanced)
36. [ ] Content tab: show extracted markdown with word count, rendered as formatted text
37. [ ] Metadata tab: show OG preview card + meta tags + link/image counts + structured data

### AI Agent Section
38. [ ] Add "For AI Agents" section below the demo
39. [ ] Show the MCP install command: `npx pageyoink-mcp`
40. [ ] Show example of an AI agent using the tool (a realistic conversation snippet)
41. [ ] Link to MCP server README/docs

### API Section
42. [ ] Update the endpoint list to feature `/v1/page` as the primary endpoint
43. [ ] Keep individual endpoints (screenshot, pdf, extract, metadata) listed as focused alternatives
44. [ ] Show a code example of the unified endpoint with multiple outputs

### Pricing Section
45. [ ] Redesign pricing around "page captures" not "screenshots"
    - Free: 200 captures/month, all outputs included
    - Builder: $12/mo, 5,000 captures
    - Pro: $39/mo, 25,000 captures
    - Scale: $99/mo, 100,000 captures
    - "All outputs included" badge on every tier — this is the differentiator
46. [ ] Make it clear: one page capture = one browser load = any combination of outputs. No credit multipliers.

### General Polish
47. [ ] Update tagline from "Screenshot & PDF API" to something reflecting the unified vision
48. [ ] Update meta tags (og:title, og:description) for SEO and social sharing
49. [ ] Ensure the landing page is fast (minimize inline CSS/JS, consider code splitting)
50. [ ] Mobile-responsive design for the landing page
51. [ ] Add footer with links: Docs, GitHub, API Status, Blog (placeholder)

---

## Phase H: Launch Preparation & Distribution

### Documentation
52. [ ] Write a "Getting Started" guide — from zero to first API call in 60 seconds
53. [ ] Write MCP integration guide — "Give your AI agent web access in 30 seconds"
54. [ ] Update Swagger docs to be comprehensive for all endpoints including /v1/page
55. [ ] Add code examples in Node.js, Python, and curl for the unified endpoint

### SDK Updates
56. [ ] Update Node.js SDK with page(), extract(), metadata() methods
57. [ ] Update Python SDK with page(), extract(), metadata() methods
58. [ ] Update Go SDK with Page(), Extract(), Metadata() methods

### Content for Launch
59. [ ] Write launch blog post: "Introducing PageYoink — The Web Page API for AI Agents"
60. [ ] Write comparison post: "PageYoink vs Firecrawl: When You Need More Than Markdown"
61. [ ] Prepare Product Hunt listing (title, tagline, description, screenshots)
62. [ ] Prepare Hacker News Show HN post

### Integration PRs
63. [ ] Build LangChain tool integration (Python package or PR to langchain-community)
64. [ ] Build CrewAI tool integration
65. [ ] Build n8n node (if architecture allows)

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
73. [ ] Benchmark unified endpoint — target <5s for screenshot+markdown+metadata on typical sites
74. [ ] Optimize: can markdown extraction run in parallel with PDF generation?
75. [ ] Consider browser pool warmup to reduce cold-start latency on Cloud Run

### Quality
76. [ ] Add error handling for extraction failures (site blocks JS, empty content, timeout)
77. [ ] Handle edge cases: non-HTML URLs (PDFs, images, binary files), redirects, auth-required pages
78. [ ] Add request ID tracking for debugging
79. [ ] Improve clean mode: test against top 50 websites, fix any that still show popups/banners

### Features
80. [ ] Add `outputs` parameter to trial endpoints so the demo can request specific combinations
81. [ ] Social share preview renderer — show how a URL appears when shared on Twitter/LinkedIn
82. [ ] Responsive preview — capture at mobile (375px), tablet (768px), desktop (1280px) and return all three
83. [ ] Table extraction — detect HTML tables and return as JSON arrays

### Distribution
84. [ ] Add "Captured by PageYoink" watermark to free-tier screenshots (small, bottom corner)
85. [ ] Create public page reports: pageyoink.dev/report/{url} — shareable analysis pages
86. [ ] Open-source the MCP server and clean mode engine (MIT license)
87. [ ] Submit to Awesome MCP Servers list on GitHub
88. [ ] Write SEO content: "Best Screenshot API 2026", "URL to Markdown API", etc.

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
