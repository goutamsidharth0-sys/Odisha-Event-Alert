import React from "react";
import { prisma } from "@/lib/db";
import AutoScanClient from "./AutoScanClient";

export const maxDuration = 60;

export default async function AdminAutoScanPage() {
  const [scanLogs, autoEvents, autoEventCount, upcomingAutoCount, lastSuccess] =
    await Promise.all([
      prisma.scanLog.findMany({
        orderBy: { startedAt: "desc" },
        take: 25,
      }),
      prisma.event.findMany({
        where: { sourceName: { not: null } },
        include: {
          category: { select: { name: true } },
          city: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.event.count({ where: { sourceName: { not: null } } }),
      prisma.event.count({
        where: {
          sourceName: { not: null },
          status: "PUBLISHED",
          startDate: { gte: new Date() },
        },
      }),
      prisma.scanLog.findFirst({
        where: { status: "SUCCESS" },
        orderBy: { startedAt: "desc" },
      }),
    ]);

  const serializedLogs = scanLogs.map((log) => ({
    ...log,
    startedAt: log.startedAt.toISOString(),
    finishedAt: log.finishedAt ? log.finishedAt.toISOString() : null,
  }));

  const serializedEvents = autoEvents.map((ev) => ({
    id: ev.id,
    title: ev.title,
    slug: ev.slug,
    status: ev.status,
    startDate: ev.startDate.toISOString().split("T")[0],
    venueName: ev.venueName,
    cityName: ev.city.name,
    categoryName: ev.category.name,
    sourceName: ev.sourceName,
    sourceUrl: ev.sourceUrl,
    isVerified: ev.isVerified,
    createdAt: ev.createdAt.toISOString(),
  }));

  return (
    <AutoScanClient
      logs={serializedLogs}
      events={serializedEvents}
      stats={{
        totalAutoEvents: autoEventCount,
        upcomingAutoEvents: upcomingAutoCount,
        lastSuccessfulScan: lastSuccess ? lastSuccess.startedAt.toISOString() : null,
        serpApiConfigured: Boolean(process.env.SERPAPI_KEY),
      }}
    />
  );
}
