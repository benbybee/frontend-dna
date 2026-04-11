// MVP dev auth — returns a hardcoded userId
// TODO: Replace with Clerk auth() before production launch

export async function getAuthUserId(): Promise<string> {
  // When Clerk is configured, replace this with:
  // import { auth } from "@clerk/nextjs/server";
  // const { userId } = await auth();
  // if (!userId) throw new Error("Unauthorized");
  // return userId;

  return "dev-user";
}
