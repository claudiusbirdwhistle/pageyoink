# Decision Log

## 2026-03-22: Product — Screenshot, PDF, and OG Image API

**Context:** Needed to identify a product that can be built and operated entirely by an autonomous AI agent with high probability of generating revenue.

**Decision:** Build an API service that converts URLs/HTML to screenshots (PNG/JPEG), PDFs, and OG images.

**Rationale:** Market research showed 6+ profitable solo-founder businesses in this exact space (URL2PNG at $1-5M/yr, ApiFlash at $79.7K/yr, PDFShift at $9K MRR, ScreenshotAPI acquired and grew 10x). The technology is well-understood (headless Chrome/Puppeteer), infrastructure costs are low ($30-50/month), and distribution channels exist (RapidAPI marketplace). Differentiation through intelligent features (auto-popup removal, smart readiness detection, content-aware pagination) is technically feasible.

**Alternatives considered:**
- Web scraping + AI data extraction — higher technical risk, anti-bot arms race
- Dynamic OG image generation only — too narrow, Bannerbear dominates
- Affiliate/SEO content site — revenue takes 2-4 months, depends on Google
- Digital product storefront — requires marketing/audience we don't have

**Status:** Active

---

## 2026-03-22: Architecture — Self-Documenting Repo as Agent Memory

**Context:** Claude operates in Ralph Loop cycles with no persistent memory between cycles. Each cycle starts with a fresh context window.

**Decision:** Use the repository itself as the memory system. All state, plans, decisions, and operational procedures live in markdown files within `docs/`. Every cycle begins by reading these files for orientation.

**Rationale:** Files in the repo are the only persistent state Claude can both read and write reliably. External systems (databases, dashboards) require credentials and may not be accessible. The repo is always available, version-controlled, and auditable.

**Alternatives considered:**
- Claude's memory system (~/.claude/memory/) — useful for cross-project knowledge but not granular enough for operational state
- External task tracker (Linear, GitHub Issues) — requires API access and credentials; adds complexity
- Database-backed state — over-engineered for this purpose; repo files are simpler and human-readable

**Status:** Active

---

## 2026-03-22: Clean Mode — 4-Phase Detection Over Blocklist-Only

**Context:** Initial clean mode used only CSS selector blocklists to remove cookie banners and chat widgets. Real-world testing against HubSpot revealed this failed — HubSpot uses a custom cookie implementation (`#hs-eu-cookie-confirmation`) and its own chat widget markup that our blocklist didn't cover. The chat widget was also too small to trigger the z-index heuristic.

**Decision:** Implement 4-phase detection:
1. Selector-based (expanded blocklist)
2. Text-content scanning (find fixed/sticky elements containing "cookie"+"accept"/"decline")
3. Z-index overlay detection (now includes full-width banners >90% viewport width)
4. Backdrop detection (semi-transparent full-viewport overlays)

**Rationale:** Phase 2 (text scanning) catches custom implementations that no blocklist can anticipate. Competitors (ScreenshotAPI, ApiFlash, Restpack) only use selector-based approaches. This is a genuine differentiator — verified working on HubSpot where selector-only approaches fail.

**Alternatives considered:**
- Blocklist-only (like competitors) — fails on custom implementations
- AI-based visual detection — too slow and expensive per request
- "Click accept" approach — fragile, language-dependent, and modifies cookie state

**Status:** Active

---

## 2026-03-22: Phase F — Competitive Parity Before Launch

**Context:** Competitive analysis against ScreenshotAPI, ApiFlash, PDFShift, URL2PNG, and Restpack revealed that PageYoink lacks CSS/JS injection, custom headers/cookies, and element capture — features every serious competitor offers. Launching without these would make us a weaker option for any developer evaluating alternatives.

**Decision:** Add a new "Phase F: Competitive Parity" before public launch. Priority: CSS/JS injection and custom headers/cookies first, element capture and caching second.

**Rationale:** CSS/JS injection is the #1 most-used feature across competitors for handling edge cases (custom popups, authenticated pages, visual tweaks). Custom headers/cookies are required for capturing authenticated or paywalled content. Without these, we cannot serve a significant segment of the market.

**Alternatives considered:**
- Launch without these and add later — risks bad first impressions and negative RapidAPI reviews
- Build everything from the icebox first — over-engineering before we have customers

**Status:** Active

---

## 2026-03-22: PDF Carousel Rendering — Accepted Limitation

**Context:** BBC's "Weekend Reads" horizontal carousel renders images on screen but not in Chrome's PDF output. The images have valid `src` attributes and load successfully, but Chrome's print/PDF renderer doesn't paint them in certain CSS carousel layouts.

**Decision:** Accept this as a Chromium limitation. Document it. Plan to add print-mode CSS injection (Phase F) that auto-converts horizontal scroll containers to wrapped layouts as a mitigation.

**Rationale:** This affects ALL Chromium-based PDF tools, not just PageYoink. Trying to work around it at the application level would mean compositing screenshots instead of using Chrome's built-in PDF renderer — a fundamental architecture change that isn't justified for an edge case.

**Alternatives considered:**
- Screenshot-based PDF composition — much higher complexity, loses text selectability
- Force-scroll within carousel before capture — doesn't help, the images load but Chrome doesn't render them in print mode

**Status:** Active
