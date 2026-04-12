import { NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/db";
import { projects, scrapeJobs } from "@/db/schema";
import { createProjectSchema } from "@/lib/validators";
import { getAuthUserId } from "@/lib/auth";
import { executeScrapeJob } from "@/lib/scrape-job";
import { eq, or } from "drizzle-orm";

export async function POST(request: Request) {
  const userId = await getAuthUserId();

  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, urls } = parsed.data;

  // Create project
  const [project] = await db
    .insert(projects)
    .values({ userId, name, urls })
    .returning();

  // Create scrape jobs for each URL
  const jobs = await db
    .insert(scrapeJobs)
    .values(urls.map((url) => ({ projectId: project.id, url })))
    .returning();

  // Fire-and-forget: run extraction directly (no HTTP self-request)
  after(async () => {
    for (const job of jobs) {
      await executeScrapeJob(job.id, job.url, project.id);
    }
  });

  return NextResponse.json({ project, jobs }, { status: 201 });
}

export async function GET() {
  const userId = await getAuthUserId();

  const userProjects = await db.query.projects.findMany({
    where: or(eq(projects.userId, userId), eq(projects.userId, "webhook")),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
    with: {
      scrapeJobs: {
        columns: { id: true, status: true },
      },
      generatedPrompts: {
        columns: { id: true },
        limit: 1,
      },
    },
  });

  // Enrich with status summary
  const enriched = userProjects.map((p) => {
    const total = p.scrapeJobs.length;
    const completed = p.scrapeJobs.filter((j) => j.status === "completed").length;
    const failed = p.scrapeJobs.filter((j) => j.status === "failed").length;
    const allDone = total > 0 && completed + failed === total;
    const hasPrompt = p.generatedPrompts.length > 0;
    const isWebhook = p.userId === "webhook";

    return {
      id: p.id,
      name: p.name,
      urls: p.urls,
      createdAt: p.createdAt,
      status: {
        total,
        completed,
        failed,
        allDone,
        hasPrompt,
        isWebhook,
      },
    };
  });

  return NextResponse.json(enriched);
}
