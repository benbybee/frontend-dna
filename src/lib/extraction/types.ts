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
  components: ComponentTokens;
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
  components: ComponentTokens;
  conflicts: TokenConflict[];
}

export interface TokenConflict {
  variable: string;
  values: { url: string; value: string }[];
  resolved: string; // the value we chose
}

// ── Component Tokens ──────────────────────────────────────────────────────────

export interface ComponentStyle {
  background: string;
  color: string;
  padding: string;
  borderRadius: string;
  border: string;
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  lineHeight: string;
  boxShadow: string;
  cursor: string;
  textTransform: string;
  letterSpacing: string;
  transition: string;
}

export interface ButtonComponent {
  variant: string; // "primary", "secondary", "ghost", "outline"
  selector: string; // CSS selector or description
  default: Partial<ComponentStyle>;
  hover?: Partial<ComponentStyle>;
  text: string; // visible button text
}

export interface CardComponent {
  selector: string;
  styles: Partial<ComponentStyle>;
}

export interface InputComponent {
  type: string; // "text", "email", "select", etc.
  selector: string;
  default: Partial<ComponentStyle>;
  focus?: Partial<ComponentStyle>;
  placeholder: string;
  labelStyles?: Partial<ComponentStyle>;
}

export interface NavComponent {
  position: string;
  background: string;
  backdropFilter: string;
  linkStyles: Partial<ComponentStyle>;
  ctaStyles?: Partial<ComponentStyle>;
  height: string;
  borderBottom: string;
}

export interface ComponentTokens {
  buttons: ButtonComponent[];
  cards: CardComponent[];
  inputs: InputComponent[];
  nav: NavComponent | null;
}

// ── Elevation System ──────────────────────────────────────────────────────────

export interface ElevationLevel {
  name: string; // "Flat", "Subtle", "Standard", "Elevated", "Deep"
  level: number;
  shadow: string;
  usage: string; // description of when to use
}
