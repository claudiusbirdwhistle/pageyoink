# Audit Task List — Make PageYoink Shippable

Generated 2026-03-24 from comprehensive code audit.
These tasks are ordered by priority within each category.

---

## 1. CRITICAL: __name Decorator Bugs (tsx dev server compatibility)

Several services use `const` arrow functions inside `page.evaluate()` callbacks.
These work in production (compiled JS) but BREAK in development (`tsx watch`)
because tsx injects a `__name` decorator that doesn't exist in the browser.

- [ ] A1. Fix cleanup.ts — convert page.evaluate callback to string-based script (like metadata.ts fix)
- [ ] A2. Fix stealth-adblock.ts — same __name issue
- [ ] A3. Fix print-fix.ts — same __name issue
- [ ] A4. Fix readiness.ts — same __name issue
- [ ] A5. Fix lazy-load.ts — same __name issue
- [ ] A6. Fix extract.ts — page.evaluate at line 36 and 60 use arrow functions
- [ ] A7. Add a regression test that catches __name issues (run tests via tsx, not just vitest)

---

## 2. MISSING TESTS — Routes Without Test Files

- [ ] B1. Create tests/diff.test.ts — test POST /v1/diff (visual comparison)
  - Test: basic diff between two URLs returns JSON with diffPixels
  - Test: image format returns PNG binary
  - Test: SSRF blocking on both url1 and url2
  - Test: invalid URL returns 400

- [ ] B2. Create tests/trial.test.ts — test all trial endpoints
  - Test: /trial/screenshot returns PNG without API key
  - Test: /trial/pdf returns PDF without API key
  - Test: /trial/extract returns JSON without API key
  - Test: /trial/metadata returns JSON without API key
  - Test: Rate limiting (6th request returns 429)
  - Test: SSRF blocking on trial endpoints

- [ ] B3. Create tests/landing.test.ts — test landing page
  - Test: GET / returns 200 with HTML
  - Test: HTML contains "PageYoink" branding
  - Test: HTML contains "Capture Page" button
  - Test: HTML contains all 4 tab buttons (Screenshot, PDF, Content, Metadata)

---

## 3. MISSING TESTS — Services Without Test Files

- [ ] C1. Test cleanup.ts (clean mode) — verify banner/popup removal works
  - Test against a page with cookie banner selectors
  - Test that overflow:hidden → auto, but overflow:visible stays unchanged
  - Test Phase 3 (z-index overlay) detection

- [ ] C2. Test cache.ts — verify caching works correctly
  - Test: cacheSet + cacheGet returns same data
  - Test: TTL expiry works
  - Test: different params produce different cache keys

- [ ] C3. Test watermark.ts — verify watermark application
  - Test: addWatermark returns valid PDF buffer
  - Test: position parameter works (center, top-left, etc.)

---

## 4. INTEGRATION TESTS — Real-World Site Verification

- [ ] D1. Create tests/integration.test.ts — end-to-end tests against real sites
  - Test: Screenshot of github.com returns valid PNG (>5KB, correct content-type)
  - Test: PDF of example.com starts with %PDF-
  - Test: Extract of wikipedia.org returns >500 words
  - Test: Metadata of github.com has OG tags
  - Test: Unified /v1/page returns all requested outputs

- [ ] D2. Screenshot quality validation
  - Test: Screenshot is not blank (all white/all black) — check pixel variance
  - Test: Screenshot dimensions match requested viewport
  - Test: Clean mode actually removes popups (compare with/without)

- [ ] D3. PDF quality validation
  - Test: PDF has >0 pages
  - Test: PDF text content is extractable (not blank pages)
  - Test: max_pages parameter actually limits page count

---

## 5. ERROR HANDLING & EDGE CASES

- [ ] E1. Handle browser crashes in /v1/page endpoint
  - The page route (page.ts) has a try/finally with page.close() but no retry logic
  - Screenshot and PDF services have retry for "Connection closed" — page route should too

- [ ] E2. Handle timeout gracefully in extract/metadata routes
  - Currently throws generic error — should return friendly message

- [ ] E3. Handle non-HTML content in /v1/page
  - What happens if someone passes a PDF URL or image URL to /v1/page?
  - Should detect content-type and return appropriate error for extract/markdown outputs

- [ ] E4. Handle empty pages
  - What does extract return for a page with no body content?
  - What does metadata return for a page that redirects to a login?

