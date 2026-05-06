import { NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/db";
import { projects, scrapeJobs } from "@/db/schema";
import { extractWebhookSchema } from "@/lib/validators";
import { executeScrapeJob } from "@/lib/scrape-job";
import { eq } from "drizzle-orm";
import { generateMarkdown } from "@/lib/prompt-generator/generate-markdown";
import { aggregateTokens } from "@/lib/extraction/aggregator";
import type { RawTokens, AggregatedTokens } from "@/lib/extraction/types";

export const maxDuration = 60;

/**
 * POST /api/extract
 *
 * Webhook endpoint for external systems to request design extraction.
 * Accepts URLs, runs extraction in the background, and POSTs results
 * to the callbackUrl when complete.
 *
 * Auth: x-api-key header must match INTERNAL_API_SECRET
 *
 * Request body:
 * {
 *   urls: string[],           // 1-10 URLs to scrape
 *   callbackUrl: string,      // Where to POST results when done
 *   callbackSecret: string,   // Secret sent back in x-callback-secret header
 *   metadata?: Record<string, unknown>  // Passed through to callback unchanged
 * }
 *
 * Immediate response: { ok: true, projectId: string }
 *
 * Callback payload (POST to callbackUrl):
 * {
 *   status: "completed" | "failed",
 *   projectId: string,
 *   designMd: string | null,       // The generated DESIGN.md content
 *   tokens: AggregatedTokens | null, // Raw token data
 *   metadata: Record<string, unknown> | null, // Passthrough from request
 *   errors: string[]               // Per-URL error messages
 * }
 */
export async function POST(request: Request) {
  // Auth check
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = extractWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { urls, callbackUrl, callbackSecret, metadata } = parsed.data;

  // Create project for tracking
  const [project] = await db
    .insert(projects)
    .values({
      userId: "webhook",
      name: `Extract: ${urls[0]}`,
      urls,
    })
    .returning();

  // Create scrape jobs
  const jobs = await db
    .insert(scrapeJobs)
    .values(urls.map((url) => ({ projectId: project.id, url })))
    .returning();

  // Run extraction in background, then callback.
  // We run all jobs in PARALLEL (not sequentially) so multi-URL requests
  // don't compound their durations against the 60s function budget.
  // Each Browserbase session runs concurrently, total time ≈ max(URL times),
  // not sum of them.
  after(async () => {
    // Run all jobs in parallel; allSettled so one failure doesn't abort the rest
    await Promise.allSettled(
      jobs.map((job) => executeScrapeJob(job.id, job.url, project.id))
    );

    // Gather results
    const allJobs = await db
      .select()
      .from(scrapeJobs)
      .where(eq(scrapeJobs.projectId, project.id));

    const completedJobs = allJobs.filter((j) => j.status === "completed");
    const failedJobs = allJobs.filter((j) => j.status === "failed");
    const errors = failedJobs.map(
      (j) => `${j.url}: ${j.error || "Unknown error"}`
    );

    let designMd: string | null = null;
    let aggregated: AggregatedTokens | null = null;

    if (completedJobs.length > 0) {
      const tokenSets = completedJobs.map((j) => j.rawTokens as RawTokens);
      aggregated = aggregateTokens(tokenSets);
      designMd = generateMarkdown(aggregated);
    }

    // Send callback
    try {
      await fetch(callbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-callback-secret": callbackSecret,
        },
        body: JSON.stringify({
          status: completedJobs.length > 0 ? "completed" : "failed",
          projectId: project.id,
          designMd,
          tokens: aggregated,
          metadata: metadata || null,
          errors,
        }),
      });
    } catch (error) {
      console.error("Failed to send callback:", error);
    }
  });

  // Respond immediately
  return NextResponse.json(
    { ok: true, projectId: project.id },
    { status: 202 }
  );
}
