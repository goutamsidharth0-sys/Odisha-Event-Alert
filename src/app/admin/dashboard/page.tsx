import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Calendar, ClipboardList, Inbox, Users, ArrowUpRight, TrendingUp, HelpCircle } from "lucide-react";

export default async function AdminDashboardOverview() {
  // Query statistics in parallel
  const [
    totalEvents,
    publishedCount,
    pendingSubmissions,
    watchlistCount,
    leadsCount,
    subscribersCount,
    recentSubmissions,
    recentLeads,
  ] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.eventSubmission.count({ where: { status: "PENDING" } }),
    prisma.event.count({ where: { status: "WATCHLIST" } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.subscriber.count({ where: { status: "ACTIVE" } }),
    prisma.eventSubmission.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.lead.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Total Events", value: totalEvents, icon: Calendar, color: "text-brand-glow bg-brand-accent/10" },
    { label: "Published Live", value: publishedCount, icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10" },
    { label: "Pending Submissions", value: pendingSubmissions, icon: ClipboardList, color: "text-orange-400 bg-orange-500/10" },
    { label: "Watchlist Radar", value: watchlistCount, icon: HelpCircle, color: "text-cyan-400 bg-cyan-500/10" },
    { label: "Active Leads", value: leadsCount, icon: Inbox, color: "text-brand-glow bg-brand-glow/10" },
    { label: "Subscribers", value: subscribersCount, icon: Users, color: "text-white bg-slate-900" },
  ];

  return (
    <div className="space-y-10">
      {/* Header Banners */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-glow">
          Dashboard Panel
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          System Overview
        </h1>
        <p className="text-xs text-slate-500 font-semibold">
          Real-time analytical metrics and visitor data logs for Odisha Event Alert.
        </p>
      </div>

      {/* Stats Counter Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                  {stat.label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
              </div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
            </div>
          );
        })}
      </section>

      {/* QUICK LOGS ACTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Recent Pending Submissions */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-l-4 border-brand-accent pl-3">
              Pending Organizer Submissions ({pendingSubmissions})
            </h3>
            <Link
              href="/admin/dashboard/submissions"
              className="text-[10px] font-bold text-brand-glow hover:text-brand-accent uppercase tracking-wider flex items-center gap-1.5 group"
            >
              <span>Review Portal</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {recentSubmissions.length > 0 ? (
            <div className="divide-y divide-white/5 text-xs font-semibold">
              {recentSubmissions.map((sub) => (
                <div key={sub.id} className="py-4 flex justify-between items-start gap-4">
                  <div className="space-y-1 truncate">
                    <div className="text-white font-bold truncate">{sub.eventTitle}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {sub.organizerName} • {sub.city} • {sub.category}
                    </div>
                  </div>
                  <Link
                    href="/admin/dashboard/submissions"
                    className="px-3 py-1.5 rounded-lg bg-brand-accent/15 border border-brand-accent/20 text-[10px] font-bold text-brand-glow hover:bg-brand-accent hover:text-white transition-all shrink-0"
                  >
                    Approve
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-semibold py-8 text-center">
              No pending event submissions to review! You are all caught up.
            </p>
          )}
        </div>

        {/* Recent Advertising Leads */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-l-4 border-brand-accent pl-3">
              New Advertisement Leads ({leadsCount})
            </h3>
            <Link
              href="/admin/dashboard/leads"
              className="text-[10px] font-bold text-brand-glow hover:text-brand-accent uppercase tracking-wider flex items-center gap-1.5 group"
            >
              <span>Leads Panel</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {recentLeads.length > 0 ? (
            <div className="divide-y divide-white/5 text-xs font-semibold">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="py-4 flex justify-between items-start gap-4">
                  <div className="space-y-1 truncate">
                    <div className="text-white font-bold">{lead.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
                      {lead.companyName || "Personal"} • {lead.leadType}
                    </div>
                  </div>
                  <Link
                    href="/admin/dashboard/leads"
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/5 text-[10px] font-bold text-slate-300 hover:border-brand-accent/30 transition-all shrink-0"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-semibold py-8 text-center">
              No new advertising inquiries or sponsorship leads at this time.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
