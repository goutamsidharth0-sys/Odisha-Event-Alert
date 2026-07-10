import React from "react";
import { prisma } from "@/lib/db";
import OrganizerEventForm from "../OrganizerEventForm";

export default async function NewOrganizerEventPage() {
  const [categories, cities] = await Promise.all([
    prisma.category.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.city.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <h1 className="text-lg font-black text-white">Create Event</h1>
      <OrganizerEventForm categories={categories} cities={cities} />
    </>
  );
}
