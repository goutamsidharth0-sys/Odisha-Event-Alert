import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Lightweight view counter. Called once per session per viewer from the client
// so the event detail page can stay a cached static file (no per-render DB write).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.event
    .update({ where: { id }, data: { viewsCount: { increment: 1 } } })
    .catch(() => {});
  return NextResponse.json({ ok: true });
}
