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
