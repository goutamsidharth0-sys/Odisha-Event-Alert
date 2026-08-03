import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteObjects, pathFromPublicUrl, storageEnabled } from "@/lib/brandlab/storage";

// Purge unconverted renders after 30 days (§9).
//
// A visitor who uploaded a logo, looked at the gallery and left costs storage
// every day they are kept. A visitor who reached a kit request is a lead, and
// their renders stay — the team needs to see what the client fell in love with
// when they call.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RETENTION_DAYS = 30;

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  try {
    const stale = await prisma.brandRender.findMany({
      where: { convertedAt: null, createdAt: { lt: cutoff } },
      select: { id: true, previewUrl: true, hiresUrl: true },
      take: 1000,
    });

    let objectsDeleted = 0;
    if (storageEnabled() && stale.length > 0) {
      const paths = stale
        .flatMap((render) => [render.previewUrl, render.hiresUrl])
        .filter((url): url is string => Boolean(url))
        .map(pathFromPublicUrl)
        .filter((path): path is string => Boolean(path));
      objectsDeleted = await deleteObjects(paths);
    }

    const { count } = await prisma.brandRender.deleteMany({
      where: { id: { in: stale.map((r) => r.id) } },
    });

    // Brands that never converted and have no renders left are just an orphan
    // row with a business name on it. Drop them too.
    const orphans = await prisma.brand.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        kitRequests: { none: {} },
        renders: { none: {} },
      },
    });

    return NextResponse.json({
      success: true,
      rendersDeleted: count,
      objectsDeleted,
      brandsDeleted: orphans.count,
    });
  } catch (error) {
    console.error("Brand Lab purge error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
