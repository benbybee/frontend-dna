// ── Extraction Types ──────────────────────────────────────────────────────────
// Interfaces for all token shapes returned by individual extractors and the
// aggregated design system.

export interface CssVariableMap {
  [variableName: string]: string;
}

export interface TypeScaleEntry {
  element: string; // e.g. "h1", "p", "button"
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textTransform: string;
}

export interface TypographyTokens {
  fontFamilies: string[];
  typeScale: TypeScaleEntry[];
  fontSources: string[]; // Google Fonts URLs, @font-face srcs
}

export interface ColorEntry {
  hex: string;
  hsl: string;
  rgb: string;
  usage: "text" | "background" | "border" | "accent" | "unknown";
  frequency: number; // how many elements use this color
}

export interface ColorTokens {
  palette: ColorEntry[];
  cssVariableColors: Record<string, string>;
  backgrounds: string[];
  textColors: string[];
  borderColors: string[];
}

export interface SpacingPattern {
  value: string;
  pxValue: number;
  frequency: number;
}

export interface SpacingTokens {
  scale: number[]; // derived scale e.g. [4, 8, 12, 16, 24, 32, 48, 64]
  paddingPatterns: SpacingPattern[];
  marginPatterns: SpacingPattern[];
  gapPatterns: SpacingPattern[];
}

export interface ShadowTokens {
  boxShadows: string[];
  textShadows: string[];
}

export interface BorderTokens {
  radii: string[];
  widths: string[];
  styles: string[];
}

export interface BreakpointEntry {
  width: number;
  query: string;
}

export interface BreakpointTokens {
  breakpoints: BreakpointEntry[];
}

export interface KeyframeEntry {
  name: string;
  cssText: string;
}

export interface MotionTokens {
  transitions: string[];
  durations: string[];
  easings: string[];
  keyframes: KeyframeEntry[];
}

export interface AssetTokens {
  favicon: string | null;
  ogImage: string | null;
  logos: string[];
}

/** Raw tokens extracted from a single URL */
export interface RawTokens {
  url: string;
  cssVariables: CssVariableMap;
  typography: TypographyTokens;
  colors: ColorTokens;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
  borders: BorderTokens;
  breakpoints: BreakpointTokens;
  motion: MotionTokens;
  assets: AssetTokens;
  extractedAt: string; // ISO timestamp
}

/** Aggregated tokens merged from multiple URLs */
export interface AggregatedTokens {
  sourceUrls: string[];
  cssVariables: CssVariableMap;
  typography: TypographyTokens;
  colors: ColorTokens;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
  borders: BorderTokens;
  breakpoints: BreakpointTokens;
  motion: MotionTokens;
  assets: AssetTokens;
  conflicts: TokenConflict[];
}

export interface TokenConflict {
  variable: string;
  values: { url: string; value: string }[];
  resolved: string; // the value we chose
}
