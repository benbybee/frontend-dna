import {
  createBrowserSession,
  closeBrowserSession,
} from "@/lib/browserbase/client";
import { extractCssVariables } from "./extractors/css-variables";
import { extractTypography } from "./extractors/typography";
import { extractColors } from "./extractors/colors";
import { extractSpacing } from "./extractors/spacing";
import { extractShadows } from "./extractors/shadows";
import { extractBorders } from "./extractors/borders";
import { extractBreakpoints } from "./extractors/breakpoints";
import { extractMotion } from "./extractors/motion";
import { extractAssets } from "./extractors/assets";
import { extractComponents } from "./extractors/components";
import type { RawTokens } from "./types";

export interface PipelineResult {
  tokens: RawTokens;
  sessionId: string;
  durationMs: number;
}

export async function runExtractionPipeline(url: string): Promise<PipelineResult> {
  const startTime = Date.now();
  const session = await createBrowserSession();

  try {
    // Navigate to the URL and wait for the page to be fully loaded
    await session.page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Run all extractors sequentially (they share the same page context)
    const [
      cssVariables,
      typography,
      colors,
      spacing,
      shadows,
      borders,
      breakpoints,
      motion,
      assets,
      components,
    ] = await Promise.all([
      extractCssVariables(session.page),
      extractTypography(session.page),
      extractColors(session.page),
      extractSpacing(session.page),
      extractShadows(session.page),
      extractBorders(session.page),
      extractBreakpoints(session.page),
      extractMotion(session.page),
      extractAssets(session.page),
      extractComponents(session.page),
    ]);

    const tokens: RawTokens = {
      url,
      cssVariables,
      typography,
      colors,
      spacing,
      shadows,
      borders,
      breakpoints,
      motion,
      assets,
      components,
      extractedAt: new Date().toISOString(),
    };

    const durationMs = Date.now() - startTime;

    return {
      tokens,
      sessionId: session.sessionId,
      durationMs,
    };
  } finally {
    await closeBrowserSession(session);
  }
}
