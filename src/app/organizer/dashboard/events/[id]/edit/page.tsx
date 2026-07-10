import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyOrganizerSession } from "@/lib/actions";
import OrganizerEventForm from "../../OrganizerEventForm";

export default async function EditOrganizerEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await verifyOrganizerSession())!;

  const [event, categories, cities] = await Promise.all([
    prisma.event.findUnique({ where: { id } }),
    prisma.category.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.city.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!event || event.organizerId !== session.organizerId) notFound();

  return (
    <>
      <h1 className="text-lg font-black text-white">Edit Event</h1>
      <OrganizerEventForm
        categories={categories}
        cities={cities}
        event={{
          id: event.id,
          title: event.title,
          description: event.description,
          categoryId: event.categoryId,
          cityId: event.cityId,
          startDate: event.startDate.toISOString().split("T")[0],
          endDate: event.endDate ? event.endDate.toISOString().split("T")[0] : undefined,
          startTime: event.startTime || undefined,
          endTime: event.endTime || undefined,
          venueName: event.venueName,
          address: event.address || undefined,
          googleMapUrl: event.googleMapUrl || undefined,
          priceType: event.priceType,
          registrationUrl: event.registrationUrl || undefined,
          officialUrl: event.officialUrl || undefined,
          instagramUrl: event.instagramUrl || undefined,
          posterUrl: event.posterUrl || undefined,
        }}
      />
    </>
  );
}
