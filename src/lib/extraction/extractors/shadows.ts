import type { Page } from "playwright-core";
import type { ShadowTokens } from "../types";

export async function extractShadows(page: Page): Promise<ShadowTokens> {
  return page.evaluate(() => {
    const boxShadowSet = new Set<string>();
    const textShadowSet = new Set<string>();

    const elements = document.querySelectorAll("*");
    // Sample up to 500 elements
    const sampled = Array.from(elements).slice(0, 500);

    for (const el of sampled) {
      const style = getComputedStyle(el);

      const boxShadow = style.boxShadow;
      if (boxShadow && boxShadow !== "none") {
        boxShadowSet.add(boxShadow);
      }

      const textShadow = style.textShadow;
      if (textShadow && textShadow !== "none") {
        textShadowSet.add(textShadow);
      }
    }

    return {
      boxShadows: Array.from(boxShadowSet),
      textShadows: Array.from(textShadowSet),
    };
  });
}
