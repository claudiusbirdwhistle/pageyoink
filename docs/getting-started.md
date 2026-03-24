# Getting Started with PageYoink

From zero to your first API call in 60 seconds.

## 1. Try It Instantly (No Signup)

Paste any URL into the demo at [pageyoink-1085551159615.us-east1.run.app](https://pageyoink-1085551159615.us-east1.run.app) — 5 free captures per day, no API key needed.

## 2. Quick API Call

### Extract Markdown (one line)
```bash
curl "https://pageyoink-1085551159615.us-east1.run.app/v1/extract?url=https://example.com"
```

### Take a Screenshot
```bash
curl -o screenshot.png "https://pageyoink-1085551159615.us-east1.run.app/v1/screenshot?url=https://example.com"
```

### Generate a PDF
```bash
curl -o document.pdf "https://pageyoink-1085551159615.us-east1.run.app/v1/pdf?url=https://example.com"
```

### Get Page Metadata
```bash
curl "https://pageyoink-1085551159615.us-east1.run.app/v1/metadata?url=https://example.com"
```

### Unified Endpoint (Everything at Once)
```bash
curl -X POST "https://pageyoink-1085551159615.us-east1.run.app/v1/page" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","outputs":["screenshot","markdown","metadata"]}'
```

## 3. Using SDKs

### Node.js
```javascript
import PageYoink from "pageyoink";

const client = new PageYoink({ apiKey: "your-key" });

// Extract markdown
const { content, wordCount } = await client.extract("https://example.com");

// Screenshot
const png = await client.screenshot({ url: "https://example.com", clean: true });

// Everything at once
const result = await client.page("https://example.com", {
  outputs: ["screenshot", "markdown", "metadata"],
});
```

### Python
```python
from pageyoink import PageYoink

client = PageYoink(api_key="your-key")

# Extract markdown
result = client.extract("https://example.com")
print(result["content"])

# Screenshot
png = client.screenshot("https://example.com", clean=True)
with open("screenshot.png", "wb") as f:
    f.write(png)

# Everything at once
result = client.page("https://example.com", outputs=["screenshot", "markdown", "metadata"])
```

### curl
```bash
# With API key
curl "https://pageyoink-1085551159615.us-east1.run.app/v1/extract?url=https://example.com" \
  -H "x-api-key: your-key"
```

## 4. For AI Agents (MCP)

```bash
npx pageyoink-mcp
```

Add to Claude Desktop `claude_desktop_config.json`:
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

## 5. Interactive Docs

Full API reference with try-it-out functionality: [/docs](https://pageyoink-1085551159615.us-east1.run.app/docs)
