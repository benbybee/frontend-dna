import type { Page } from "playwright-core";
import type { ColorTokens, ColorEntry } from "../types";

const ELEMENT_SELECTORS =
  "h1, h2, h3, h4, h5, h6, p, a, span, li, button, input, div, section, header, footer, nav, main, aside, article, label";

export async function extractColors(page: Page): Promise<ColorTokens> {
  return page.evaluate((selectors) => {
    // ── Color parsing helpers (must be inside evaluate) ──────────────
    function rgbToHex(r: number, g: number, b: number): string {
      return (
        "#" +
        [r, g, b]
          .map((x) => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          })
          .join("")
      );
    }

    function parseRgb(str: string): { r: number; g: number; b: number; a: number } | null {
      const match = str.match(
        /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/
      );
      if (!match) return null;
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] ? parseFloat(match[4]) : 1,
      };
    }

    function rgbToHsl(
      r: number,
      g: number,
      b: number
    ): { h: number; s: number; l: number } {
      r /= 255;
      g /= 255;
      b /= 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      let h = 0;
      let s = 0;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
          case g:
            h = ((b - r) / d + 2) / 6;
            break;
          case b:
            h = ((r - g) / d + 4) / 6;
            break;
        }
      }

      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
      };
    }

    // ── Collect colors from computed styles ──────────────────────────
    const colorMap = new Map<
      string,
      { hex: string; hsl: string; rgb: string; usage: Set<string>; count: number }
    >();

    function addColor(raw: string, usage: string) {
      const parsed = parseRgb(raw);
      if (!parsed || parsed.a === 0) return;
      // Skip pure black and pure white (usually default/reset)
      if (
        (parsed.r === 0 && parsed.g === 0 && parsed.b === 0) ||
        (parsed.r === 255 && parsed.g === 255 && parsed.b === 255)
      )
        return;

      const hex = rgbToHex(parsed.r, parsed.g, parsed.b);
      const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
      const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

      const existing = colorMap.get(hex);
      if (existing) {
        existing.usage.add(usage);
        existing.count++;
      } else {
        colorMap.set(hex, {
          hex,
          hsl: hslStr,
          rgb: raw,
          usage: new Set([usage]),
          count: 1,
        });
      }
    }

    const elements = document.querySelectorAll(selectors);
    for (const el of Array.from(elements)) {
      const style = getComputedStyle(el);
      addColor(style.color, "text");
      addColor(style.backgroundColor, "background");
      addColor(style.borderColor, "border");
    }

    // ── Extract CSS variable colors ─────────────────────────────────
    const cssVariableColors: Record<string, string> = {};
    const rootStyles = getComputedStyle(document.documentElement);
    for (const prop of Array.from(rootStyles)) {
      if (prop.startsWith("--")) {
        const value = rootStyles.getPropertyValue(prop).trim();
        // Check if value looks like a color
        if (
          value.startsWith("#") ||
          value.startsWith("rgb") ||
          value.startsWith("hsl") ||
          /^[a-z]+$/i.test(value)
        ) {
          cssVariableColors[prop] = value;
        }
      }
    }

    // ── Build palette ───────────────────────────────────────────────
    const palette: ColorEntry[] = Array.from(colorMap.values())
      .map((c) => {
        const usages = Array.from(c.usage);
        let primary: ColorEntry["usage"] = "unknown";
        if (usages.includes("text")) primary = "text";
        else if (usages.includes("background")) primary = "background";
        else if (usages.includes("border")) primary = "border";
        return {
          hex: c.hex,
          hsl: c.hsl,
          rgb: c.rgb,
          usage: primary,
          frequency: c.count,
        };
      })
      .sort((a, b) => b.frequency - a.frequency);

    const backgrounds = palette
      .filter((c) => c.usage === "background")
      .map((c) => c.hex);
    const textColors = palette
      .filter((c) => c.usage === "text")
      .map((c) => c.hex);
    const borderColors = palette
      .filter((c) => c.usage === "border")
      .map((c) => c.hex);

    return {
      palette,
      cssVariableColors,
      backgrounds,
      textColors,
      borderColors,
    };
  }, ELEMENT_SELECTORS);
}
