import { NextResponse } from "next/server";
import { db } from "@/db";
import { scrapeJobs, extractedTokens, generatedPrompts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { internalScrapeSchema } from "@/lib/validators";
import { runExtractionPipeline } from "@/lib/extraction/pipeline";
import { aggregateTokens } from "@/lib/extraction/aggregator";
import { generateMarkdown } from "@/lib/prompt-generator/generate-markdown";
import type { RawTokens } from "@/lib/extraction/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  // Validate internal secret
  const secret = request.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = internalScrapeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { jobId, url, projectId } = parsed.data;

  // Mark job as running
  await db
    .update(scrapeJobs)
    .set({ status: "running" })
    .where(eq(scrapeJobs.id, jobId));

  try {
    // Run the extraction pipeline
    const result = await runExtractionPipeline(url);

    // Mark job as completed with raw tokens
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
      // Aggregate tokens from all completed jobs
      const completedJobs = allJobs.filter((j) => j.status === "completed");
      const tokenSets = completedJobs.map((j) => j.rawTokens as RawTokens);

      if (tokenSets.length > 0) {
        const aggregated = aggregateTokens(tokenSets);

        // Store aggregated tokens
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

        // Generate the markdown prompt
        const markdown = generateMarkdown(aggregated);

        await db.insert(generatedPrompts).values({
          projectId,
          tokensId: tokens.id,
          markdown,
          version: 1,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Mark job as failed
    const message =
      error instanceof Error ? error.message : "Unknown error";
    await db
      .update(scrapeJobs)
      .set({
        status: "failed",
        error: message,
        completedAt: new Date(),
      })
      .where(eq(scrapeJobs.id, jobId));

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
