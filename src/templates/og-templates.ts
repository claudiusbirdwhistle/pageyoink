export interface OgTemplateParams {
  title: string;
  subtitle?: string;
  author?: string;
  domain?: string;
  theme?: "light" | "dark" | "gradient";
  brandColor?: string;
  fontSize?: "small" | "medium" | "large";
  template?: "default" | "split" | "minimal" | "bold";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getThemeStyles(
  theme: string,
  brandColor: string,
): { bg: string; textColor: string; subtitleColor: string } {
  switch (theme) {
    case "dark":
      return {
        bg: "background: #1a1a2e;",
        textColor: "#e0e0e0",
        subtitleColor: "#a0a0b0",
      };
    case "gradient":
      return {
        bg: `background: linear-gradient(135deg, ${brandColor} 0%, #1a1a2e 100%);`,
        textColor: "#ffffff",
        subtitleColor: "rgba(255,255,255,0.8)",
      };
    case "light":
    default:
      return {
        bg: "background: #ffffff;",
        textColor: "#1a1a2e",
        subtitleColor: "#666680",
      };
  }
}

function getFontSize(size: string): { title: string; subtitle: string } {
  switch (size) {
    case "small":
      return { title: "42px", subtitle: "20px" };
    case "large":
      return { title: "72px", subtitle: "32px" };
    case "medium":
    default:
      return { title: "56px", subtitle: "24px" };
  }
}

export function renderOgTemplate(params: OgTemplateParams): string {
  const {
    title,
    subtitle,
    author,
    domain,
    theme = "gradient",
    brandColor = "#6366f1",
    fontSize = "medium",
    template = "default",
  } = params;

  switch (template) {
    case "split":
      return renderSplitTemplate(params);
    case "minimal":
      return renderMinimalTemplate(params);
    case "bold":
      return renderBoldTemplate(params);
    default:
      break;
  }

  const styles = getThemeStyles(theme, brandColor);
  const fonts = getFontSize(fontSize);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 630px;
      ${styles.bg}
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 80px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .title {
      color: ${styles.textColor};
      font-size: ${fonts.title};
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 20px;
      max-width: 900px;
    }
    .subtitle {
      color: ${styles.subtitleColor};
      font-size: ${fonts.subtitle};
      line-height: 1.5;
      margin-bottom: 30px;
      max-width: 800px;
    }
    .footer {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: auto;
    }
    .author {
      color: ${styles.subtitleColor};
      font-size: 20px;
      font-weight: 500;
    }
    .dot {
      color: ${styles.subtitleColor};
      font-size: 20px;
    }
    .domain {
      color: ${brandColor};
      font-size: 20px;
      font-weight: 600;
    }
    .accent-bar {
      width: 60px;
      height: 4px;
      background: ${brandColor};
      border-radius: 2px;
      margin-bottom: 30px;
    }
  </style>
</head>
<body>
  <div class="accent-bar"></div>
  <div class="title">${escapeHtml(title)}</div>
  ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ""}
  <div class="footer">
    ${author ? `<span class="author">${escapeHtml(author)}</span>` : ""}
    ${author && domain ? '<span class="dot">&middot;</span>' : ""}
    ${domain ? `<span class="domain">${escapeHtml(domain)}</span>` : ""}
  </div>
</body>
</html>`;
}

function renderSplitTemplate(params: OgTemplateParams): string {
  const { title, subtitle, author, domain, brandColor = "#6366f1" } = params;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; display: flex; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.left { width: 50%; background: ${brandColor}; display: flex; align-items: center; justify-content: center; padding: 60px; }
.left .icon { font-size: 120px; color: rgba(255,255,255,0.3); }
.right { width: 50%; background: #1a1a2e; display: flex; flex-direction: column; justify-content: center; padding: 60px; }
.title { color: #fff; font-size: 44px; font-weight: 700; line-height: 1.2; margin-bottom: 16px; }
.subtitle { color: rgba(255,255,255,0.7); font-size: 20px; line-height: 1.5; margin-bottom: 24px; }
.meta { color: rgba(255,255,255,0.5); font-size: 16px; margin-top: auto; }
.meta span { color: ${brandColor}; font-weight: 600; }
</style></head><body>
<div class="left"><div class="icon">&laquo;&raquo;</div></div>
<div class="right">
  <div class="title">${escapeHtml(title)}</div>
  ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ""}
  <div class="meta">
    ${author ? escapeHtml(author) : ""}
    ${author && domain ? " &middot; " : ""}
    ${domain ? `<span>${escapeHtml(domain)}</span>` : ""}
  </div>
</div>
</body></html>`;
}

function renderMinimalTemplate(params: OgTemplateParams): string {
  const { title, subtitle, domain, brandColor = "#6366f1" } = params;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #fafafa; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 80px; }
.bar { width: 40px; height: 4px; background: ${brandColor}; border-radius: 2px; margin-bottom: 40px; }
.title { color: #111; font-size: 52px; font-weight: 700; line-height: 1.2; margin-bottom: 20px; max-width: 900px; }
.subtitle { color: #666; font-size: 22px; line-height: 1.5; max-width: 700px; margin-bottom: 40px; }
.domain { color: ${brandColor}; font-size: 18px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
</style></head><body>
<div class="bar"></div>
<div class="title">${escapeHtml(title)}</div>
${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ""}
${domain ? `<div class="domain">${escapeHtml(domain)}</div>` : ""}
</body></html>`;
}

function renderBoldTemplate(params: OgTemplateParams): string {
  const { title, subtitle, author, domain, brandColor = "#6366f1" } = params;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #111; display: flex; flex-direction: column; justify-content: flex-end; padding: 70px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; position: relative; overflow: hidden; }
.bg-accent { position: absolute; top: -200px; right: -200px; width: 600px; height: 600px; border-radius: 50%; background: ${brandColor}; opacity: 0.15; }
.bg-accent2 { position: absolute; bottom: -100px; left: -100px; width: 400px; height: 400px; border-radius: 50%; background: ${brandColor}; opacity: 0.1; }
.title { color: #fff; font-size: 64px; font-weight: 800; line-height: 1.1; margin-bottom: 16px; max-width: 900px; position: relative; z-index: 1; }
.subtitle { color: rgba(255,255,255,0.6); font-size: 24px; line-height: 1.4; margin-bottom: 30px; max-width: 700px; position: relative; z-index: 1; }
.footer { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }
.author { color: rgba(255,255,255,0.5); font-size: 18px; }
.domain { color: ${brandColor}; font-size: 18px; font-weight: 700; }
</style></head><body>
<div class="bg-accent"></div>
<div class="bg-accent2"></div>
<div class="title">${escapeHtml(title)}</div>
${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ""}
<div class="footer">
  ${author ? `<span class="author">${escapeHtml(author)}</span>` : ""}
  ${author && domain ? '<span class="author">&middot;</span>' : ""}
  ${domain ? `<span class="domain">${escapeHtml(domain)}</span>` : ""}
</div>
</body></html>`;
}
