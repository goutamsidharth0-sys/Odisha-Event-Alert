import React from "react";
import { prisma } from "@/lib/db";
import EventsCrudClient from "./EventsCrudClient";

export default async function AdminEventsPage() {
  // Fetch events with relations
  const events = await prisma.event.findMany({
    include: {
      category: { select: { id: true, name: true } },
      city: { select: { id: true, name: true } },
      organizer: { select: { id: true, name: true } },
    },
    orderBy: { startDate: "asc" },
  });

  // Fetch categories
  const categories = await prisma.category.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
  });

  // Fetch cities
  const cities = await prisma.city.findMany({
    where: { status: "ACTIVE" },
  });

  // Fetch organizers
  const organizers = await prisma.organizer.findMany({
    orderBy: { name: "asc" },
  });

  // Convert Date objects to ISO strings for client compatibility
  const serializedEvents = events.map((ev) => ({
    ...ev,
    startDate: ev.startDate.toISOString().split("T")[0],
    endDate: ev.endDate ? ev.endDate.toISOString().split("T")[0] : null,
    createdAt: ev.createdAt.toISOString(),
    updatedAt: ev.updatedAt.toISOString(),
    publishedAt: ev.publishedAt ? ev.publishedAt.toISOString() : null,
  }));

  return (
    <EventsCrudClient
      events={serializedEvents}
      categories={categories}
      cities={cities}
      organizers={organizers}
    />
  );
}
