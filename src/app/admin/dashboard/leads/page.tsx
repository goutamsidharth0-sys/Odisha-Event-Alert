import React from "react";
import { prisma } from "@/lib/db";
import LeadsClient from "./LeadsClient";

export default async function AdminLeadsPage() {
  const [leads, subscribers] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Serialize dates for client compatibility
  const serializedLeads = leads.map((lead) => ({
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  }));

  const serializedSubscribers = subscribers.map((sub) => ({
    ...sub,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
  }));

  return (
    <LeadsClient
      leads={serializedLeads}
      subscribers={serializedSubscribers}
    />
  );
}
