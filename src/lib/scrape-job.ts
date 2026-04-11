import { db } from "@/db";
import { scrapeJobs, extractedTokens, generatedPrompts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { runExtractionPipeline } from "@/lib/extraction/pipeline";
import { aggregateTokens } from "@/lib/extraction/aggregator";
import { generateMarkdown } from "@/lib/prompt-generator/generate-markdown";
import type { RawTokens } from "@/lib/extraction/types";

/**
 * Runs extraction for a single scrape job. Call this directly —
 * no HTTP round-trip needed.
 */
export async function executeScrapeJob(
  jobId: string,
  url: string,
  projectId: string
): Promise<void> {
  // Mark job as running
  await db
    .update(scrapeJobs)
    .set({ status: "running" })
    .where(eq(scrapeJobs.id, jobId));

  try {
    const result = await runExtractionPipeline(url);

    // Mark job as completed
    await db
      .update(scrapeJobs)
      .set({
        status: "completed",
        rawTokens: result.tokens,
        browserbaseSessionId: result.sessionId,
        durationMs: result.durationMs,
        completedAt: new Date(),
      })
      .where(eq(scrapeJobs.id, jobId));

    // Check if all jobs for this project are done
    const allJobs = await db
      .select()
      .from(scrapeJobs)
      .where(eq(scrapeJobs.projectId, projectId));

    const allDone = allJobs.every(
      (j) => j.status === "completed" || j.status === "failed"
    );

    if (allDone) {
      const completedJobs = allJobs.filter((j) => j.status === "completed");
      const tokenSets = completedJobs.map((j) => j.rawTokens as RawTokens);

      if (tokenSets.length > 0) {
        const aggregated = aggregateTokens(tokenSets);

        const [tokens] = await db
          .insert(extractedTokens)
          .values({
            projectId,
            typography: aggregated.typography,
            colors: aggregated.colors,
            spacing: aggregated.spacing,
            shadows: aggregated.shadows,
            borders: aggregated.borders,
            breakpoints: aggregated.breakpoints,
            motion: aggregated.motion,
            assets: aggregated.assets,
            rawCssVariables: aggregated.cssVariables,
          })
          .onConflictDoUpdate({
            target: extractedTokens.projectId,
            set: {
              typography: aggregated.typography,
              colors: aggregated.colors,
              spacing: aggregated.spacing,
              shadows: aggregated.shadows,
              borders: aggregated.borders,
              breakpoints: aggregated.breakpoints,
              motion: aggregated.motion,
              assets: aggregated.assets,
              rawCssVariables: aggregated.cssVariables,
            },
          })
          .returning();

        const markdown = generateMarkdown(aggregated);

        await db.insert(generatedPrompts).values({
          projectId,
          tokensId: tokens.id,
          markdown,
          version: 1,
        });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await db
      .update(scrapeJobs)
      .set({
        status: "failed",
        error: message,
        completedAt: new Date(),
      })
      .where(eq(scrapeJobs.id, jobId));
  }
}
