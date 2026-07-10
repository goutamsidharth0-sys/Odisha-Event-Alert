import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyOrganizerSession } from "@/lib/actions";
import { Download } from "lucide-react";

export default async function OrganizerRegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await verifyOrganizerSession())!;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { registrations: { orderBy: { createdAt: "desc" } } },
  });
  if (!event || event.organizerId !== session.organizerId) notFound();

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-black text-white">{event.title}</h1>
          <p className="text-xs text-slate-500 font-semibold">
            {event.registrations.length} registration(s)
          </p>
        </div>
        <a
          href={`/api/organizer/events/${event.id}/registrations`}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl glow-btn text-[11px] font-extrabold uppercase tracking-wider text-white"
        >
          <Download className="w-3.5 h-3.5" /> Download CSV
        </a>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-white/10 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/10">
              <th className="px-4 py-3 font-bold">Code</th>
              <th className="px-4 py-3 font-bold">Name</th>
              <th className="px-4 py-3 font-bold">Mobile</th>
              <th className="px-4 py-3 font-bold">Email</th>
              <th className="px-4 py-3 font-bold">City</th>
              <th className="px-4 py-3 font-bold text-right">Attendees</th>
              <th className="px-4 py-3 font-bold">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {event.registrations.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-mono text-[10px] text-brand-accent">{r.code}</td>
                <td className="px-4 py-3 font-bold text-white">{r.name}</td>
                <td className="px-4 py-3 font-semibold">{r.mobile}</td>
                <td className="px-4 py-3 font-semibold">{r.email || "—"}</td>
                <td className="px-4 py-3 font-semibold">{r.city || "—"}</td>
                <td className="px-4 py-3 text-right font-bold">{r.attendeeCount}</td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold">
                  {r.createdAt.toISOString().split("T")[0]}
                </td>
              </tr>
            ))}
            {event.registrations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-semibold">
                  No registrations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
