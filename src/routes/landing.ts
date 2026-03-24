import { FastifyInstance } from "fastify";

const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PageYoink — The Web Page API</title>
  <meta name="description" content="One URL, everything you need. Screenshot, PDF, Markdown, metadata — all from a single page load. Clean captures, LLM-ready content, MCP server for AI agents.">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root { --brand: #6366f1; --bg: #0f0f1a; --surface: #1a1a2e; --text: #e0e0f0; --muted: #8888a0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
    a { color: var(--brand); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 900px; margin: 0 auto; padding: 0 24px; }

    header { padding: 80px 0 60px; text-align: center; }
    .logo { font-size: 48px; font-weight: 800; letter-spacing: -1px; }
    .logo span { color: var(--brand); }
    .tagline { font-size: 22px; color: var(--muted); margin-top: 12px; max-width: 600px; margin-left: auto; margin-right: auto; }

    .endpoints { display: grid; gap: 20px; margin: 40px 0; }
    .endpoint { background: var(--surface); border-radius: 12px; padding: 28px; border: 1px solid #2a2a3e; }
    .endpoint h3 { font-size: 18px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
    .method { background: var(--brand); color: white; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-family: monospace; }
    .method.post { background: #10b981; }
    .path { font-family: monospace; color: var(--brand); }
    .endpoint p { color: var(--muted); font-size: 15px; }

    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 60px 0; }
    .feature { background: var(--surface); border-radius: 12px; padding: 24px; border: 1px solid #2a2a3e; }
    .feature h3 { font-size: 16px; margin-bottom: 8px; }
    .feature p { color: var(--muted); font-size: 14px; }

    .code-block { background: #12121f; border-radius: 8px; padding: 20px; font-family: monospace; font-size: 14px; overflow-x: auto; margin: 20px 0; color: #a0a0d0; border: 1px solid #2a2a3e; }
    .code-block .comment { color: #555570; }
    .code-block .string { color: #10b981; }
    .code-block .key { color: #6366f1; }

    .pricing { text-align: center; margin: 60px 0; }
    .pricing h2 { font-size: 32px; margin-bottom: 30px; }
    .tiers { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .tier { background: var(--surface); border-radius: 12px; padding: 28px; border: 1px solid #2a2a3e; text-align: center; }
    .tier.featured { border-color: var(--brand); }
    .tier h3 { font-size: 20px; margin-bottom: 8px; }
    .tier .price { font-size: 36px; font-weight: 800; color: var(--brand); }
    .tier .price span { font-size: 16px; color: var(--muted); font-weight: 400; }
    .tier ul { list-style: none; margin-top: 16px; text-align: left; }
    .tier li { padding: 6px 0; color: var(--muted); font-size: 14px; }
    .tier li::before { content: "\\2713 "; color: var(--brand); }

    footer { text-align: center; padding: 60px 0 40px; color: var(--muted); font-size: 14px; }
    section { margin-bottom: 40px; }
    section h2 { font-size: 28px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">Page<span>Yoink</span></div>
      <p class="tagline">One URL. Screenshot, PDF, markdown, metadata. All from a single page load.</p>
    </header>

    <section>
      <div class="code-block">
        <span class="comment"># One URL, everything you need</span><br>
        curl -X POST "<span class="string">https://api.pageyoink.dev/v1/page</span>" \\<br>
        &nbsp;&nbsp;-H "<span class="key">x-api-key</span>: <span class="string">your-key</span>" \\<br>
        &nbsp;&nbsp;-H "Content-Type: application/json" \\<br>
        &nbsp;&nbsp;-d '{"url":"https://example.com","outputs":["screenshot","markdown","metadata"]}'<br><br>
        <span class="comment"># Or use individual endpoints</span><br>
        curl "<span class="string">https://api.pageyoink.dev/v1/extract?url=https://example.com</span>" <span class="comment"># Markdown</span><br>
        curl "<span class="string">https://api.pageyoink.dev/v1/screenshot?url=https://example.com</span>" <span class="comment"># PNG</span><br>
        curl "<span class="string">https://api.pageyoink.dev/v1/metadata?url=https://example.com</span>" <span class="comment"># JSON</span>
      </div>
    </section>

    <section>
      <h2>Try It Now</h2>
      <p style="color: var(--muted); margin-bottom: 20px;">Paste any URL. See everything. ${`${5}`} free captures per day — no API key needed.</p>
      <div style="display:flex;gap:12px;margin-bottom:12px;">
        <input type="text" id="trial-url" placeholder="https://example.com" value="https://www.bbc.com"
          style="flex:1;padding:12px 16px;border-radius:8px;border:1px solid #2a2a3e;background:var(--surface);color:var(--text);font-size:16px;outline:none;">
      </div>
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px;flex-wrap:wrap;">
        <label style="display:flex;align-items:center;gap:6px;color:var(--muted);font-size:14px;cursor:pointer;">
          <input type="checkbox" id="trial-clean" checked style="accent-color:var(--brand);width:16px;height:16px;">
          Remove Overlays <span style="color:#555;font-size:12px;">(cookie banners, popups, chat widgets)</span>
        </label>
        <div style="display:flex;align-items:center;gap:6px;color:var(--muted);font-size:14px;">
          <span>Ad Block:</span>
          <select id="trial-adblock" style="padding:4px 8px;border-radius:6px;border:1px solid #2a2a3e;background:var(--surface);color:var(--text);font-size:13px;">
            <option value="">Off</option>
            <option value="true">On (network)</option>
            <option value="stealth">Stealth (undetectable)</option>
          </select>
        </div>
      </div>
      <!-- PDF options available via API — keeping demo clean -->
      <div style="display:flex;gap:12px;margin-bottom:20px;">
        <button onclick="captureAll()"
          style="padding:14px 32px;border-radius:8px;border:none;background:var(--brand);color:white;font-weight:700;cursor:pointer;font-size:16px;white-space:nowrap;letter-spacing:0.3px;">Capture Page</button>
      </div>
      <div id="trial-status" style="color:var(--muted);font-size:14px;margin-bottom:12px;"></div>
      <div id="trial-result" style="display:none;">
        <div id="trial-tabs" style="display:flex;gap:0;margin-bottom:0;border-bottom:2px solid #2a2a3e;">
          <button class="trial-tab active" data-tab="screenshot" style="padding:10px 20px;border:none;background:transparent;color:var(--brand);font-weight:600;font-size:14px;cursor:pointer;border-bottom:2px solid var(--brand);margin-bottom:-2px;">Screenshot</button>
          <button class="trial-tab" data-tab="pdf" style="padding:10px 20px;border:none;background:transparent;color:var(--muted);font-weight:600;font-size:14px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;">PDF</button>
          <button class="trial-tab" data-tab="content" style="padding:10px 20px;border:none;background:transparent;color:var(--muted);font-weight:600;font-size:14px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;">Content</button>
          <button class="trial-tab" data-tab="metadata" style="padding:10px 20px;border:none;background:transparent;color:var(--muted);font-weight:600;font-size:14px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;">Metadata</button>
        </div>
        <div style="background:var(--surface);border-radius:0 0 12px 12px;border:1px solid #2a2a3e;border-top:none;padding:16px;">
          <div id="tab-screenshot" class="tab-content" style="text-align:center;">
            <img id="trial-image" style="max-width:100%;border-radius:8px;display:none;">
          </div>
          <div id="tab-pdf" class="tab-content" style="display:none;text-align:center;">
            <a id="trial-pdf-link" style="display:none;color:var(--brand);font-size:18px;font-weight:600;">Download PDF</a>
          </div>
          <div id="tab-content" class="tab-content" style="display:none;">
            <div id="trial-extract" style="max-height:500px;overflow-y:auto;font-size:14px;line-height:1.7;color:var(--text);white-space:pre-wrap;font-family:-apple-system,sans-serif;"></div>
            <div id="trial-extract-meta" style="margin-top:12px;padding-top:12px;border-top:1px solid #2a2a3e;color:var(--muted);font-size:12px;"></div>
          </div>
          <div id="tab-metadata" class="tab-content" style="display:none;">
            <div id="trial-metadata" style="font-size:13px;color:var(--text);"></div>
          </div>
        </div>
      </div>
    </section>
    <script>
      // Tab switching
      document.addEventListener('click', (e) => {
        if (!e.target.classList?.contains('trial-tab')) return;
        const tabName = e.target.dataset.tab;
        activateTab(tabName);

        // PDF tab: generate PDF on first click (lazy)
        if (tabName === 'pdf' && !document.getElementById('trial-pdf-link').href) {
          loadPdf();
        }
      });

      async function loadPdf() {
        const pdfLink = document.getElementById('trial-pdf-link');
        const pdfTab = document.getElementById('tab-pdf');
        pdfTab.textContent = 'Generating PDF...';
        try {
          const clean = document.getElementById('trial-clean').checked;
          let params = 'url=' + encodeURIComponent(capturedUrl);
          if (clean) params += '&clean=true';
          const resp = await fetch('/trial/pdf?' + params);
          if (!resp.ok) { pdfTab.textContent = 'PDF generation failed.'; return; }
          const blob = await resp.blob();
          const objUrl = URL.createObjectURL(blob);
          pdfTab.textContent = '';
          pdfLink.href = objUrl;
          pdfLink.download = 'document.pdf';
          pdfLink.textContent = 'Download PDF (' + (blob.size / 1024 / 1024).toFixed(1) + ' MB)';
          pdfLink.style.display = 'inline-block';
          pdfTab.appendChild(pdfLink);
        } catch(e) { pdfTab.textContent = 'Error: ' + e.message; }
      }

      async function loadExtract(url) {
        const el = document.getElementById('trial-extract');
        const meta = document.getElementById('trial-extract-meta');
        el.textContent = 'Extracting content...';
        try {
          const resp = await fetch('/trial/extract?url=' + encodeURIComponent(url));
          if (!resp.ok) { el.textContent = 'Extraction failed.'; return; }
          const data = await resp.json();
          el.textContent = data.content;
          meta.textContent = data.wordCount + ' words' + (data.author ? ' | By ' + data.author : '') + ' | ' + data.title;
        } catch(e) { el.textContent = 'Error: ' + e.message; }
      }

      async function loadMetadata(url) {
        const el = document.getElementById('trial-metadata');
        el.textContent = 'Loading metadata...';
        try {
          const resp = await fetch('/trial/metadata?url=' + encodeURIComponent(url));
          if (!resp.ok) { el.textContent = 'Metadata extraction failed.'; return; }
          const data = await resp.json();
          // Build metadata display using safe DOM methods
          el.textContent = '';
          const grid = document.createElement('div');
          grid.style.cssText = 'display:grid;grid-template-columns:120px 1fr;gap:8px 16px;';
          const addRow = (label, value) => {
            if (!value) return;
            const lbl = document.createElement('div');
            lbl.style.cssText = 'color:var(--muted);font-weight:600;';
            lbl.textContent = label;
            const val = document.createElement('div');
            val.textContent = String(value);
            grid.appendChild(lbl);
            grid.appendChild(val);
          };
          addRow('Title', data.title);
          addRow('Description', data.description);
          addRow('Language', data.language);
          addRow('OG Title', data.og.title);
          addRow('OG Description', data.og.description);
          addRow('OG Type', data.og.type);
          addRow('Twitter Card', data.twitter.card);
          addRow('Twitter Site', data.twitter.site);
          addRow('Words', data.stats.wordCount);
          addRow('Links', data.stats.linkCount + ' (' + data.stats.internalLinks + ' internal, ' + data.stats.externalLinks + ' external)');
          addRow('Images', data.stats.imageCount);
          addRow('Canonical', data.canonicalUrl);
          if (data.jsonLd) addRow('JSON-LD', data.jsonLd.length + ' item(s)');
          el.appendChild(grid);
          // OG image preview (safe - using DOM methods)
          if (data.og.image) {
            const imgContainer = document.createElement('div');
            imgContainer.style.cssText = 'margin-top:16px;';
            const ogImg = document.createElement('img');
            ogImg.src = data.og.image;
            ogImg.style.cssText = 'max-width:100%;max-height:200px;border-radius:8px;border:1px solid #2a2a3e;';
            ogImg.onerror = () => { ogImg.style.display = 'none'; };
            imgContainer.appendChild(ogImg);
            el.appendChild(imgContainer);
          }
        } catch(e) { el.textContent = 'Error: ' + e.message; }
      }

      let capturedUrl = '';

      async function captureAll() {
        const url = document.getElementById('trial-url').value.trim();
        if (!url) return;
        const clean = document.getElementById('trial-clean').checked;
        const adblock = document.getElementById('trial-adblock').value;
        const status = document.getElementById('trial-status');
        const result = document.getElementById('trial-result');
        const img = document.getElementById('trial-image');
        const pdfLink = document.getElementById('trial-pdf-link');

        status.textContent = 'Capturing page... (this may take a few seconds)';
        result.style.display = 'none';

        // Reset all tab content
        document.getElementById('trial-extract').textContent = '';
        document.getElementById('trial-extract-meta').textContent = '';
        document.getElementById('trial-metadata').textContent = '';
        img.style.display = 'none';
        pdfLink.style.display = 'none';

        const fullUrl = url.match(/^https?:\\/\\//) ? url : 'https://' + url;
        capturedUrl = fullUrl;
        let params = 'url=' + encodeURIComponent(fullUrl);
        if (clean) params += '&clean=true';
        if (adblock) params += '&block_ads=' + adblock;

        try {
          // Take screenshot first (fastest visual feedback)
          const resp = await fetch('/trial/screenshot?' + params);
          const remaining = resp.headers.get('X-Trial-Remaining');
          if (!resp.ok) {
            const err = await resp.json();
            status.textContent = err.error;
            return;
          }
          const blob = await resp.blob();
          const objUrl = URL.createObjectURL(blob);

          // Show results with Screenshot tab active
          result.style.display = 'block';
          img.src = objUrl;
          img.style.display = 'block';

          // Activate screenshot tab
          activateTab('screenshot');
          status.textContent = 'Page captured.' + (remaining ? ' ' + remaining + ' free captures remaining today.' : '') + ' Click tabs to see all outputs.';

          // Start loading content and metadata in the background
          loadExtract(fullUrl);
          loadMetadata(fullUrl);
        } catch(e) {
          status.textContent = 'Error: ' + e.message;
        }
      }

      function activateTab(tabName) {
        document.querySelectorAll('.trial-tab').forEach((t) => {
          t.classList.remove('active');
          t.style.color = 'var(--muted)';
          t.style.borderBottomColor = 'transparent';
        });
        document.querySelectorAll('.tab-content').forEach((c) => { c.style.display = 'none'; });
        const tab = document.querySelector('[data-tab="' + tabName + '"]');
        if (tab) {
          tab.classList.add('active');
          tab.style.color = 'var(--brand)';
          tab.style.borderBottomColor = 'var(--brand)';
        }
        const content = document.getElementById('tab-' + tabName);
        if (content) content.style.display = '';
      }
    </script>

    <section>
      <h2>Endpoints</h2>
      <div class="endpoints">
        <div class="endpoint" style="border-color:var(--brand);">
          <h3><span class="method post">POST</span> <span class="path">/v1/page</span> <span style="color:var(--brand);font-size:12px;font-weight:400;">UNIFIED</span></h3>
          <p>One URL, any combination of outputs: screenshot, PDF, markdown, text, HTML, metadata. All from a single page load.</p>
        </div>
        <div class="endpoint">
          <h3><span class="method">GET</span> <span class="path">/v1/extract</span></h3>
          <p>Extract clean content as Markdown, plain text, or HTML. Powered by Mozilla Readability.</p>
        </div>
        <div class="endpoint">
          <h3><span class="method">GET</span> <span class="path">/v1/metadata</span></h3>
          <p>Page metadata: title, OG tags, Twitter Cards, favicon, JSON-LD, word count, link count.</p>
        </div>
        <div class="endpoint">
          <h3><span class="method">GET</span> <span class="path">/v1/screenshot</span></h3>
          <p>Capture any URL as PNG or JPEG. Viewport, full-page, retina, clean mode, ad blocking.</p>
        </div>
        <div class="endpoint">
          <h3><span class="method">GET</span> <span class="path">/v1/pdf</span></h3>
          <p>Convert any URL to PDF. Page size, landscape, margins, headers/footers, watermarks.</p>
        </div>
        <div class="endpoint">
          <h3><span class="method post">POST</span> <span class="path">/v1/batch</span></h3>
          <p>Process up to 50 URLs at once with webhook delivery when complete.</p>
        </div>
      </div>
    </section>

    <section>
      <h2>For AI Agents</h2>
      <div class="code-block">
        <span class="comment"># Give any AI agent web access in one line</span><br>
        npx pageyoink-mcp<br><br>
        <span class="comment"># Tools available: web_page, screenshot, extract, metadata</span><br>
        <span class="comment"># Works with Claude Desktop, Cursor, VS Code, and any MCP client</span>
      </div>
    </section>

    <section>
      <h2>What Makes PageYoink Different</h2>
      <div class="features">
        <div class="feature">
          <h3>One Page Load, All Outputs</h3>
          <p>Screenshot + PDF + Markdown + Metadata from a single browser session. Faster and cheaper than calling separate APIs.</p>
        </div>
        <div class="feature">
          <h3>Clean Captures</h3>
          <p>4-phase detection removes cookie banners, chat widgets, fundraising popups, and overlays automatically.</p>
        </div>
        <div class="feature">
          <h3>LLM-Ready Markdown</h3>
          <p>Extract clean content with Mozilla Readability. Headings, links, tables, code blocks preserved. Perfect for RAG pipelines.</p>
        </div>
        <div class="feature">
          <h3>MCP Server</h3>
          <p>Give any AI agent web access with one command: npx pageyoink-mcp. Works with Claude, Cursor, and any MCP client.</p>
        </div>
        <div class="feature">
          <h3>All Outputs Included</h3>
          <p>Every pricing tier includes every output type. No credit multipliers, no per-feature surcharges.</p>
        </div>
        <div class="feature">
          <h3>Developer First</h3>
          <p>Clean REST API, Swagger docs, SDKs in Node.js, Python, and Go. From zero to first capture in 60 seconds.</p>
        </div>
      </div>
    </section>

    <section class="pricing">
      <h2>Pricing</h2>
      <p style="color:var(--muted);text-align:center;margin-bottom:30px;">One page capture = one browser load = any combination of outputs. No credit multipliers.</p>
      <div class="tiers">
        <div class="tier">
          <h3>Free</h3>
          <div class="price">$0<span>/mo</span></div>
          <ul>
            <li>200 captures/month</li>
            <li>All outputs included</li>
            <li>Clean mode</li>
            <li>MCP server access</li>
          </ul>
        </div>
        <div class="tier">
          <h3>Builder</h3>
          <div class="price">$12<span>/mo</span></div>
          <ul>
            <li>5,000 captures/month</li>
            <li>All outputs included</li>
            <li>Batch processing</li>
            <li>Visual diff</li>
          </ul>
        </div>
        <div class="tier featured">
          <h3>Pro</h3>
          <div class="price">$39<span>/mo</span></div>
          <ul>
            <li>25,000 captures/month</li>
            <li>All outputs included</li>
            <li>Priority rendering</li>
            <li>Webhooks</li>
            <li>Priority support</li>
          </ul>
        </div>
        <div class="tier">
          <h3>Scale</h3>
          <div class="price">$99<span>/mo</span></div>
          <ul>
            <li>100,000 captures/month</li>
            <li>All outputs included</li>
            <li>Custom concurrency</li>
            <li>SLA guarantee</li>
            <li>Dedicated support</li>
          </ul>
        </div>
      </div>
    </section>

    <footer>
      <p>PageYoink &mdash; One URL. Everything you need.</p>
      <p style="margin-top:8px;font-size:12px;"><a href="/docs">API Docs</a></p>
    </footer>
  </div>
</body>
</html>`;

export async function landingRoute(app: FastifyInstance) {
  app.get("/", async (_request, reply) => {
    return reply.header("Content-Type", "text/html").send(LANDING_HTML);
  });
}
