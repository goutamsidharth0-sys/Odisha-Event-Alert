import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.odishaeventalert.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/events",
    "/submit-event",
    "/advertise",
    "/about",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" || path === "/events" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/events" ? 0.9 : 0.5,
  }));

  let eventRoutes: MetadataRoute.Sitemap = [];
  try {
    const events = await prisma.event.findMany({
      where: { status: { in: ["PUBLISHED", "WATCHLIST"] } },
      select: { slug: true, updatedAt: true },
      orderBy: { startDate: "asc" },
      take: 500,
    });
    eventRoutes = events.map((e) => ({
      url: `${SITE_URL}/events/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB unavailable (e.g. build without env) — static routes still ship
  }

  return [...staticRoutes, ...eventRoutes];
}
