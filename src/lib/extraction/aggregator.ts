import type {
  RawTokens,
  AggregatedTokens,
  TokenConflict,
  ColorEntry,
  TypeScaleEntry,
  SpacingPattern,
} from "./types";

/**
 * Merges RawTokens from multiple URLs into a single AggregatedTokens object.
 * Handles deduplication, conflict detection for CSS variables, and frequency-based ranking.
 */
export function aggregateTokens(tokenSets: RawTokens[]): AggregatedTokens {
  if (tokenSets.length === 0) {
    throw new Error("Cannot aggregate empty token sets");
  }

  if (tokenSets.length === 1) {
    const t = tokenSets[0];
    return {
      sourceUrls: [t.url],
      cssVariables: t.cssVariables,
      typography: t.typography,
      colors: t.colors,
      spacing: t.spacing,
      shadows: t.shadows,
      borders: t.borders,
      breakpoints: t.breakpoints,
      motion: t.motion,
      assets: t.assets,
      conflicts: [],
    };
  }

  const sourceUrls = tokenSets.map((t) => t.url);

  // ── CSS Variables: merge + detect conflicts ──────────────────────
  const conflicts: TokenConflict[] = [];
  const cssVariables: Record<string, string> = {};
  const varValues = new Map<string, Map<string, string[]>>();

  for (const t of tokenSets) {
    for (const [key, value] of Object.entries(t.cssVariables)) {
      if (!varValues.has(key)) varValues.set(key, new Map());
      const urlMap = varValues.get(key)!;
      if (!urlMap.has(value)) urlMap.set(value, []);
      urlMap.get(value)!.push(t.url);
    }
  }

  for (const [variable, valueMap] of varValues) {
    const entries = Array.from(valueMap.entries());
    if (entries.length > 1) {
      // Conflict: pick the most common value
      const sorted = entries.sort((a, b) => b[1].length - a[1].length);
      cssVariables[variable] = sorted[0][0];
      conflicts.push({
        variable,
        values: entries.map(([value, urls]) => ({ url: urls[0], value })),
        resolved: sorted[0][0],
      });
    } else {
      cssVariables[variable] = entries[0][0];
    }
  }

  // ── Typography: union fonts, merge type scales ──────────────────
  const fontFamilySet = new Set<string>();
  const fontSourceSet = new Set<string>();
  const typeScaleMap = new Map<string, TypeScaleEntry>();

  for (const t of tokenSets) {
    for (const f of t.typography.fontFamilies) fontFamilySet.add(f);
    for (const s of t.typography.fontSources) fontSourceSet.add(s);
    for (const entry of t.typography.typeScale) {
      const key = `${entry.element}|${entry.fontSize}`;
      if (!typeScaleMap.has(key)) {
        typeScaleMap.set(key, entry);
      }
    }
  }

  // ── Colors: union + deduplicate by hex ──────────────────────────
  const colorMap = new Map<string, ColorEntry>();
  const allCssVarColors: Record<string, string> = {};

  for (const t of tokenSets) {
    for (const c of t.colors.palette) {
      const existing = colorMap.get(c.hex);
      if (existing) {
        existing.frequency += c.frequency;
      } else {
        colorMap.set(c.hex, { ...c });
      }
    }
    Object.assign(allCssVarColors, t.colors.cssVariableColors);
  }

  const mergedPalette = Array.from(colorMap.values()).sort(
    (a, b) => b.frequency - a.frequency
  );

  // ── Spacing: recalculate from combined data ─────────────────────
  const allPadding: SpacingPattern[] = [];
  const allMargin: SpacingPattern[] = [];
  const allGap: SpacingPattern[] = [];
  const scaleFreq = new Map<number, number>();

  for (const t of tokenSets) {
    allPadding.push(...t.spacing.paddingPatterns);
    allMargin.push(...t.spacing.marginPatterns);
    allGap.push(...t.spacing.gapPatterns);
    for (const v of t.spacing.scale) {
      scaleFreq.set(v, (scaleFreq.get(v) || 0) + 1);
    }
  }

  const mergedScale = Array.from(scaleFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([v]) => v)
    .sort((a, b) => a - b);

  // ── Shadows: union + deduplicate ────────────────────────────────
  const boxShadowSet = new Set<string>();
  const textShadowSet = new Set<string>();
  for (const t of tokenSets) {
    for (const s of t.shadows.boxShadows) boxShadowSet.add(s);
    for (const s of t.shadows.textShadows) textShadowSet.add(s);
  }

  // ── Borders: union + deduplicate ────────────────────────────────
  const radiiSet = new Set<string>();
  const widthSet = new Set<string>();
  const styleSet = new Set<string>();
  for (const t of tokenSets) {
    for (const r of t.borders.radii) radiiSet.add(r);
    for (const w of t.borders.widths) widthSet.add(w);
    for (const s of t.borders.styles) styleSet.add(s);
  }

  // ── Breakpoints: union + deduplicate by width ──────────────────
  const bpMap = new Map<number, string>();
  for (const t of tokenSets) {
    for (const bp of t.breakpoints.breakpoints) {
      if (!bpMap.has(bp.width)) bpMap.set(bp.width, bp.query);
    }
  }

  // ── Motion: union + deduplicate ─────────────────────────────────
  const transitionSet = new Set<string>();
  const durationSet = new Set<string>();
  const easingSet = new Set<string>();
  const keyframeMap = new Map<string, string>();
  for (const t of tokenSets) {
    for (const tr of t.motion.transitions) transitionSet.add(tr);
    for (const d of t.motion.durations) durationSet.add(d);
    for (const e of t.motion.easings) easingSet.add(e);
    for (const k of t.motion.keyframes) {
      if (!keyframeMap.has(k.name)) keyframeMap.set(k.name, k.cssText);
    }
  }

  // ── Assets: prefer first non-null ───────────────────────────────
  const logoSet = new Set<string>();
  let favicon: string | null = null;
  let ogImage: string | null = null;
  for (const t of tokenSets) {
    if (!favicon && t.assets.favicon) favicon = t.assets.favicon;
    if (!ogImage && t.assets.ogImage) ogImage = t.assets.ogImage;
    for (const l of t.assets.logos) logoSet.add(l);
  }

  return {
    sourceUrls,
    cssVariables,
    typography: {
      fontFamilies: Array.from(fontFamilySet),
      typeScale: Array.from(typeScaleMap.values()).sort(
        (a, b) => parseFloat(b.fontSize) - parseFloat(a.fontSize)
      ),
      fontSources: Array.from(fontSourceSet),
    },
    colors: {
      palette: mergedPalette,
      cssVariableColors: allCssVarColors,
      backgrounds: mergedPalette.filter((c) => c.usage === "background").map((c) => c.hex),
      textColors: mergedPalette.filter((c) => c.usage === "text").map((c) => c.hex),
      borderColors: mergedPalette.filter((c) => c.usage === "border").map((c) => c.hex),
    },
    spacing: {
      scale: mergedScale,
      paddingPatterns: dedupePatterns(allPadding).slice(0, 20),
      marginPatterns: dedupePatterns(allMargin).slice(0, 20),
      gapPatterns: dedupePatterns(allGap).slice(0, 20),
    },
    shadows: {
      boxShadows: Array.from(boxShadowSet),
      textShadows: Array.from(textShadowSet),
    },
    borders: {
      radii: Array.from(radiiSet).sort(),
      widths: Array.from(widthSet).sort(),
      styles: Array.from(styleSet).sort(),
    },
    breakpoints: {
      breakpoints: Array.from(bpMap.entries())
        .map(([width, query]) => ({ width, query }))
        .sort((a, b) => a.width - b.width),
    },
    motion: {
      transitions: Array.from(transitionSet),
      durations: Array.from(durationSet),
      easings: Array.from(easingSet),
      keyframes: Array.from(keyframeMap.entries()).map(([name, cssText]) => ({
        name,
        cssText,
      })),
    },
    assets: { favicon, ogImage, logos: Array.from(logoSet) },
    conflicts,
  };
}

function dedupePatterns(patterns: SpacingPattern[]): SpacingPattern[] {
  const map = new Map<number, SpacingPattern>();
  for (const p of patterns) {
    const existing = map.get(p.pxValue);
    if (existing) {
      existing.frequency += p.frequency;
    } else {
      map.set(p.pxValue, { ...p });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.frequency - a.frequency);
}
