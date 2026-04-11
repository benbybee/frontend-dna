import type { Page } from "playwright-core";
import type { BorderTokens } from "../types";

export async function extractBorders(page: Page): Promise<BorderTokens> {
  return page.evaluate(() => {
    const radiiSet = new Set<string>();
    const widthSet = new Set<string>();
    const styleSet = new Set<string>();

    const elements = document.querySelectorAll("*");
    const sampled = Array.from(elements).slice(0, 500);

    for (const el of sampled) {
      const style = getComputedStyle(el);

      // Border radius
      const br = style.borderRadius;
      if (br && br !== "0px") {
        radiiSet.add(br);
      }

      // Border widths (check each side)
      for (const side of ["Top", "Right", "Bottom", "Left"]) {
        const width = style.getPropertyValue(`border-${side.toLowerCase()}-width`);
        if (width && width !== "0px") {
          widthSet.add(width);
        }

        const bStyle = style.getPropertyValue(`border-${side.toLowerCase()}-style`);
        if (bStyle && bStyle !== "none") {
          styleSet.add(bStyle);
        }
      }
    }

    return {
      radii: Array.from(radiiSet).sort(),
      widths: Array.from(widthSet).sort(),
      styles: Array.from(styleSet).sort(),
    };
  });
}
