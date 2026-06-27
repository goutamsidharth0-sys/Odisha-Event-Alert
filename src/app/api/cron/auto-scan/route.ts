import { NextResponse } from "next/server";
import { runAutoScan } from "@/lib/scanner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  // Verify Vercel Cron authentication. Fail CLOSED in production: the endpoint
  // mutates the database, so a missing/incorrect secret is always rejected
  // (Vercel sends `Authorization: Bearer $CRON_SECRET` once CRON_SECRET is set).
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const summary = await runAutoScan("CRON");
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error("Cron auto-scan error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
