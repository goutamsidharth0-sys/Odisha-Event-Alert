import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

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
  let landingRoutes: MetadataRoute.Sitemap = [];
  try {
    const [events, cities, categories] = await Promise.all([
      prisma.event.findMany({
        where: { status: { in: ["PUBLISHED", "WATCHLIST"] } },
        select: { slug: true, updatedAt: true },
        orderBy: { startDate: "asc" },
        take: 500,
      }),
      prisma.city.findMany({ where: { status: "ACTIVE" }, select: { slug: true } }),
      prisma.category.findMany({ where: { status: "ACTIVE" }, select: { slug: true } }),
    ]);
    eventRoutes = events.map((e) => ({
      url: `${SITE_URL}/events/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    landingRoutes = [
      ...cities.map((c) => ({
        url: `${SITE_URL}/city/${c.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.9,
      })),
      ...categories.map((c) => ({
        url: `${SITE_URL}/category/${c.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.9,
      })),
    ];
  } catch {
    // DB unavailable (e.g. build without env) — static routes still ship
  }

  return [...staticRoutes, ...landingRoutes, ...eventRoutes];
}
