# Decision Log

## 2026-03-22: Product — Screenshot and PDF API

**Context:** Needed to identify a product that can be built and operated entirely by an autonomous AI agent with high probability of generating revenue.

**Decision:** Build an API service that converts URLs/HTML to screenshots (PNG/JPEG) and PDFs.

**Rationale:** Market research showed 6+ profitable solo-founder businesses in this exact space (URL2PNG at $1-5M/yr, ApiFlash at $79.7K/yr, PDFShift at $9K MRR, ScreenshotAPI acquired and grew 10x). The technology is well-understood (headless Chrome/Puppeteer), infrastructure costs are low, and distribution channels exist (RapidAPI marketplace).

**Alternatives considered:**
- Web scraping + AI data extraction — higher technical risk
- Dynamic OG image generation only — too narrow (OG images were later added then removed as too basic vs Bannerbear)
- Affiliate/SEO content site — revenue takes months, depends on Google

**Status:** Active

---

## 2026-03-22: Architecture — Self-Documenting Repo as Agent Memory

**Context:** Claude operates in Ralph Loop cycles with no persistent memory between cycles.

**Decision:** Use the repository itself as the memory system. All state, plans, decisions, and operational procedures live in markdown files within `docs/`.

**Rationale:** Files in the repo are the only persistent state Claude can both read and write reliably.

**Status:** Active

---

## 2026-03-22: Clean Mode — 4-Phase Detection

**Context:** Selector-only blocklists failed on sites with custom cookie implementations (HubSpot).

**Decision:** 4-phase detection: selector blocklist → text-content scanning → z-index overlay → backdrop removal. Also detects fundraising popups (Wikipedia, Guardian) via text scanning.

**Rationale:** Phase 2 (text scanning) catches custom implementations that no blocklist covers. Verified on HubSpot, BBC, Intercom.

**Status:** Active

---

## 2026-03-22: Phase F — Competitive Parity Before Launch

**Context:** Competitive analysis revealed gaps vs ScreenshotAPI, ApiFlash, PDFShift, Restpack.

**Decision:** Add CSS/JS injection, custom headers/cookies, element capture, ad blocking, caching, proxy support, geolocation before launch.

**Status:** Complete — all Phase F items shipped.

---

## 2026-03-22: PDF Carousel Rendering — Accepted Limitation

**Context:** BBC carousel images don't render in Chrome's PDF output.

**Decision:** Accept as Chromium limitation. Added targeted print-fix.ts that forces overflow:visible on horizontal scroll containers. Partially mitigates but doesn't fully solve.

**Status:** Active — partial mitigation in place

---

## 2026-03-22: OG Image Feature — Removed

**Context:** OG image generation was added as a differentiator but was too basic (4 hardcoded templates) compared to dedicated services like Bannerbear ($49-199/mo with full design tool capabilities).

**Decision:** Remove entirely rather than ship a half-baked feature that hurts credibility.

**Rationale:** "If their OG image feature is this shallow, what else is half-baked?" Better to do fewer things well.

**Status:** Removed (2026-03-23)

---

## 2026-03-23: Stealth Ad Blocking

**Context:** Sites like The Guardian, Forbes, and Wired detect network-level ad blockers and show login walls or degraded content.

**Decision:** Add `block_ads=stealth` mode that lets all network requests through (undetectable), then moves ad elements offscreen after page load. 3-phase detection: selector-based, iframe-src-based, IAB size heuristic.

**Rationale:** Uses `position: absolute; left: -9999px` instead of `display: none` to preserve element dimensions and fool detection scripts. No competitor offers this.

**Status:** Active

---

## 2026-03-23: Google Cloud Run Deployment

**Context:** Needed serverless hosting with scale-to-zero to minimize costs while finding customers. Budget: $50-100/month.

**Decision:** Deploy on Google Cloud Run with Firestore for persistence. Replaced SQLite with Firestore, filesystem cache with in-memory cache.

**Rationale:** Cloud Run scales to zero (no cost when idle), runs our existing Dockerfile, and GCP free tier covers early usage ($300 free credits). Cost at low volume: near $0. Cost at 100K requests/month: ~$24. Railway/Render would cost $40-60/month always-on regardless of traffic.

**Alternatives considered:**
- AWS Lambda — cheapest per-request but requires significant code changes (different Chromium build, DynamoDB, Lambda handler)
- Railway — simplest but $40-60/month always-on even with zero traffic
- DigitalOcean — serverless options too limited (1GB RAM max, 1-min timeout)

**Status:** Active — deployed at https://pageyoink-1085551159615.us-east1.run.app

---

## 2026-03-23: Performance — load + delay over networkidle2

**Context:** Captures were taking 8-20 seconds. Profiling showed `networkidle2` adds 5-15 seconds waiting for analytics, ads, and tracking pixels that don't affect visual quality.

**Decision:** Switch default from `networkidle2` to `load` event + 1 second render delay. `smart_wait` available for sites that need comprehensive readiness detection.

**Benchmark:**
- networkidle2: 6,148ms
- load + 1s: 1,709ms
- Quality difference: minimal

**Status:** Active

---

## 2026-03-23: Smart Wait — Network + DOM Two-Phase Stability

**Context:** Original smart wait only tracked DOM mutations, missing pending network requests. Could resolve prematurely during a loading spinner before async data loads.

**Decision:** Track in-flight network requests via Puppeteer's request events + DOM mutations. Two-phase stability: if quiet is interrupted by new activity, timer resets. Only resolves after sustained quiet (500ms) across all signals simultaneously.

**Status:** Active
