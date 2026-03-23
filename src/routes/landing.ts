import { FastifyInstance } from "fastify";

const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PageYoink — Screenshot &amp; PDF API</title>
  <meta name="description" content="Yoink pages into screenshots and PDFs. Fast, intelligent capture API with cookie banner removal, ad blocking, and smart rendering.">
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
      <p class="tagline">Yoink pages into screenshots and PDFs. One API, clean captures, zero hassle.</p>
    </header>

    <section>
      <div class="code-block">
        <span class="comment"># Take a screenshot</span><br>
        curl "<span class="string">https://api.pageyoink.dev/v1/screenshot?url=https://example.com&amp;clean=true</span>" \\<br>
        &nbsp;&nbsp;-H "<span class="key">x-api-key</span>: <span class="string">your-key</span>" -o screenshot.png<br><br>
        <span class="comment"># Generate a PDF</span><br>
        curl "<span class="string">https://api.pageyoink.dev/v1/pdf?url=https://example.com</span>" \\<br>
        &nbsp;&nbsp;-H "<span class="key">x-api-key</span>: <span class="string">your-key</span>" -o document.pdf<br><br>
        <span class="comment"># Compare two pages visually</span><br>
        curl -X POST "<span class="string">https://api.pageyoink.dev/v1/diff</span>" \\<br>
        &nbsp;&nbsp;-H "<span class="key">x-api-key</span>: <span class="string">your-key</span>" \\<br>
        &nbsp;&nbsp;-H "Content-Type: application/json" \\<br>
        &nbsp;&nbsp;-d '{"url1":"https://example.com","url2":"https://example.org"}' -o diff.png
      </div>
    </section>

    <section>
      <h2>Endpoints</h2>
      <div class="endpoints">
        <div class="endpoint">
          <h3><span class="method">GET</span> <span class="path">/v1/screenshot</span></h3>
          <p>Capture any URL as PNG or JPEG. Configurable viewport, full-page, retina, and format options.</p>
        </div>
        <div class="endpoint">
          <h3><span class="method">GET</span> <span class="path">/v1/pdf</span></h3>
          <p>Convert any URL to PDF. Supports A4/Letter/Legal/A3, landscape, margins, and background printing.</p>
        </div>
        <div class="endpoint">
          <h3><span class="method post">POST</span> <span class="path">/v1/pdf</span></h3>
          <p>Convert raw HTML to PDF. Send your HTML in the request body, get a PDF back.</p>
        </div>
        <div class="endpoint">
          <h3><span class="method post">POST</span> <span class="path">/v1/batch</span></h3>
          <p>Process up to 50 URLs at once. Async with job tracking and optional webhook notification.</p>
        </div>
      </div>
    </section>

    <section>
      <h2>What Makes PageYoink Different</h2>
      <div class="features">
        <div class="feature">
          <h3>Clean Mode</h3>
          <p>Auto-removes cookie banners, consent dialogs, chat widgets, and popups. No CSS selectors needed.</p>
        </div>
        <div class="feature">
          <h3>Smart Wait</h3>
          <p>Detects when JavaScript-heavy pages are truly done rendering. No more guessing at delay values.</p>
        </div>
        <div class="feature">
          <h3>Visual Diff</h3>
          <p>Compare two URLs pixel-by-pixel. Catch visual regressions before your users do.</p>
        </div>
        <div class="feature">
          <h3>Batch Processing</h3>
          <p>Submit up to 50 URLs at once with webhook delivery when the batch completes.</p>
        </div>
        <div class="feature">
          <h3>Simple Pricing</h3>
          <p>Predictable pricing with no hidden fees. No per-feature surcharges or surprise bills.</p>
        </div>
        <div class="feature">
          <h3>Developer First</h3>
          <p>Clean REST API, clear error messages, and comprehensive documentation.</p>
        </div>
      </div>
    </section>

    <section class="pricing">
      <h2>Pricing</h2>
      <div class="tiers">
        <div class="tier">
          <h3>Free</h3>
          <div class="price">$0<span>/mo</span></div>
          <ul>
            <li>100 requests/month</li>
            <li>All endpoints</li>
            <li>Clean mode</li>
            <li>Smart wait</li>
          </ul>
        </div>
        <div class="tier">
          <h3>Starter</h3>
          <div class="price">$9<span>/mo</span></div>
          <ul>
            <li>5,000 requests/month</li>
            <li>All endpoints</li>
            <li>Batch processing</li>
            <li>Priority rendering</li>
          </ul>
        </div>
        <div class="tier featured">
          <h3>Pro</h3>
          <div class="price">$29<span>/mo</span></div>
          <ul>
            <li>25,000 requests/month</li>
            <li>All endpoints</li>
            <li>Batch processing</li>
            <li>Webhooks</li>
            <li>Priority support</li>
          </ul>
        </div>
        <div class="tier">
          <h3>Business</h3>
          <div class="price">$79<span>/mo</span></div>
          <ul>
            <li>100,000 requests/month</li>
            <li>All endpoints</li>
            <li>Custom concurrency</li>
            <li>SLA guarantee</li>
            <li>Dedicated support</li>
          </ul>
        </div>
      </div>
    </section>

    <footer>
      <p>PageYoink &mdash; Yoink pages into screenshots and PDFs.</p>
    </footer>
  </div>
</body>
</html>`;

export async function landingRoute(app: FastifyInstance) {
  app.get("/", async (_request, reply) => {
    return reply.header("Content-Type", "text/html").send(LANDING_HTML);
  });
}
