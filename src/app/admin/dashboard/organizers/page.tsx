import React from "react";
import { prisma } from "@/lib/db";
import OrganizersClient from "./OrganizersClient";

export default async function AdminOrganizersPage() {
  const organizers = await prisma.organizer.findMany({
    include: {
      user: { select: { email: true, status: true } },
      _count: { select: { events: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <OrganizersClient
      organizers={organizers.map((o) => ({
        id: o.id,
        name: o.name,
        contactPerson: o.contactPerson,
        phone: o.phone,
        email: o.email,
        status: o.status,
        eventCount: o._count.events,
        loginEmail: o.user?.email || null,
      }))}
    />
  );
}
