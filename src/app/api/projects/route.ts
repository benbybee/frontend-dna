import { NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/db";
import { projects, scrapeJobs } from "@/db/schema";
import { createProjectSchema } from "@/lib/validators";
import { getAuthUserId } from "@/lib/auth";
import { executeScrapeJob } from "@/lib/scrape-job";
import { eq } from "drizzle-orm";

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

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(projects.createdAt);

  return NextResponse.json(userProjects);
}
