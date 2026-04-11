import { NextResponse } from "next/server";
import { internalScrapeSchema } from "@/lib/validators";
import { executeScrapeJob } from "@/lib/scrape-job";

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

  await executeScrapeJob(jobId, url, projectId);

  return NextResponse.json({ success: true });
}
