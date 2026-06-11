import React from "react";
import { prisma } from "@/lib/db";
import RegistrationsClient from "./RegistrationsClient";

export default async function AdminRegistrationsPage() {
  const registrations = await prisma.registration.findMany({
    include: {
      event: { select: { id: true, title: true, slug: true, startDate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = registrations.map((reg) => ({
    id: reg.id,
    code: reg.code,
    eventId: reg.eventId,
    eventTitle: reg.event.title,
    eventSlug: reg.event.slug,
    eventDate: reg.event.startDate.toISOString().split("T")[0],
    name: reg.name,
    mobile: reg.mobile,
    email: reg.email,
    city: reg.city,
    attendeeCount: reg.attendeeCount,
    status: reg.status,
    consentEventUpdates: reg.consentEventUpdates,
    consentSimilarAlerts: reg.consentSimilarAlerts,
    notes: reg.notes,
    createdAt: reg.createdAt.toISOString(),
  }));

  return <RegistrationsClient registrations={serialized} />;
}
