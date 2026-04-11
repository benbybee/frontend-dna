import type { Page } from "playwright-core";
import type { TypographyTokens, TypeScaleEntry } from "../types";

const TEXT_SELECTORS =
  "h1, h2, h3, h4, h5, h6, p, a, span, li, blockquote, label, button, input, th, td, figcaption";

export async function extractTypography(page: Page): Promise<TypographyTokens> {
  const { typeScale, fontFamilies } = await page.evaluate((selectors) => {
    const elements = document.querySelectorAll(selectors);
    const seen = new Set<string>();
    const scale: {
      element: string;
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
      letterSpacing: string;
      textTransform: string;
    }[] = [];
    const families = new Set<string>();

    for (const el of Array.from(elements)) {
      const style = getComputedStyle(el);
      const family = style.fontFamily;
      const size = style.fontSize;
      const weight = style.fontWeight;
      const lh = style.lineHeight;
      const ls = style.letterSpacing;
      const tt = style.textTransform;

      // Deduplicate by unique combination
      const key = `${family}|${size}|${weight}|${lh}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Get the most specific tag name
      const tag = el.tagName.toLowerCase();

      families.add(family);
      scale.push({
        element: tag,
        fontFamily: family,
        fontSize: size,
        fontWeight: weight,
        lineHeight: lh,
        letterSpacing: ls,
        textTransform: tt,
      });
    }

    return {
      typeScale: scale,
      fontFamilies: Array.from(families),
    };
  }, TEXT_SELECTORS);

  // Extract font sources from <link> tags and @font-face rules
  const fontSources = await page.evaluate(() => {
    const sources: string[] = [];

    // Google Fonts and other external font links
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    for (const link of Array.from(links)) {
      const href = (link as HTMLLinkElement).href;
      if (
        href.includes("fonts.googleapis.com") ||
        href.includes("fonts.gstatic.com") ||
        href.includes("use.typekit.net") ||
        href.includes("fonts.adobe.com")
      ) {
        sources.push(href);
      }
    }

    // @font-face rules
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          if (rule instanceof CSSFontFaceRule) {
            const src = rule.style.getPropertyValue("src");
            if (src) sources.push(src);
          }
        }
      } catch {
        // Cross-origin
      }
    }

    return sources;
  });

  // Sort type scale by font size (largest first)
  const sorted = typeScale.sort((a, b) => {
    const aSize = parseFloat(a.fontSize);
    const bSize = parseFloat(b.fontSize);
    return bSize - aSize;
  });

  return {
    fontFamilies,
    typeScale: sorted as TypeScaleEntry[],
    fontSources,
  };
}
