import type { Page } from "playwright-core";
import type { BreakpointTokens } from "../types";

export async function extractBreakpoints(page: Page): Promise<BreakpointTokens> {
  // Get all CSS text from stylesheets, then parse media queries
  const cssText = await page.evaluate(() => {
    const texts: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          texts.push(rule.cssText);
        }
      } catch {
        // Cross-origin
      }
    }
    return texts.join("\n");
  });

  // Parse @media queries to find breakpoint widths
  const mediaRegex =
    /@media[^{]*\(\s*(?:min|max)-width\s*:\s*(\d+(?:\.\d+)?)(px|em|rem)\s*\)/g;
  const breakpointMap = new Map<number, string>();
  let match;

  while ((match = mediaRegex.exec(cssText)) !== null) {
    let width = parseFloat(match[1]);
    const unit = match[2];

    // Convert em/rem to px (assuming 16px base)
    if (unit === "em" || unit === "rem") {
      width = width * 16;
    }

    const roundedWidth = Math.round(width);
    if (!breakpointMap.has(roundedWidth)) {
      // Reconstruct a clean query string
      breakpointMap.set(
        roundedWidth,
        match[0].replace(/@media[^{]*/, "").trim()
      );
    }
  }

  const breakpoints = Array.from(breakpointMap.entries())
    .map(([width, query]) => ({ width, query }))
    .sort((a, b) => a.width - b.width);

  return { breakpoints };
}
