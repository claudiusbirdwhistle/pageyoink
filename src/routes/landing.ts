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
      <details id="pdf-options-panel" style="margin-bottom:16px;background:var(--surface);border-radius:8px;border:1px solid #2a2a3e;padding:0;">
        <summary style="padding:12px 16px;cursor:pointer;color:var(--muted);font-size:14px;font-weight:600;list-style:none;display:flex;align-items:center;gap:8px;">
          <span style="transition:transform 0.2s;display:inline-block;" id="pdf-chevron">&#9654;</span> PDF Options
        </summary>
        <div style="padding:0 16px 16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label style="color:var(--muted);font-size:12px;display:block;margin-bottom:4px;">Page Size</label>
            <select id="pdf-format" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #2a2a3e;background:var(--bg);color:var(--text);font-size:13px;">
              <option value="A4" selected>A4</option>
              <option value="Letter">Letter</option>
              <option value="Legal">Legal</option>
              <option value="A3">A3</option>
            </select>
          </div>
          <div>
            <label style="color:var(--muted);font-size:12px;display:block;margin-bottom:4px;">Orientation</label>
            <select id="pdf-orientation" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #2a2a3e;background:var(--bg);color:var(--text);font-size:13px;">
              <option value="portrait" selected>Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
          <div style="grid-column:1/-1;">
            <label style="color:var(--muted);font-size:12px;display:block;margin-bottom:4px;">Margins <span style="color:#555;">(e.g. 0.5in, 10mm, 1cm)</span></label>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;">
              <input type="text" id="pdf-margin-top" placeholder="0.5in" style="padding:6px 8px;border-radius:6px;border:1px solid #2a2a3e;background:var(--bg);color:var(--text);font-size:13px;">
              <input type="text" id="pdf-margin-right" placeholder="0.5in" style="padding:6px 8px;border-radius:6px;border:1px solid #2a2a3e;background:var(--bg);color:var(--text);font-size:13px;">
              <input type="text" id="pdf-margin-bottom" placeholder="0.5in" style="padding:6px 8px;border-radius:6px;border:1px solid #2a2a3e;background:var(--bg);color:var(--text);font-size:13px;">
              <input type="text" id="pdf-margin-left" placeholder="0.5in" style="padding:6px 8px;border-radius:6px;border:1px solid #2a2a3e;background:var(--bg);color:var(--text);font-size:13px;">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-top:2px;">
              <span style="color:#555;font-size:11px;text-align:center;">Top</span>
              <span style="color:#555;font-size:11px;text-align:center;">Right</span>
              <span style="color:#555;font-size:11px;text-align:center;">Bottom</span>
              <span style="color:#555;font-size:11px;text-align:center;">Left</span>
            </div>
          </div>
          <div style="grid-column:1/-1;">
            <label style="color:var(--muted);font-size:12px;display:block;margin-bottom:4px;">Header Template <span style="color:#555;">(HTML — use <span style="font-family:monospace;font-size:11px;">pageNumber, totalPages, date, title, url</span> classes)</span></label>
            <input type="text" id="pdf-header" placeholder='<div style="font-size:10px;text-align:center;width:100%;"><span class="title"></span></div>' style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #2a2a3e;background:var(--bg);color:var(--text);font-size:13px;">
          </div>
          <div style="grid-column:1/-1;">
            <label style="color:var(--muted);font-size:12px;display:block;margin-bottom:4px;">Footer Template <span style="color:#555;">(same variables as header)</span></label>
            <input type="text" id="pdf-footer" placeholder='<div style="font-size:10px;text-align:center;width:100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>' style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #2a2a3e;background:var(--bg);color:var(--text);font-size:13px;">
          </div>
          <div>
            <label style="color:var(--muted);font-size:12px;display:block;margin-bottom:4px;">Watermark Text</label>
            <input type="text" id="pdf-watermark" placeholder="DRAFT" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #2a2a3e;background:var(--bg);color:var(--text);font-size:13px;">
          </div>
          <div>
            <label style="color:var(--muted);font-size:12px;display:block;margin-bottom:4px;">Watermark Position</label>
            <select id="pdf-watermark-pos" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #2a2a3e;background:var(--bg);color:var(--text);font-size:13px;">
              <option value="center" selected>Center</option>
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>
          <div>
            <label style="color:var(--muted);font-size:12px;display:block;margin-bottom:4px;">Page Ranges <span style="color:#555;">(e.g. 1-3, 1,3,5)</span></label>
            <input type="text" id="pdf-pages" placeholder="All pages" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #2a2a3e;background:var(--bg);color:var(--text);font-size:13px;">
          </div>
          <div>
            <label style="color:var(--muted);font-size:12px;display:block;margin-bottom:4px;">Viewport Width <span style="color:#555;">(px)</span></label>
            <input type="number" id="pdf-width" placeholder="1280" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #2a2a3e;background:var(--bg);color:var(--text);font-size:13px;">
          </div>
        </div>
      </details>
      <script>
        document.getElementById('pdf-options-panel').addEventListener('toggle', (e) => {
          document.getElementById('pdf-chevron').style.transform = e.target.open ? 'rotate(90deg)' : '';
        });
      </script>
      <div style="display:flex;gap:12px;margin-bottom:20px;">
        <button onclick="trialCapture('screenshot')"
          style="padding:12px 24px;border-radius:8px;border:none;background:var(--brand);color:white;font-weight:600;cursor:pointer;font-size:14px;white-space:nowrap;">Screenshot</button>
        <button onclick="trialCapture('pdf')"
          style="padding:12px 24px;border-radius:8px;border:none;background:#10b981;color:white;font-weight:600;cursor:pointer;font-size:14px;white-space:nowrap;">PDF</button>
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
        document.querySelectorAll('.trial-tab').forEach((t) => {
          t.classList.remove('active');
          t.style.color = 'var(--muted)';
          t.style.borderBottomColor = 'transparent';
        });
        e.target.classList.add('active');
        e.target.style.color = 'var(--brand)';
        e.target.style.borderBottomColor = 'var(--brand)';
        document.querySelectorAll('.tab-content').forEach((c) => { c.style.display = 'none'; });
        const tabId = 'tab-' + e.target.dataset.tab;
        const tab = document.getElementById(tabId);
        if (tab) tab.style.display = '';

        // Lazy-load content/metadata tabs on first click
        const rawUrl = document.getElementById('trial-url').value.trim();
        const fullUrl = rawUrl.match(/^https?:\\/\\//) ? rawUrl : 'https://' + rawUrl;
        if (e.target.dataset.tab === 'content' && !document.getElementById('trial-extract').textContent) {
          loadExtract(fullUrl);
        }
        if (e.target.dataset.tab === 'metadata' && !document.getElementById('trial-metadata').textContent) {
          loadMetadata(fullUrl);
        }
      });

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

      async function trialCapture(type) {
        const url = document.getElementById('trial-url').value.trim();
        if (!url) return;
        const clean = document.getElementById('trial-clean').checked;
        const adblock = document.getElementById('trial-adblock').value;
        const status = document.getElementById('trial-status');
        const result = document.getElementById('trial-result');
        const img = document.getElementById('trial-image');
        const pdfLink = document.getElementById('trial-pdf-link');
        status.textContent = 'Capturing... (this may take a few seconds)';
        result.style.display = 'none';
        // Reset tab content for new URL
        document.getElementById('trial-extract').textContent = '';
        document.getElementById('trial-extract-meta').textContent = '';
        document.getElementById('trial-metadata').textContent = '';
        img.style.display = 'none';
        pdfLink.style.display = 'none';
        const fullUrl = url.match(/^https?:\\/\\//) ? url : 'https://' + url;
        let params = 'url=' + encodeURIComponent(fullUrl);
        if (clean) params += '&clean=true';
        if (adblock) params += '&block_ads=' + adblock;
        if (type === 'pdf') {
          const fmt = document.getElementById('pdf-format').value;
          if (fmt !== 'A4') params += '&format=' + fmt;
          const orient = document.getElementById('pdf-orientation').value;
          if (orient === 'landscape') params += '&landscape=true';
          const mt = document.getElementById('pdf-margin-top').value.trim();
          const mr = document.getElementById('pdf-margin-right').value.trim();
          const mb = document.getElementById('pdf-margin-bottom').value.trim();
          const ml = document.getElementById('pdf-margin-left').value.trim();
          if (mt) params += '&margin_top=' + encodeURIComponent(mt);
          if (mr) params += '&margin_right=' + encodeURIComponent(mr);
          if (mb) params += '&margin_bottom=' + encodeURIComponent(mb);
          if (ml) params += '&margin_left=' + encodeURIComponent(ml);
          const header = document.getElementById('pdf-header').value.trim();
          const footer = document.getElementById('pdf-footer').value.trim();
          if (header) params += '&header_template=' + encodeURIComponent(header);
          if (footer) params += '&footer_template=' + encodeURIComponent(footer);
          const watermark = document.getElementById('pdf-watermark').value.trim();
          if (watermark) {
            params += '&watermark=' + encodeURIComponent(watermark);
            params += '&watermark_position=' + document.getElementById('pdf-watermark-pos').value;
          }
          const pages = document.getElementById('pdf-pages').value.trim();
          if (pages) params += '&page_ranges=' + encodeURIComponent(pages);
          const width = document.getElementById('pdf-width').value.trim();
          if (width) params += '&width=' + width;
        }
        try {
          const resp = await fetch('/trial/' + type + '?' + params);
          const remaining = resp.headers.get('X-Trial-Remaining');
          if (!resp.ok) {
            const err = await resp.json();
            status.textContent = err.error;
            return;
          }
          const blob = await resp.blob();
          const objUrl = URL.createObjectURL(blob);
          result.style.display = 'block';
          // Show appropriate tab
          document.querySelectorAll('.trial-tab').forEach((t) => {
            t.classList.remove('active');
            t.style.color = 'var(--muted)';
            t.style.borderBottomColor = 'transparent';
          });
          document.querySelectorAll('.tab-content').forEach((c) => { c.style.display = 'none'; });
          if (type === 'screenshot') {
            img.src = objUrl;
            img.style.display = 'block';
            document.getElementById('tab-screenshot').style.display = '';
            const ssTab = document.querySelector('[data-tab="screenshot"]');
            ssTab.classList.add('active');
            ssTab.style.color = 'var(--brand)';
            ssTab.style.borderBottomColor = 'var(--brand)';
            status.textContent = 'Screenshot captured.' + (remaining ? ' ' + remaining + ' free captures remaining today.' : '');
          } else {
            pdfLink.href = objUrl;
            pdfLink.download = 'document.pdf';
            pdfLink.textContent = 'Download PDF';
            pdfLink.style.display = 'inline-block';
            document.getElementById('tab-pdf').style.display = '';
            const pdfTab = document.querySelector('[data-tab="pdf"]');
            pdfTab.classList.add('active');
            pdfTab.style.color = 'var(--brand)';
            pdfTab.style.borderBottomColor = 'var(--brand)';
            status.textContent = 'PDF generated.' + (remaining ? ' ' + remaining + ' free captures remaining today.' : '');
          }
        } catch(e) {
          status.textContent = 'Error: ' + e.message;
        }
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
