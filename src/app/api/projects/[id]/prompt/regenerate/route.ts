import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, extractedTokens, generatedPrompts } from "@/db/schema";
import { getAuthUserId, projectOwnerFilter } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { generateMarkdown } from "@/lib/prompt-generator/generate-markdown";
import type { AggregatedTokens } from "@/lib/extraction/types";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  const { id } = await params;

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), projectOwnerFilter(userId)),
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const tokens = await db.query.extractedTokens.findFirst({
    where: eq(extractedTokens.projectId, id),
  });

  if (!tokens) {
    return NextResponse.json(
      { error: "No extracted tokens found" },
      { status: 404 }
    );
  }

  const latestPrompt = await db.query.generatedPrompts.findFirst({
    where: eq(generatedPrompts.projectId, id),
    orderBy: [desc(generatedPrompts.version)],
  });

  const newVersion = (latestPrompt?.version ?? 0) + 1;

  const aggregated: AggregatedTokens = {
    sourceUrls: project.urls as string[],
    cssVariables: tokens.rawCssVariables as Record<string, string>,
    typography: tokens.typography as AggregatedTokens["typography"],
    colors: tokens.colors as AggregatedTokens["colors"],
    spacing: tokens.spacing as AggregatedTokens["spacing"],
    shadows: tokens.shadows as AggregatedTokens["shadows"],
    borders: tokens.borders as AggregatedTokens["borders"],
    breakpoints: tokens.breakpoints as AggregatedTokens["breakpoints"],
    motion: tokens.motion as AggregatedTokens["motion"],
    assets: tokens.assets as AggregatedTokens["assets"],
    components: (tokens.components as AggregatedTokens["components"]) || { buttons: [], cards: [], inputs: [], nav: null },
    conflicts: [],
  };

  const markdown = generateMarkdown(aggregated);

  const [prompt] = await db
    .insert(generatedPrompts)
    .values({
      projectId: id,
      tokensId: tokens.id,
      markdown,
      version: newVersion,
    })
    .returning();

  return NextResponse.json(prompt, { status: 201 });
}
