# Audit Task List — Make PageYoink Shippable

Generated 2026-03-24 from comprehensive code + UX + quality audit.
Ordered by priority. This is a full day of work for an agent.

---

## 1. CRITICAL: __name Decorator Bugs (tsx dev compatibility)

Several services use `const` arrow functions inside `page.evaluate()`.
Works in production (compiled JS) but BREAKS in `tsx watch` (dev mode).

- [ ] A1. Fix cleanup.ts — convert page.evaluate to string-based script
- [ ] A2. Fix stealth-adblock.ts — same
- [ ] A3. Fix print-fix.ts — same
- [ ] A4. Fix readiness.ts — same
- [ ] A5. Fix lazy-load.ts — same
- [ ] A6. Fix extract.ts — page.evaluate at line 36 and 60
- [ ] A7. Add regression test that catches __name issues

---

## 2. BUG FIXES — Things That Are Broken

- [ ] B1. Invalid URLs return 500 instead of 400 (e.g., `?url=not-a-url!!!` returns `net::ERR_NAME_NOT_RESOLVED` as 500 — should be 400 "Invalid URL")
- [ ] B2. Error message format is inconsistent — some endpoints return `{"error":"..."}`, others return Fastify's `{"statusCode":400,"code":"FST_ERR_VALIDATION","error":"Bad Request","message":"..."}`. Standardize to `{"error":"..."}` everywhere.
- [ ] B3. Content tab in landing page shows RAW markdown text (white-space: pre-wrap) instead of rendered/formatted HTML. Headings should look like headings, links should be clickable.
- [ ] B4. google.com extraction returns only 11 words of footer links — Readability fails on non-article pages. Should return more useful content or a clear "no article content found" message with full body text fallback.
- [ ] B5. 404 pages (e.g., example.com/nonexistent) return 200 with empty/minimal content instead of indicating the page returned an error status code.

---

## 3. LANDING PAGE — First Impression Quality

The landing page is the product's face. It needs to be excellent.

### Demo UX
- [ ] C1. Render markdown as formatted HTML in the Content tab (convert headings, links, code blocks, tables to styled HTML)
- [ ] C2. Change default URL from bbc.com (slow, 5+ seconds) to something fast like news.ycombinator.com or stripe.com
- [ ] C3. Add loading spinners/skeleton UI for each tab while loading
- [ ] C4. Add error states for tabs (if extract or metadata fails, show friendly error, not silent blank)
- [ ] C5. Disable "Capture Page" button while capturing (prevent double-clicks)
- [ ] C6. Show capture timing ("Captured in 2.3s") to demonstrate speed
- [ ] C7. Allow pressing Enter in the URL field to trigger capture

