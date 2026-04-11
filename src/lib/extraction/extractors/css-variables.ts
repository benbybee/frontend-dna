import type { Page } from "playwright-core";
import type { CssVariableMap } from "../types";

export async function extractCssVariables(page: Page): Promise<CssVariableMap> {
  return page.evaluate(() => {
    const variables: Record<string, string> = {};

    // Extract from all stylesheets
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          if (rule instanceof CSSStyleRule) {
            const selector = rule.selectorText;
            // Target :root, html, body where CSS vars are typically declared
            if (
              selector === ":root" ||
              selector === "html" ||
              selector === "body" ||
              selector.includes(":root")
            ) {
              for (const prop of Array.from(rule.style)) {
                if (prop.startsWith("--")) {
                  variables[prop] = rule.style.getPropertyValue(prop).trim();
                }
              }
            }
          }
        }
      } catch {
        // Cross-origin stylesheets will throw — skip them
      }
    }

    // Also check computed styles on :root for inherited variables
    const rootStyles = getComputedStyle(document.documentElement);
    for (const prop of Array.from(rootStyles)) {
      if (prop.startsWith("--")) {
        const value = rootStyles.getPropertyValue(prop).trim();
        if (value && !variables[prop]) {
          variables[prop] = value;
        }
      }
    }

    return variables;
  });
}
