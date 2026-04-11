import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";
import type { Page, Browser } from "playwright-core";

const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY!,
});

export interface BrowserSession {
  sessionId: string;
  browser: Browser;
  page: Page;
}

export async function createBrowserSession(): Promise<BrowserSession> {
  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
  });

  const browser = await chromium.connectOverCDP(session.connectUrl);
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  return {
    sessionId: session.id,
    browser,
    page,
  };
}

export async function closeBrowserSession(session: BrowserSession): Promise<void> {
  try {
    await session.page.close();
    await session.browser.close();
  } catch {
    // Browser may already be closed
  }
}
