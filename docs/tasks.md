# Task List

## Screenshot Options
1. [x] Remove Smart Wait checkbox from trial UI (keep as API-only advanced option)
2. [x] Rename "Clean" to "Remove Overlays" with subtitle listing what it removes

## PDF Options — Add to Trial UI
3. [x] Page size dropdown (A4, Letter, Legal, A3)
4. [x] Orientation toggle (Portrait / Landscape)
5. [x] Margins inputs (top, right, bottom, left — with CSS unit examples)
6. [x] Header template text input (supports pageNumber, totalPages, date, title, url)
7. [x] Footer template text input (same variables)
8. [x] Watermark text input + position dropdown (center, top-left, top-right, bottom-left, bottom-right)
9. [x] Page ranges input (e.g., "1-3", "1,3,5")
10. [x] Viewport width/height inputs for browser rendering size

## PDF Options — Expose via API (if not already)
11. [x] Add scale/zoom parameter to PDF service (Puppeteer page.pdf scale option, 0.1-2.0)
12. [x] Add max_pages parameter — truncates output PDF after N pages using pdf-lib

## UI Polish
13. [x] Collapse PDF options into an expandable "PDF Options" panel (don't overwhelm on first visit)
14. [x] Show sensible defaults in all fields so users understand what the values mean
15. [x] Update the "Clean" label to "Remove Overlays" with subtitle listing what gets removed

## Update SDKs
16. [x] Update SDKs with scale and maxPages parameters (Node.js, Python, Go)

## Research and Ideate
17. [x] Research competitive landscape — analyzed 13 competitors, updated docs/competitive-analysis.md
18. [x] Research pricing — PageYoink offers most requests/dollar at $29/$79 tiers; pricing is competitive

## Ice Box -- Do not do these. Ice box tasks are for human review.
- [ ] WebP output format (easy — Puppeteer supports natively, 25-34% smaller than PNG)
- [ ] Video capture (MP4/GIF scrolling — complex, competitors charge premium for this)
- [ ] CDN-based caching (Cloudflare/similar — survives scale-to-zero, currently in-memory only)
- [ ] Anti-bot stealth mode (puppeteer-extra stealth plugin — needed for Cloudflare-protected sites)
- [ ] AI content extraction (emerging differentiator — CaptureKit is only competitor with this)
- [ ] MCP server integration (developer tool integration — PageBolt has this)
- [ ] PDF encryption (needs native qpdf binary)