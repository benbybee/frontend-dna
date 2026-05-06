// MVP dev auth — returns a hardcoded userId
// TODO: Replace with Clerk auth() before production launch

import { eq, or } from "drizzle-orm";
import { projects } from "@/db/schema";

export async function getAuthUserId(): Promise<string> {
  // When Clerk is configured, replace this with:
  // import { auth } from "@clerk/nextjs/server";
  // const { userId } = await auth();
  // if (!userId) throw new Error("Unauthorized");
  // return userId;

  return "dev-user";
}

/**
 * Returns a Drizzle WHERE clause that matches projects owned by the
 * current user OR by the "webhook" pseudo-user (extractions kicked off
 * via /api/extract). Use this everywhere a project lookup needs to
 * include both manual and webhook-sourced projects.
 */
export function projectOwnerFilter(userId: string) {
  return or(eq(projects.userId, userId), eq(projects.userId, "webhook"));
}
