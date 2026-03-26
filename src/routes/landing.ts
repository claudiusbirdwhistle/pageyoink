import { FastifyInstance } from "fastify";

const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PageYoink — The Web Page API</title>
  <meta name="description" content="One URL, everything you need. Screenshot, PDF, Markdown, metadata — all from a single page load. Clean captures, LLM-ready content, MCP server for AI agents.">
  <meta property="og:title" content="PageYoink — The Web Page API">
  <meta property="og:description" content="One URL, everything you need. Screenshot, PDF, Markdown, metadata from a single page load.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://pageyoink.dev">
  <meta property="og:image" content="https://pageyoink-1085551159615.us-east1.run.app/v1/screenshot?url=https://pageyoink-1085551159615.us-east1.run.app">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="PageYoink — The Web Page API">
  <meta name="twitter:description" content="One URL, everything you need. Screenshot, PDF, Markdown, metadata from a single page load.">
  <meta name="twitter:image" content="https://pageyoink-1085551159615.us-east1.run.app/v1/screenshot?url=https://pageyoink-1085551159615.us-east1.run.app">
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

    /* C15: Mobile responsive */
    @media (max-width: 480px) {
      .logo { font-size: 32px; }
      .tagline { font-size: 18px; }
      header { padding: 40px 0 30px; }
      .container { padding: 0 16px; }
      section h2 { font-size: 22px; }
      #trial-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .trial-tab { padding: 8px 14px !important; font-size: 13px !important; white-space: nowrap; }
      .tiers { grid-template-columns: 1fr; }
      .features { grid-template-columns: 1fr; }
    }

    /* C17: Tab switch animation */
    .tab-content { animation: fadeIn 0.2s ease-in; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* C10: How it works */
    .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin: 24px 0; }
    .step { text-align: center; padding: 24px; }
    .step-number { width: 48px; height: 48px; border-radius: 50%; background: var(--brand); color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; margin-bottom: 12px; }
    .step h3 { font-size: 16px; margin-bottom: 6px; }
    .step p { color: var(--muted); font-size: 14px; }

    /* C11: Use cases */
    .use-cases { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 24px 0; }
    .use-case { background: var(--surface); border-radius: 12px; padding: 24px; border: 1px solid #2a2a3e; }
    .use-case h3 { font-size: 16px; margin-bottom: 8px; color: var(--brand); }
    .use-case p { color: var(--muted); font-size: 14px; }

    /* C12: FAQ */
    .faq { margin: 24px 0; }
    .faq-item { background: var(--surface); border-radius: 12px; padding: 20px; margin-bottom: 12px; border: 1px solid #2a2a3e; }
    .faq-item h3 { font-size: 15px; margin-bottom: 6px; }
    .faq-item p { color: var(--muted); font-size: 14px; }

    /* C18: Metadata card layout */
    .metadata-card { background: var(--surface); border-radius: 12px; border: 1px solid #2a2a3e; }
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
        <input type="text" id="trial-url" placeholder="https://example.com" value="https://news.ycombinator.com"
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
        <button class="capture-btn" onclick="captureAll()">Capture Page</button>
      </div>
      <div id="trial-status" style="color:var(--muted);font-size:14px;margin-bottom:12px;"></div>
      <div id="trial-result" style="display:none;">
        <div id="trial-tabs" style="display:flex;gap:0;margin-bottom:0;border-bottom:2px solid #2a2a3e;">
          <button class="trial-tab active" data-tab="screenshot" style="padding:10px 20px;border:none;background:transparent;color:var(--brand);font-weight:600;font-size:14px;cursor:pointer;border-bottom:2px solid var(--brand);margin-bottom:-2px;">Screenshot</button>
          <button class="trial-tab" data-tab="pdf" style="padding:10px 20px;border:none;background:transparent;color:var(--muted);font-weight:600;font-size:14px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;">PDF</button>
          <button class="trial-tab" data-tab="content" style="padding:10px 20px;border:none;background:transparent;color:var(--muted);font-weight:600;font-size:14px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;">Content</button>
          <button class="trial-tab" data-tab="metadata" style="padding:10px 20px;border:none;background:transparent;color:var(--muted);font-weight:600;font-size:14px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;">Metadata</button>
          <button class="trial-tab" data-tab="structured" style="padding:10px 20px;border:none;background:transparent;color:var(--muted);font-weight:600;font-size:14px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;">Structured</button>
        </div>
        <div style="background:var(--surface);border-radius:0 0 12px 12px;border:1px solid #2a2a3e;border-top:none;padding:16px;">
          <div id="tab-screenshot" class="tab-content" style="text-align:center;">
            <img id="trial-image" style="max-width:100%;border-radius:8px;display:none;">
          </div>
          <div id="tab-pdf" class="tab-content" style="display:none;text-align:center;">
            <a id="trial-pdf-link" style="display:none;color:var(--brand);font-size:18px;font-weight:600;">Download PDF</a>
          </div>
          <div id="tab-content" class="tab-content" style="display:none;">
            <div id="trial-extract" style="max-height:500px;overflow-y:auto;font-size:14px;line-height:1.7;color:var(--text);font-family:-apple-system,sans-serif;"></div>
            <div id="trial-extract-meta" style="margin-top:12px;padding-top:12px;border-top:1px solid #2a2a3e;color:var(--muted);font-size:12px;"></div>
          </div>
          <div id="tab-metadata" class="tab-content" style="display:none;">
            <div id="trial-metadata" style="font-size:13px;color:var(--text);"></div>
          </div>
          <div id="tab-structured" class="tab-content" style="display:none;">
            <div id="trial-structured" style="font-size:13px;color:var(--text);max-height:500px;overflow-y:auto;"></div>
          </div>
        </div>
      </div>
    </section>
    <style>
      .spinner { display:inline-block;width:20px;height:20px;border:2px solid var(--muted);border-top-color:var(--brand);border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;margin-right:8px; }
      @keyframes spin { to { transform:rotate(360deg); } }
      .tab-content { transition: opacity 0.2s ease; }
      .rendered-md h1,.rendered-md h2,.rendered-md h3,.rendered-md h4 { margin:16px 0 8px;font-weight:700;color:var(--text); }
      .rendered-md h1 { font-size:24px; } .rendered-md h2 { font-size:20px; } .rendered-md h3 { font-size:17px; }
      .rendered-md p { margin:8px 0; } .rendered-md a { color:var(--brand); }
      .rendered-md ul,.rendered-md ol { margin:8px 0 8px 24px; }
      .rendered-md li { margin:4px 0; }
      .rendered-md code { background:#12121f;padding:2px 6px;border-radius:4px;font-size:13px; }
      .rendered-md pre { background:#12121f;padding:12px;border-radius:8px;overflow-x:auto;margin:12px 0; }
      .rendered-md pre code { background:none;padding:0; }
      .rendered-md table { border-collapse:collapse;margin:12px 0;width:100%; }
      .rendered-md th,.rendered-md td { border:1px solid #2a2a3e;padding:8px 12px;text-align:left; }
      .rendered-md th { background:#12121f;font-weight:600; }
      .rendered-md blockquote { border-left:3px solid var(--brand);padding-left:12px;color:var(--muted);margin:8px 0; }
      .rendered-md img { max-width:100%;border-radius:4px; }
      .error-msg { color:#ef4444;font-size:14px;padding:12px;background:#1a0a0a;border:1px solid #3a1a1a;border-radius:8px; }
      .capture-btn { padding:14px 32px;border-radius:8px;border:none;background:var(--brand);color:white;font-weight:700;cursor:pointer;font-size:16px;white-space:nowrap;letter-spacing:0.3px;transition:opacity 0.2s; }
      .capture-btn:disabled { opacity:0.5;cursor:not-allowed; }
      .capture-timing { color:var(--brand);font-weight:600; }
    </style>
    <script>
      // Safe helper: create a text node spinner indicator
      function showSpinner(el, msg) {
        el.textContent = '';
        var sp = document.createElement('span');
        sp.className = 'spinner';
        el.appendChild(sp);
        el.appendChild(document.createTextNode(' ' + msg));
      }
      // Safe helper: show error in an element
      function showError(el, msg) {
        el.textContent = '';
        var div = document.createElement('div');
        div.className = 'error-msg';
        div.textContent = msg;
        el.appendChild(div);
      }

      // C7: Enter key triggers capture
      document.getElementById('trial-url').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); captureAll(); }
      });

      // Tab switching
      document.addEventListener('click', function(e) {
        if (!e.target.classList || !e.target.classList.contains('trial-tab')) return;
        var tabName = e.target.dataset.tab;
        activateTab(tabName);

        // PDF tab: generate PDF on first click (lazy)
        if (tabName === 'pdf' && !document.getElementById('trial-pdf-link').href) {
          loadPdf();
        }
      });

      // C1/B3: Render markdown as formatted HTML using safe DOM construction
      function renderMarkdownToDOM(container, md) {
        container.textContent = '';
        var wrapper = document.createElement('div');
        wrapper.className = 'rendered-md';
        var lines = md.split('\\n');
        var i = 0;
        while (i < lines.length) {
          var line = lines[i];
          // Headings
          var headingMatch = line.match(/^(#{1,4}) (.+)$/);
          if (headingMatch) {
            var level = headingMatch[1].length;
            var h = document.createElement('h' + level);
            h.textContent = headingMatch[2];
            wrapper.appendChild(h);
            i++; continue;
          }
          // List items
          if (line.match(/^[-*] /)) {
            var ul = document.createElement('ul');
            while (i < lines.length && lines[i].match(/^[-*] /)) {
              var li = document.createElement('li');
              appendInlineContent(li, lines[i].replace(/^[-*] /, ''));
              ul.appendChild(li);
              i++;
            }
            wrapper.appendChild(ul);
            continue;
          }
          // Blockquotes
          if (line.match(/^> /)) {
            var bq = document.createElement('blockquote');
            bq.textContent = line.replace(/^> /, '');
            wrapper.appendChild(bq);
            i++; continue;
          }
          // Code blocks
          if (line.match(/^\`\`\`/)) {
            var pre = document.createElement('pre');
            var code = document.createElement('code');
            i++;
            var codeLines = [];
            while (i < lines.length && !lines[i].match(/^\`\`\`/)) {
              codeLines.push(lines[i]);
              i++;
            }
            code.textContent = codeLines.join('\\n');
            pre.appendChild(code);
            wrapper.appendChild(pre);
            i++; continue;
          }
          // Empty lines
          if (line.trim() === '') { i++; continue; }
          // Regular paragraph
          var p = document.createElement('p');
          appendInlineContent(p, line);
          wrapper.appendChild(p);
          i++;
        }
        container.appendChild(wrapper);
      }

      // Process inline markdown (bold, italic, code, links) safely
      function appendInlineContent(el, text) {
        // Split on markdown patterns and create safe DOM nodes
        var parts = text.split(/(\\[([^\\]]+)\\]\\(([^)]+)\\)|\\*\\*([^*]+)\\*\\*|\`([^\`]+)\`)/);
        for (var j = 0; j < parts.length; j++) {
          var part = parts[j];
          if (part === undefined || part === '') continue;
          // Check if this is a link pattern
          var linkMatch = part.match(/^\\[([^\\]]+)\\]\\(([^)]+)\\)$/);
          if (linkMatch) {
            var a = document.createElement('a');
            a.textContent = linkMatch[1];
            a.href = linkMatch[2];
            a.target = '_blank';
            a.rel = 'noopener';
            el.appendChild(a);
            j += 2; // skip captured groups
            continue;
          }
          // Bold
          var boldMatch = part.match(/^\\*\\*([^*]+)\\*\\*$/);
          if (boldMatch) {
            var strong = document.createElement('strong');
            strong.textContent = boldMatch[1];
            el.appendChild(strong);
            j += 1;
            continue;
          }
          // Inline code
          var codeMatch = part.match(/^\`([^\`]+)\`$/);
          if (codeMatch) {
            var codeEl = document.createElement('code');
            codeEl.textContent = codeMatch[1];
            el.appendChild(codeEl);
            j += 1;
            continue;
          }
          // Plain text
          el.appendChild(document.createTextNode(part));
        }
      }

      async function loadPdf() {
        var pdfLink = document.getElementById('trial-pdf-link');
        var pdfTab = document.getElementById('tab-pdf');
        showSpinner(pdfTab, 'Generating PDF...');
        try {
          var clean = document.getElementById('trial-clean').checked;
          var params = 'url=' + encodeURIComponent(capturedUrl);
          if (clean) params += '&clean=true';
          var resp = await fetch('/trial/pdf?' + params);
          if (!resp.ok) {
            var errData = await resp.json().catch(function() { return {}; });
            showError(pdfTab, 'PDF generation failed' + (errData.error ? ': ' + errData.error : ''));
            return;
          }
          var blob = await resp.blob();
          var objUrl = URL.createObjectURL(blob);
          pdfTab.textContent = '';
          pdfLink.href = objUrl;
          pdfLink.download = 'document.pdf';
          pdfLink.textContent = 'Download PDF (' + (blob.size / 1024 / 1024).toFixed(1) + ' MB)';
          pdfLink.style.display = 'inline-block';
          pdfTab.appendChild(pdfLink);
        } catch(e) { showError(pdfTab, 'Error: ' + e.message); }
      }

      async function loadExtract(url) {
        var el = document.getElementById('trial-extract');
        var meta = document.getElementById('trial-extract-meta');
        showSpinner(el, 'Extracting content...');
        try {
          var resp = await fetch('/trial/extract?url=' + encodeURIComponent(url));
          if (!resp.ok) {
            var errData = await resp.json().catch(function() { return {}; });
            showError(el, 'Extraction failed' + (errData.error ? ': ' + errData.error : ''));
            return;
          }
          var data = await resp.json();
          // C1/B3: Render markdown as formatted HTML using safe DOM construction
          renderMarkdownToDOM(el, data.content);
          meta.textContent = data.wordCount + ' words' + (data.author ? ' | By ' + data.author : '') + ' | ' + data.title;
        } catch(e) { showError(el, 'Error: ' + e.message); }
      }

      async function loadMetadata(url) {
        var el = document.getElementById('trial-metadata');
        showSpinner(el, 'Loading metadata...');
        try {
          var resp = await fetch('/trial/metadata?url=' + encodeURIComponent(url));
          if (!resp.ok) {
            var errData = await resp.json().catch(function() { return {}; });
            showError(el, 'Metadata extraction failed' + (errData.error ? ': ' + errData.error : ''));
            return;
          }
          var data = await resp.json();
          // Build metadata display using safe DOM methods
          el.textContent = '';
          var grid = document.createElement('div');
          grid.style.cssText = 'display:grid;grid-template-columns:120px 1fr;gap:8px 16px;';
          var addRow = function(label, value) {
            if (!value) return;
            var lbl = document.createElement('div');
            lbl.style.cssText = 'color:var(--muted);font-weight:600;';
            lbl.textContent = label;
            var val = document.createElement('div');
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
            var imgContainer = document.createElement('div');
            imgContainer.style.cssText = 'margin-top:16px;';
            var ogImg = document.createElement('img');
            ogImg.src = data.og.image;
            ogImg.style.cssText = 'max-width:100%;max-height:200px;border-radius:8px;border:1px solid #2a2a3e;';
            ogImg.onerror = function() { ogImg.style.display = 'none'; };
            imgContainer.appendChild(ogImg);
            el.appendChild(imgContainer);
          }
        } catch(e) { showError(el, 'Error: ' + e.message); }
      }

      async function loadStructured(url) {
        var el = document.getElementById('trial-structured');
        showSpinner(el, 'Extracting structured data...');
        try {
          var resp = await fetch('/v1/extract/structured', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
          });
          if (!resp.ok) {
            var errData = await resp.json().catch(function() { return {}; });
            showError(el, 'Structured extraction failed' + (errData.error ? ': ' + errData.error : ''));
            return;
          }
          var data = await resp.json();
          el.textContent = '';

          // Schema types badge
          if (data.schemaTypes && data.schemaTypes.length > 0) {
            var typesDiv = document.createElement('div');
            typesDiv.style.cssText = 'margin-bottom:16px;';
            var label = document.createElement('span');
            label.style.cssText = 'color:var(--muted);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;';
            label.textContent = 'Schema.org Types: ';
            typesDiv.appendChild(label);
            for (var i = 0; i < data.schemaTypes.length; i++) {
              var badge = document.createElement('span');
              badge.style.cssText = 'background:var(--brand);color:white;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;margin-right:6px;';
              badge.textContent = data.schemaTypes[i];
              typesDiv.appendChild(badge);
            }
            el.appendChild(typesDiv);
          }

          // JSON-LD section
          if (data.jsonLd && data.jsonLd.length > 0) {
            var ldSection = document.createElement('div');
            ldSection.style.cssText = 'margin-bottom:16px;';
            var ldTitle = document.createElement('div');
            ldTitle.style.cssText = 'color:var(--brand);font-weight:700;font-size:14px;margin-bottom:8px;';
            ldTitle.textContent = 'JSON-LD (' + data.jsonLd.length + ' item' + (data.jsonLd.length > 1 ? 's' : '') + ')';
            ldSection.appendChild(ldTitle);
            var pre = document.createElement('pre');
            pre.style.cssText = 'background:#12121f;padding:12px;border-radius:8px;overflow-x:auto;font-size:12px;color:#a0a0d0;border:1px solid #2a2a3e;max-height:300px;overflow-y:auto;';
            pre.textContent = JSON.stringify(data.jsonLd, null, 2);
            ldSection.appendChild(pre);
            el.appendChild(ldSection);
          }

          // Open Graph section
          if (data.og && Object.keys(data.og).length > 0) {
            var ogSection = document.createElement('div');
            ogSection.style.cssText = 'margin-bottom:16px;';
            var ogTitle = document.createElement('div');
            ogTitle.style.cssText = 'color:var(--brand);font-weight:700;font-size:14px;margin-bottom:8px;';
            ogTitle.textContent = 'Open Graph';
            ogSection.appendChild(ogTitle);
            var ogGrid = document.createElement('div');
            ogGrid.style.cssText = 'display:grid;grid-template-columns:120px 1fr;gap:6px 12px;';
            var ogKeys = Object.keys(data.og);
            for (var j = 0; j < ogKeys.length; j++) {
              var k = document.createElement('div');
              k.style.cssText = 'color:var(--muted);font-weight:600;font-size:12px;';
              k.textContent = 'og:' + ogKeys[j];
              var v = document.createElement('div');
              v.style.cssText = 'font-size:13px;word-break:break-all;';
              v.textContent = data.og[ogKeys[j]];
              ogGrid.appendChild(k);
              ogGrid.appendChild(v);
            }
            ogSection.appendChild(ogGrid);
            el.appendChild(ogSection);
          }

          // Meta tags section
          if (data.meta && Object.keys(data.meta).length > 0) {
            var metaSection = document.createElement('div');
            var metaTitle = document.createElement('div');
            metaTitle.style.cssText = 'color:var(--brand);font-weight:700;font-size:14px;margin-bottom:8px;';
            metaTitle.textContent = 'Meta Tags (' + Object.keys(data.meta).length + ')';
            metaSection.appendChild(metaTitle);
            var metaGrid = document.createElement('div');
            metaGrid.style.cssText = 'display:grid;grid-template-columns:140px 1fr;gap:6px 12px;';
            var metaKeys = Object.keys(data.meta);
            for (var m = 0; m < Math.min(metaKeys.length, 20); m++) {
              var mk = document.createElement('div');
              mk.style.cssText = 'color:var(--muted);font-weight:600;font-size:12px;';
              mk.textContent = metaKeys[m];
              var mv = document.createElement('div');
              mv.style.cssText = 'font-size:13px;word-break:break-all;';
              mv.textContent = String(data.meta[metaKeys[m]]).substring(0, 200);
              metaGrid.appendChild(mk);
              metaGrid.appendChild(mv);
            }
            if (metaKeys.length > 20) {
              var more = document.createElement('div');
              more.style.cssText = 'grid-column:1/-1;color:var(--muted);font-size:12px;margin-top:4px;';
              more.textContent = '... and ' + (metaKeys.length - 20) + ' more';
              metaGrid.appendChild(more);
            }
            metaSection.appendChild(metaGrid);
            el.appendChild(metaSection);
          }

          if (!el.children.length) {
            el.textContent = 'No structured data found on this page.';
          }
        } catch(e) { showError(el, 'Error: ' + e.message); }
      }

      var capturedUrl = '';
      var captureStartTime = 0;
      var elapsedTimerId = null;
      var progressPollId = null;
      var currentStage = 'navigating';
      var currentRequestId = null;

      var stageLabels = {
        navigating: 'Loading page',
        loaded: 'Page loaded, processing',
        scrolling: 'Scrolling for lazy images',
        cleaning: 'Removing overlays',
        rendering: 'Rendering capture',
        extracting: 'Extracting content',
        complete: 'Complete',
        error: 'Error'
      };

      function startElapsedTimer(statusEl) {
        stopElapsedTimer();
        currentStage = 'navigating';
        elapsedTimerId = setInterval(function() {
          var secs = ((Date.now() - captureStartTime) / 1000).toFixed(1);
          var label = stageLabels[currentStage] || 'Capturing';
          statusEl.textContent = '';
          var sp = document.createElement('span');
          sp.className = 'spinner';
          statusEl.appendChild(sp);
          statusEl.appendChild(document.createTextNode(' ' + label + '... ' + secs + 's'));
        }, 100);
      }

      function startProgressPolling(requestId) {
        stopProgressPolling();
        currentRequestId = requestId;
        progressPollId = setInterval(function() {
          if (!currentRequestId) return;
          fetch('/internal/status/' + currentRequestId)
            .then(function(r) { return r.ok ? r.json() : null; })
            .then(function(data) {
              if (data && data.stage) currentStage = data.stage;
            })
            .catch(function() {});
        }, 500);
      }

      function stopProgressPolling() {
        if (progressPollId) {
          clearInterval(progressPollId);
          progressPollId = null;
        }
        currentRequestId = null;
      }

      function stopElapsedTimer() {
        if (elapsedTimerId) {
          clearInterval(elapsedTimerId);
          elapsedTimerId = null;
        }
        stopProgressPolling();
      }

      async function captureAll() {
        var url = document.getElementById('trial-url').value.trim();
        if (!url) return;
        var clean = document.getElementById('trial-clean').checked;
        var adblock = document.getElementById('trial-adblock').value;
        var status = document.getElementById('trial-status');
        var result = document.getElementById('trial-result');
        var img = document.getElementById('trial-image');
        var pdfLink = document.getElementById('trial-pdf-link');
        var captureBtn = document.querySelector('.capture-btn');

        // C5: Disable button while capturing
        captureBtn.disabled = true;
        captureBtn.textContent = 'Capturing...';
        captureStartTime = Date.now();

        // Live elapsed timer during capture
        startElapsedTimer(status);
        result.style.display = 'none';

        // Reset all tab content
        document.getElementById('trial-extract').textContent = '';
        document.getElementById('trial-extract-meta').textContent = '';
        document.getElementById('trial-metadata').textContent = '';
        document.getElementById('trial-structured').textContent = '';
        img.style.display = 'none';
        pdfLink.style.display = 'none';
        pdfLink.removeAttribute('href');

        var fullUrl = url.match(/^https?:\\/\\//) ? url : 'https://' + url;
        capturedUrl = fullUrl;
        var params = 'url=' + encodeURIComponent(fullUrl);
        if (clean) params += '&clean=true';
        if (adblock) params += '&block_ads=' + adblock;

        try {
          // Generate request ID for progress tracking
          var reqId = 'trial-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
          startProgressPolling(reqId);

          // Take screenshot first (fastest visual feedback)
          var resp = await fetch('/trial/screenshot?' + params, {
            headers: { 'X-Request-Id': reqId }
          });
          var remaining = resp.headers.get('X-Trial-Remaining');
          if (!resp.ok) {
            stopElapsedTimer();
            var err = await resp.json();
            showError(status, err.error || 'Capture failed');
            return;
          }
          var blob = await resp.blob();
          var objUrl = URL.createObjectURL(blob);

          // Stop timer and show final timing
          stopElapsedTimer();
          var elapsed = ((Date.now() - captureStartTime) / 1000).toFixed(1);

          // Show results with Screenshot tab active
          result.style.display = 'block';
          img.src = objUrl;
          img.style.display = 'block';

          // Activate screenshot tab
          activateTab('screenshot');
          status.textContent = '';
          var timing = document.createElement('span');
          timing.className = 'capture-timing';
          timing.textContent = 'Captured in ' + elapsed + 's';
          status.appendChild(timing);
          status.appendChild(document.createTextNode(
            (remaining ? ' \\u00b7 ' + remaining + ' free captures remaining today.' : '') +
            ' Click tabs to see all outputs.'
          ));

          // Start loading content, metadata, and structured data in the background
          loadExtract(fullUrl);
          loadMetadata(fullUrl);
          loadStructured(fullUrl);
        } catch(e) {
          stopElapsedTimer();
          showError(status, 'Error: ' + e.message);
        } finally {
          // C5: Re-enable button
          captureBtn.disabled = false;
          captureBtn.textContent = 'Capture Page';
        }
      }

      function activateTab(tabName) {
        document.querySelectorAll('.trial-tab').forEach(function(t) {
          t.classList.remove('active');
          t.style.color = 'var(--muted)';
          t.style.borderBottomColor = 'transparent';
        });
        document.querySelectorAll('.tab-content').forEach(function(c) { c.style.display = 'none'; });
        var tab = document.querySelector('[data-tab="' + tabName + '"]');
        if (tab) {
          tab.classList.add('active');
          tab.style.color = 'var(--brand)';
          tab.style.borderBottomColor = 'var(--brand)';
        }
        var content = document.getElementById('tab-' + tabName);
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

    <section>
      <h2>How It Works</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <h3>Send a URL</h3>
          <p>POST to /v1/page with any URL and pick your outputs: screenshot, PDF, markdown, metadata.</p>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <h3>We Load It in a Real Browser</h3>
          <p>Chromium renders the page, handles JavaScript, removes popups, waits for fonts and images.</p>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <h3>Get Any Output You Need</h3>
          <p>Screenshot as PNG, PDF with formatting, clean Markdown for LLMs, structured metadata — all from one page load.</p>
        </div>
      </div>
    </section>

    <section>
      <h2>Built For</h2>
      <div class="use-cases">
        <div class="use-case">
          <h3>AI Agents &amp; LLMs</h3>
          <p>Give your AI agent web access with MCP. Extract clean Markdown from any URL for RAG pipelines, summarization, and research.</p>
        </div>
        <div class="use-case">
          <h3>QA &amp; Testing Teams</h3>
          <p>Visual regression testing with pixel-level diff. Screenshot before/after deployments, catch layout regressions automatically.</p>
        </div>
        <div class="use-case">
          <h3>Content Pipelines</h3>
          <p>Turn any web page into structured data. Extract articles, metadata, OG tags, and JSON-LD at scale with batch processing.</p>
        </div>
      </div>
    </section>

    <section>
      <h2>FAQ</h2>
      <div class="faq">
        <div class="faq-item">
          <h3>What sites work?</h3>
          <p>Any publicly accessible website. We use a full Chromium browser, so JavaScript-heavy SPAs, server-rendered pages, and static sites all work.</p>
        </div>
        <div class="faq-item">
          <h3>How fast is it?</h3>
          <p>Most captures complete in 2-5 seconds. Complex pages with heavy JavaScript may take up to 15 seconds. The unified endpoint captures all outputs in a single page load.</p>
        </div>
        <div class="faq-item">
          <h3>What about JavaScript-heavy sites?</h3>
          <p>Full JavaScript execution with smart wait detection. We monitor DOM stability, network activity, font loading, and animations before capturing.</p>
        </div>
        <div class="faq-item">
          <h3>Is it free?</h3>
          <p>Yes! 200 captures/month free with all outputs included. No credit card required. The trial demo above gives you 5 captures per day.</p>
        </div>
      </div>
    </section>

    <section style="text-align:center;padding:20px 0;">
      <p style="color:var(--muted);font-size:13px;">Your captures are ephemeral. We don't store your content — pages are rendered on demand and results are returned directly. No data is retained after the response.</p>
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
