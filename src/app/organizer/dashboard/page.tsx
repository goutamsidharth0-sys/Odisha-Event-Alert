import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  verifyOrganizerSession,
  deleteOrganizerEventAction,
  archiveOrganizerEventAction,
  duplicateOrganizerEventAction,
} from "@/lib/actions";
import { Eye, Share2, Ticket, Pencil, Copy, Archive, Trash2, Users } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  DRAFT: "bg-slate-500/10 text-slate-400 border-slate-500/25",
  EXPIRED: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  REJECTED: "bg-rose-500/10 text-rose-400 border-rose-500/25",
};

export default async function OrganizerDashboardPage() {
  const session = (await verifyOrganizerSession())!;

  const events = await prisma.event.findMany({
    where: { organizerId: session.organizerId },
    include: {
      city: { select: { name: true } },
      category: { select: { name: true } },
      _count: { select: { registrations: true } },
    },
    orderBy: { startDate: "desc" },
    take: 100,
  });

  const totals = events.reduce(
    (acc, e) => ({
      views: acc.views + e.viewsCount,
      shares: acc.shares + e.shareCount,
      registrations: acc.registrations + e._count.registrations,
    }),
    { views: 0, shares: 0, registrations: 0 }
  );

  const stats = [
    { label: "Total Views", value: totals.views, icon: Eye },
    { label: "Total Shares", value: totals.shares, icon: Share2 },
    { label: "Total Registrations", value: totals.registrations, icon: Ticket },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-5 rounded-2xl bg-slate-900 border border-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/15 text-brand-accent flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white leading-none">{value}</div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">My Events</h2>
          <Link
            href="/organizer/dashboard/events/new"
            className="px-4 py-2 rounded-xl glow-btn text-[11px] font-extrabold uppercase tracking-wider text-white"
          >
            + New Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900 border border-white/10 text-center text-sm text-slate-500 font-semibold">
            No events yet. Create your first event — complete details (poster, address, links) publish instantly.
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900 border border-white/10 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/10">
                  <th className="px-4 py-3 font-bold">Event</th>
                  <th className="px-4 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Views</th>
                  <th className="px-4 py-3 font-bold text-right">Shares</th>
                  <th className="px-4 py-3 font-bold text-right">Reg.</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {events.map((e) => (
                  <tr key={e.id} className="text-slate-300">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{e.title}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        {e.category.name} · {e.city.name} · {e.venueName}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold">
                      {e.startDate.toISOString().split("T")[0]}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-lg border text-[10px] font-extrabold ${STATUS_STYLES[e.status] || STATUS_STYLES.DRAFT}`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{e.viewsCount}</td>
                    <td className="px-4 py-3 text-right font-bold">{e.shareCount}</td>
                    <td className="px-4 py-3 text-right font-bold">{e._count.registrations}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/organizer/dashboard/events/${e.id}/registrations`}
                          title="Registrations"
                          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/organizer/dashboard/events/${e.id}/edit`}
                          title="Edit"
                          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <form
                          action={async () => {
                            "use server";
                            await duplicateOrganizerEventAction(e.id);
                          }}
                        >
                          <button title="Duplicate" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await archiveOrganizerEventAction(e.id);
                          }}
                        >
                          <button title="Archive" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-amber-400">
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await deleteOrganizerEventAction(e.id);
                          }}
                        >
                          <button title="Delete" className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-rose-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
