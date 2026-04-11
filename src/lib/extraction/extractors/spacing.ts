import type { Page } from "playwright-core";
import type { SpacingTokens, SpacingPattern } from "../types";

const CONTAINER_SELECTORS =
  "div, section, main, article, aside, header, footer, nav, ul, ol, form";

export async function extractSpacing(page: Page): Promise<SpacingTokens> {
  const raw = await page.evaluate((selectors) => {
    const paddings: number[] = [];
    const margins: number[] = [];
    const gaps: number[] = [];

    function pxToNum(val: string): number {
      return parseFloat(val) || 0;
    }

    const elements = document.querySelectorAll(selectors);
    // Sample up to 200 elements to avoid performance issues
    const sampled = Array.from(elements).slice(0, 200);

    for (const el of sampled) {
      const style = getComputedStyle(el);

      // Padding
      for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
        const val = pxToNum(style.getPropertyValue(`padding-${side.toLowerCase()}`));
        if (val > 0) paddings.push(val);
      }

      // Margin
      for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
        const val = pxToNum(style.getPropertyValue(`margin-${side.toLowerCase()}`));
        if (val > 0) margins.push(val);
      }

      // Gap
      const gap = pxToNum(style.gap);
      if (gap > 0) gaps.push(gap);
      const rowGap = pxToNum(style.rowGap);
      if (rowGap > 0 && rowGap !== gap) gaps.push(rowGap);
      const colGap = pxToNum(style.columnGap);
      if (colGap > 0 && colGap !== gap) gaps.push(colGap);
    }

    return { paddings, margins, gaps };
  }, CONTAINER_SELECTORS);

  // Build frequency histograms and derive scale
  function buildPatterns(values: number[]): SpacingPattern[] {
    const freq = new Map<number, number>();
    for (const v of values) {
      // Round to nearest integer
      const rounded = Math.round(v);
      freq.set(rounded, (freq.get(rounded) || 0) + 1);
    }
    return Array.from(freq.entries())
      .map(([value, frequency]) => ({
        value: `${value}px`,
        pxValue: value,
        frequency,
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  const paddingPatterns = buildPatterns(raw.paddings);
  const marginPatterns = buildPatterns(raw.margins);
  const gapPatterns = buildPatterns(raw.gaps);

  // Derive a spacing scale from all values combined
  const allValues = [...raw.paddings, ...raw.margins, ...raw.gaps];
  const freq = new Map<number, number>();
  for (const v of allValues) {
    const rounded = Math.round(v);
    freq.set(rounded, (freq.get(rounded) || 0) + 1);
  }

  // Take the most common values that form a reasonable scale
  const scale = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([v]) => v)
    .sort((a, b) => a - b);

  return {
    scale,
    paddingPatterns: paddingPatterns.slice(0, 20),
    marginPatterns: marginPatterns.slice(0, 20),
    gapPatterns: gapPatterns.slice(0, 20),
  };
}
