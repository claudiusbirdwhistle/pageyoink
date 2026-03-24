# Introducing PageYoink — The Web Page API for AI Agents

**TL;DR:** PageYoink takes a URL and returns whatever you need — screenshot, PDF, Markdown, metadata — all from a single page load. One API, one bill, all outputs included at every pricing tier.

## The Problem

Building AI agents that interact with the web? You probably need:
- **Firecrawl** for Markdown extraction ($16/mo minimum)
- **ScreenshotOne** for screenshots ($17/mo)
- **DocRaptor** for PDFs (another subscription)
- Plus something for OG tags, meta analysis...

That's 3-4 separate services, 3-4 API keys, 3-4 bills, and 3-4 browser sessions for the same URL.

## The Solution

PageYoink loads the page **once** and returns everything:

```bash
curl -X POST "https://api.pageyoink.dev/v1/page" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://nytimes.com",
    "outputs": ["screenshot", "markdown", "metadata"]
  }'
```

One request. One page load. Screenshot + Markdown + Metadata.

## What Makes It Different

**1. Single Page Load Efficiency**
Other tools load the page separately for each output type. We load it once and extract everything from that session. Faster. Cheaper. Less load on target sites.

**2. LLM-Ready Markdown**
Powered by Mozilla Readability — the same engine behind Firefox Reader View. Strips navigation, ads, and sidebars. Preserves headings, links, tables, and code blocks.

**3. Clean Captures**
Our 4-phase clean mode auto-removes cookie banners, chat widgets (Intercom, Drift, HubSpot, etc.), fundraising popups, and newsletter overlays. No CSS selectors needed.

**4. MCP Server for AI Agents**
```bash
npx pageyoink-mcp
```
One command. Your AI agent (Claude, Cursor, any MCP client) can now read, see, and save web pages.

**5. All Outputs Included**
Every pricing tier includes every output type. No credit multipliers. No per-feature surcharges. One page capture = one price, regardless of what you extract.

## Pricing

- **Free:** 200 captures/month
- **Builder:** $12/mo — 5,000 captures
- **Pro:** $39/mo — 25,000 captures
- **Scale:** $99/mo — 100,000 captures

Compare: Firecrawl charges $83/mo for 100K pages (markdown only, no screenshots/PDFs). PageYoink gives you everything for $99/mo.

## Try It Now

Visit [pageyoink.dev](https://pageyoink-1085551159615.us-east1.run.app) and paste any URL. See the screenshot, PDF, content, and metadata tabs — all from a single page load.

No signup needed. 5 free captures per day.

## Links

- **Demo:** [pageyoink.dev](https://pageyoink-1085551159615.us-east1.run.app)
- **API Docs:** [pageyoink.dev/docs](https://pageyoink-1085551159615.us-east1.run.app/docs)
- **MCP Server:** `npx pageyoink-mcp`
- **GitHub:** [github.com/claudiusbirdwhistle/pageyoink](https://github.com/claudiusbirdwhistle/pageyoink)
