import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/db";
import { projects, scrapeJobs } from "@/db/schema";
import { createProjectSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Fire-and-forget: trigger scraping for each job
  after(async () => {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    for (const job of jobs) {
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
            projectId: project.id,
          }),
        });
      } catch (error) {
        console.error(`Failed to trigger scrape for ${job.url}:`, error);
      }
    }
  });

  return NextResponse.json({ project, jobs }, { status: 201 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(projects.createdAt);

  return NextResponse.json(userProjects);
}
