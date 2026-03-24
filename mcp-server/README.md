# PageYoink MCP Server

Give AI agents web page access — screenshots, PDFs, markdown, metadata — through a single MCP tool.

## Quick Start

```bash
npx pageyoink-mcp
```

That's it. No API key needed for the free tier (200 captures/month).

## What It Does

This MCP server provides four tools for AI agents:

| Tool | Description |
|------|-------------|
| `web_page` | **Unified tool** — load a URL and get any combination of: screenshot, PDF, markdown, text, HTML, metadata. One page load, multiple outputs. |
| `extract` | Extract clean content from any URL as Markdown. Strips navigation, ads, sidebars. |
| `screenshot` | Take a screenshot of any URL. Returns a PNG image. |
| `metadata` | Get page metadata: title, OG tags, Twitter Cards, word count, links, JSON-LD. |

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pageyoink": {
      "command": "npx",
      "args": ["pageyoink-mcp"]
    }
  }
}
```

## Usage with Cursor / VS Code

Add to your MCP settings:

```json
{
  "pageyoink": {
    "command": "npx",
    "args": ["pageyoink-mcp"]
  }
}
```

## Configuration

Set these environment variables for advanced usage:

| Variable | Default | Description |
|----------|---------|-------------|
| `PAGEYOINK_API_KEY` | (none) | Your API key for higher rate limits |
| `PAGEYOINK_API_URL` | `https://pageyoink-1085551159615.us-east1.run.app` | API endpoint URL |

## Example Agent Conversation

> **User:** What's on the front page of Hacker News right now?
>
> **Agent:** *uses `extract` tool with url "https://news.ycombinator.com"*
>
> Here are the top stories on Hacker News right now:
> 1. Show HN: I built a web page API for AI agents...
> 2. PostgreSQL 18 Released...

> **User:** Take a screenshot of stripe.com and tell me their pricing
>
> **Agent:** *uses `web_page` tool with url "https://stripe.com", outputs ["screenshot", "markdown"]*
>
> Here's what Stripe's homepage looks like: [screenshot]
> Based on the page content, Stripe charges 2.9% + 30c per transaction...

## License

MIT
