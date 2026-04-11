import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, scrapeJobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
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

  const jobs = await db
    .select({
      id: scrapeJobs.id,
      url: scrapeJobs.url,
      status: scrapeJobs.status,
      error: scrapeJobs.error,
      durationMs: scrapeJobs.durationMs,
    })
    .from(scrapeJobs)
    .where(eq(scrapeJobs.projectId, id));

  const total = jobs.length;
  const completed = jobs.filter((j) => j.status === "completed").length;
  const failed = jobs.filter((j) => j.status === "failed").length;
  const allDone = completed + failed === total;

  return NextResponse.json({
    jobs,
    summary: { total, completed, failed, allDone },
  });
}