- [ ] E5. Add request timeout to trial extract/metadata
  - Trial extract and metadata create browser pages but may hang on slow sites
  - Need explicit timeout handling

---

## 6. LANDING PAGE / UX ISSUES

- [ ] F1. Test the "Capture Page" flow end-to-end in a browser
  - Does clicking Capture actually show all 4 tabs?
  - Does the Content tab show markdown?
  - Does the Metadata tab show OG data?
  - Does the PDF tab generate and offer download?

- [ ] F2. Loading states for each tab
  - Content tab should show "Loading..." while extracting
  - Metadata tab should show "Loading..." while fetching
  - PDF tab should show "Generating PDF..." with spinner

- [ ] F3. Error states for each tab
  - What happens if extract fails? Show error in the Content tab
  - What happens if metadata fails? Show error in the Metadata tab

- [ ] F4. The default URL (bbc.com) in the input field — is this still appropriate?
  - Consider changing to a simpler default that loads faster (example.com or news.ycombinator.com)

- [ ] F5. Mobile responsiveness of the landing page
  - Test on 375px width viewport
  - Do tabs wrap properly?
  - Is the code block readable?

---

## 7. SECURITY HARDENING (Remaining)

- [ ] G1. Verify SSRF protection covers ALL URL entry points
  - The trial PDF endpoint (line 191-194) uses dynamic import for checkSsrf — should be static import
  - Verify batch endpoint URLs are all checked

- [ ] G2. Rate limit the /v1/page endpoint more aggressively
  - Unified endpoint is more expensive than individual endpoints (runs multiple extractions)
  - Consider counting it as 2-3 requests against the rate limit

- [ ] G3. Add Content-Security-Policy headers to landing page
  - Prevent XSS if user content leaks into the page

- [ ] G4. Validate proxy URL format more strictly
  - Currently only checks SSRF — should also validate it's a valid proxy format (host:port)

---

## 8. BUILD & DEPLOYMENT

- [ ] H1. Verify Docker build works with new dependencies
  - jsdom, @mozilla/readability, turndown are new — do they build in the slim image?
  - jsdom may need native dependencies (canvas, etc.) — test Docker build

- [ ] H2. Add health check for new endpoints
  - /internal/health should report if extract and metadata services are functional

- [ ] H3. Consider adding startup probe for Cloud Run
  - First request after cold start can take 5-10s while Chromium launches
  - Cloud Run may kill the container before it's ready

---

## 9. DOCUMENTATION & SDK ACCURACY

- [ ] I1. Verify Swagger docs show all new endpoints
  - /v1/extract, /v1/metadata, /v1/page should all appear in /docs
  - Check parameter descriptions are accurate

- [ ] I2. Verify SDK types match actual API responses
  - Node SDK page() returns Record<string, unknown> — should have proper types
  - Python SDK page() returns dict — should document expected shape
  - Go SDK returns json.RawMessage — should have typed struct

- [ ] I3. Update CLAUDE.md to reflect new endpoints and architecture
  - Current CLAUDE.md still references old endpoint list

- [ ] I4. Add JSDoc/comments to new services (extract.ts, metadata.ts)

---

## 10. PERFORMANCE & OPTIMIZATION

- [ ] J1. Benchmark all endpoints with timing
  - Screenshot: target <3s for simple sites, <8s for complex
  - PDF: target <5s
  - Extract: target <3s
  - Metadata: target <2s (lighter operation)
  - Unified: target <5s for screenshot+markdown+metadata

- [ ] J2. Check if extract and metadata can share the same page in /v1/page
  - Currently both run on the same page instance — verify no interference

- [ ] J3. Consider pre-warming browser on startup
  - Create a browser instance during app initialization, not on first request

- [ ] J4. Profile memory usage of the new dependencies
  - jsdom is known to be memory-hungry — check if it leaks in long-running processes

---

## Summary

| Category | Count | Priority |
|----------|-------|----------|
| __name bugs | 7 | CRITICAL |
| Missing route tests | 3 | HIGH |
| Missing service tests | 3 | HIGH |
| Integration tests | 3 | HIGH |
| Error handling | 5 | MEDIUM |
| Landing page UX | 5 | MEDIUM |
| Security | 4 | MEDIUM |
| Build/deploy | 3 | MEDIUM |
| Docs/SDK | 4 | LOW |
| Performance | 4 | LOW |
| **TOTAL** | **41** | |
