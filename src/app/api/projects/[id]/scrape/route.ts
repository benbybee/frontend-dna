import { NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/db";
import { projects, scrapeJobs } from "@/db/schema";
import { getAuthUserId } from "@/lib/auth";
import { executeScrapeJob } from "@/lib/scrape-job";
import { eq, and } from "drizzle-orm";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  const { id } = await params;

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, userId)),
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const failedJobs = await db
    .select()
    .from(scrapeJobs)
    .where(
      and(eq(scrapeJobs.projectId, id), eq(scrapeJobs.status, "failed"))
    );

  if (failedJobs.length === 0) {
    return NextResponse.json({ message: "No failed jobs to retry" });
  }

  for (const job of failedJobs) {
    await db
      .update(scrapeJobs)
      .set({ status: "pending", error: null })
      .where(eq(scrapeJobs.id, job.id));
  }

  after(async () => {
    await Promise.allSettled(
      failedJobs.map((job) => executeScrapeJob(job.id, job.url, id))
    );
  });

  return NextResponse.json({
    message: `Retrying ${failedJobs.length} failed job(s)`,
    jobs: failedJobs.map((j) => ({ id: j.id, url: j.url })),
  });
}