### Content & Credibility
- [ ] C8. Add og:image meta tag (screenshot of the landing page or a branded image) for social sharing
- [ ] C9. Add twitter:card meta tags
- [ ] C10. Add a "How It Works" section — 3 steps: 1) Send a URL, 2) We load it in a real browser, 3) Get any output you need
- [ ] C11. Add use case examples: "For AI Agents", "For QA Teams", "For Content Pipelines"
- [ ] C12. Add FAQ section answering: What sites work? How fast is it? What about JavaScript? Is it free?
- [ ] C13. Add a simple privacy note (we don't store your content, captures are ephemeral)
- [ ] C14. Change "Learn more" link in footer to link to /docs

### Visual Polish
- [ ] C15. Mobile responsive testing — tabs may not fit on 375px screens
- [ ] C16. Test in dark mode (the page IS dark mode, but test in light-mode OS)
- [ ] C17. Add subtle animation/transition when tabs switch
- [ ] C18. Improve the metadata tab layout — currently a plain grid, could look more like a card

---

## 4. MISSING TESTS — Routes

- [ ] D1. Create tests/diff.test.ts
  - Basic diff between two URLs returns JSON with diffPixels, diffPercentage
  - Image format returns PNG binary
  - SSRF blocking on both url1 and url2
  - Invalid URL returns 400

- [ ] D2. Create tests/trial.test.ts
  - All 4 trial endpoints work (screenshot, pdf, extract, metadata)
  - Rate limiting (6th request returns 429)
  - SSRF blocking on trial endpoints
  - Trial reset blocked in production mode

- [ ] D3. Create tests/landing.test.ts
  - GET / returns 200 with HTML containing key elements
  - Contains "Capture Page" button and all 4 tabs
  - Contains updated branding ("The Web Page API")

---

## 5. MISSING TESTS — Services

- [ ] E1. Test cleanup.ts (clean mode)
  - Cookie banner selectors actually hide elements
  - overflow:hidden → auto, overflow:visible stays unchanged
  - Text-based detection finds cookie-related text in fixed elements

- [ ] E2. Test cache.ts
  - cacheSet + cacheGet returns same data
  - TTL expiry works
  - Different params produce different cache keys

- [ ] E3. Test watermark.ts
  - addWatermark returns valid PDF buffer with more pages
  - Position parameter works

---

## 6. INTEGRATION TESTS — Real-World Quality

- [ ] F1. Screenshot quality validation
  - Screenshot is not blank (not all-white) — check file size > threshold
  - Screenshot dimensions match requested viewport
  - Compare clean vs non-clean output on a site with cookie banners

- [ ] F2. PDF quality validation
  - PDF has >0 pages (use pdf-lib to verify)
  - PDF text content is not empty on multi-page sites
  - max_pages parameter limits page count correctly

- [ ] F3. Markdown extraction quality
  - Wikipedia article: >500 words, preserves headings
  - News site (HN or BBC): extracts meaningful content
  - Non-article pages (google.com): falls back gracefully
  - Test tables preservation (find a page with an HTML table)

- [ ] F4. Metadata extraction quality
  - Site with OG tags (github.com): all OG fields populated
  - Site with JSON-LD (news site): jsonLd array populated
  - Site with no meta tags (example.com): returns null gracefully

- [ ] F5. Unified /v1/page quality
  - Returns all requested outputs from single page load
  - Base64 screenshot decodes to valid PNG
  - Base64 PDF decodes to valid PDF starting with %PDF-
  - Markdown content matches what /v1/extract returns independently

---

## 7. ERROR HANDLING & EDGE CASES

- [ ] G1. Standardize error responses across all endpoints to `{"error":"message"}` format
  - Wrap Fastify validation errors
  - Catch DNS resolution errors and return 400 instead of 500
  - Handle navigation timeout with friendly message

- [ ] G2. Add retry logic to /v1/page for browser crashes (like screenshot/pdf services have)

- [ ] G3. Handle non-HTML URLs in /v1/page (PDF files, images, binary)
  - Detect content-type and return error for extract/markdown but allow screenshot/pdf

- [ ] G4. Handle empty pages gracefully
  - Extract should return `{"content":"","wordCount":0}` not an error
  - Metadata should work even on blank pages

- [ ] G5. Report upstream HTTP status in extract response
  - If the target page returns 404 or 500, include that in the response (e.g., `"httpStatus": 404`)

---

## 8. SECURITY (Remaining)

- [ ] H1. Trial PDF SSRF: uses dynamic import (`await import("../utils/ssrf.js")`) — convert to static import at top of file
- [ ] H2. Custom error handler to prevent Fastify from leaking stack traces in production
- [ ] H3. Add Helmet-style security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- [ ] H4. Validate proxy URL format more strictly (must be host:port or http://host:port)
- [ ] H5. Add rate limit response headers that tell users when the limit resets

---

## 9. BUILD & OPS

- [ ] I1. Test Docker build locally with new dependencies (jsdom may need native deps)
- [ ] I2. Add /internal/health checks for new services (extract, metadata work?)
- [ ] I3. Add startup log showing all registered routes and their methods
- [ ] I4. Consider graceful shutdown — wait for in-progress captures to finish
- [ ] I5. Add environment variable documentation (.env.example should list all vars)

---

## 10. SDK & DOCUMENTATION

- [ ] J1. Add proper TypeScript types for /v1/page response in Node SDK (not Record<string, unknown>)
- [ ] J2. Add response type documentation in Python SDK docstrings
- [ ] J3. Add Go struct types for extract and metadata responses
- [ ] J4. Verify all SDK code examples in getting-started.md actually work
- [ ] J5. Update CLAUDE.md to reflect new endpoint list and architecture
- [ ] J6. Add CHANGELOG.md tracking the major versions/features

---

## 11. CONTENT RENDERING QUALITY

- [ ] K1. Test markdown extraction against 10 diverse sites and grade quality:
  - News: nytimes.com, bbc.com, cnn.com
  - Tech: github.com readme page, stripe.com/docs, developer.mozilla.org
  - Blog: medium.com article, dev.to article
  - Wiki: wikipedia.org article
  - Simple: news.ycombinator.com
  For each: word count, heading preservation, link preservation, noise ratio

- [ ] K2. Test screenshot quality against same 10 sites:
  - Is the image clear and properly rendered?
  - Are popups/banners removed in clean mode?
  - Are fonts loaded (not blank squares)?
  - Are images loaded (not broken placeholders)?

- [ ] K3. Test PDF quality against same 10 sites:
  - Does the PDF have content on all pages?
  - Are images present throughout (not just first few pages)?
  - Are fonts readable?
  - Is the layout reasonable (not overlapping)?

---

## 12. MCP SERVER POLISH

- [ ] L1. Test MCP server with Claude Desktop end-to-end (manual test)
- [ ] L2. Add error messages that help AI agents understand what went wrong
- [ ] L3. Add timeout configuration (currently hardcoded 45s/60s)
- [ ] L4. Handle API rate limit errors gracefully (retry or inform agent)
- [ ] L5. Add a `version` tool that returns server/API version for debugging

---

## Summary

| Category | Count | Priority |
|----------|-------|----------|
| __name bugs | 7 | CRITICAL |
| Bug fixes | 5 | CRITICAL |
| Landing page | 18 | HIGH |
| Missing route tests | 3 | HIGH |
| Missing service tests | 3 | HIGH |
| Integration tests | 5 | HIGH |
| Error handling | 5 | MEDIUM |
| Security | 5 | MEDIUM |
| Build/ops | 5 | MEDIUM |
| SDK/docs | 6 | MEDIUM |
| Content quality | 3 | MEDIUM |
| MCP server | 5 | LOW |
| **TOTAL** | **70** | |

---

## Recommended Execution Order for Ralph Loop

**Cycle 1-3:** Fix __name bugs (A1-A7) + bug fixes (B1-B5) — these are broken things
**Cycle 4-6:** Landing page UX (C1-C7) — the demo must impress
**Cycle 7-9:** Missing tests (D1-D3, E1-E3) — test coverage for confidence
**Cycle 10-12:** Integration tests (F1-F5) — verify real-world quality
**Cycle 13-15:** Error handling (G1-G5) + security (H1-H5) — production hardening
**Cycle 16-18:** Landing page content (C8-C18) — credibility and polish
**Cycle 19-20:** SDK/docs (J1-J6) + build (I1-I5)
**Cycle 21+:** Content quality testing (K1-K3) + MCP polish (L1-L5)
