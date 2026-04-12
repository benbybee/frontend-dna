import { NextResponse } from "next/server";

// Temporary test endpoint — receives callbacks and stores the last one
// DELETE THIS after integration testing is complete

let lastCallback: unknown = null;

export async function POST(request: Request) {
  const body = await request.json();
  lastCallback = {
    receivedAt: new Date().toISOString(),
    headers: {
      "x-callback-secret": request.headers.get("x-callback-secret"),
    },
    body,
  };
  console.log("TEST CALLBACK RECEIVED:", JSON.stringify(lastCallback).substring(0, 500));
  return NextResponse.json({ ok: true });
}

export async function GET() {
  if (!lastCallback) {
    return NextResponse.json({ message: "No callback received yet" });
  }
  return NextResponse.json(lastCallback);
}
