import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/db";
import { projects, scrapeJobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, userId)),
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Get failed jobs to retry
  const failedJobs = await db
    .select()
    .from(scrapeJobs)
    .where(
      and(eq(scrapeJobs.projectId, id), eq(scrapeJobs.status, "failed"))
    );

  if (failedJobs.length === 0) {
    return NextResponse.json({ message: "No failed jobs to retry" });
  }

  // Reset failed jobs to pending
  for (const job of failedJobs) {
    await db
      .update(scrapeJobs)
      .set({ status: "pending", error: null })
      .where(eq(scrapeJobs.id, job.id));
  }

  // Re-trigger scraping
  after(async () => {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    for (const job of failedJobs) {
      try {
        await fetch(`${baseUrl}/api/internal/scrape`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_API_SECRET!,
          },
          body: JSON.stringify({
            jobId: job.id,
            url: job.url,
            projectId: id,
          }),
        });
      } catch (error) {
        console.error(`Failed to retry scrape for ${job.url}:`, error);
      }
    }
  });

  return NextResponse.json({
    message: `Retrying ${failedJobs.length} failed job(s)`,
    jobs: failedJobs.map((j) => ({ id: j.id, url: j.url })),
  });
}
