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
    // Navigate to the URL.
    // We use "domcontentloaded" rather than "networkidle" because many sites
    // (RotoRooter, sites with chat widgets, analytics heartbeats, etc.) keep
    // the network active indefinitely and never reach an idle state — that
    // would cause the page.goto call to time out before extraction even runs.
    await session.page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // After DOM is ready, give the page a brief settle window so async CSS,
    // fonts, and CSS-in-JS have a chance to register before we read computed
    // styles. We don't wait for full network idle.
    try {
      await session.page.waitForLoadState("load", { timeout: 8000 });
    } catch {
      // Continue even if the load event takes too long — we have what we need.
    }
    await session.page.waitForTimeout(1500);

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
