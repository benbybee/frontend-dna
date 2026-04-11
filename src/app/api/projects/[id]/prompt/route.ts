import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, generatedPrompts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

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

  const prompt = await db.query.generatedPrompts.findFirst({
    where: eq(generatedPrompts.projectId, id),
    orderBy: [desc(generatedPrompts.version)],
  });

  if (!prompt) {
    return NextResponse.json(
      { error: "Prompt not yet generated. Scraping may still be in progress." },
      { status: 404 }
    );
  }

  return NextResponse.json(prompt);
}
