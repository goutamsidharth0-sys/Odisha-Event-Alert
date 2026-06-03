import React from "react";
import { prisma } from "@/lib/db";
import SubmissionsClient from "./SubmissionsClient";

export default async function AdminSubmissionsPage() {
  const submissions = await prisma.eventSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Serialize dates for client compatibility
  const serializedSubmissions = submissions.map((sub) => ({
    ...sub,
    startDate: sub.startDate.toISOString().split("T")[0],
    endDate: sub.endDate ? sub.endDate.toISOString().split("T")[0] : null,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
  }));

  return <SubmissionsClient submissions={serializedSubmissions} />;
}
