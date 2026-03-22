export interface OgTemplateParams {
  title: string;
  subtitle?: string;
  author?: string;
  domain?: string;
  theme?: "light" | "dark" | "gradient";
  brandColor?: string;
  fontSize?: "small" | "medium" | "large";
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
  } = params;

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
