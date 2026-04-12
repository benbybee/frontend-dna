import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { getAuthUserId } from "@/lib/auth";
import { eq, and, or } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  const { id } = await params;

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), or(eq(projects.userId, userId), eq(projects.userId, "webhook"))),
    with: {
      scrapeJobs: true,
      extractedTokens: true,
      generatedPrompts: {
        orderBy: (prompts, { desc }) => [desc(prompts.version)],
        limit: 1,
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  const { id } = await params;

  const deleted = await db
    .delete(projects)
    .where(and(eq(projects.id, id), or(eq(projects.userId, userId), eq(projects.userId, "webhook"))))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
