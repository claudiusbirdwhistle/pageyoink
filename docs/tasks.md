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
11. [ ] Verify zoom parameter is supported in PDF service (Puppeteer page.pdf scale option)
12. [ ] Add max_pages parameter — limit total pages in output PDF (truncate after N pages)

## UI Polish
13. [x] Collapse PDF options into an expandable "PDF Options" panel (don't overwhelm on first visit)
14. [x] Show sensible defaults in all fields so users understand what the values mean
15. [x] Update the "Clean" label to "Remove Overlays" with subtitle listing what gets removed

## Update SDKs
16. [ ] Make sure that the SKDs accurately reflect the current state of the API

## Research and Ideate
17. [ ] Research the competitive landscape of web to screenshot/PDF services. What features are we missing? Populate the Ice Box of this doc with feature requests. Document which sites you researched.
18. [ ] Research the pricing of the comparison sites in task 17. How should we price our product?

## Ice Box -- Do not do these. Ice box tasks are for human review.