import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyOrganizerSession } from "@/lib/actions";

// CSV export of an event's registrations — only for the owning organizer.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await verifyOrganizerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: { registrations: { orderBy: { createdAt: "desc" } } },
  });
  if (!event || event.organizerId !== session.organizerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const esc = (v: string | number | null | undefined) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [
    ["Code", "Name", "Mobile", "Email", "City", "Attendees", "Status", "Registered At"],
    ...event.registrations.map((r) => [
      r.code,
      r.name,
      r.mobile,
      r.email,
      r.city,
      r.attendeeCount,
      r.status,
      r.createdAt.toISOString(),
    ]),
  ];
  const csv = rows.map((row) => row.map(esc).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-registrations.csv"`,
    },
  });
}
