"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { runScanNowAction } from "@/lib/actions";
import {
  Radar,
  RefreshCw,
  Globe,
  CalendarCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Database,
} from "lucide-react";

interface ScanLogRow {
  id: string;
  source: string;
  query: string | null;
  trigger: string;
  status: string;
  found: number;
  created: number;
  updated: number;
  expired: number;
  message: string | null;
  startedAt: string;
  finishedAt: string | null;
}

interface AutoEventRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  startDate: string;
  venueName: string;
  cityName: string;
  categoryName: string;
  sourceName: string | null;
  sourceUrl: string | null;
  isVerified: boolean;
  createdAt: string;
}

interface Props {
  logs: ScanLogRow[];
  events: AutoEventRow[];
  stats: {
    totalAutoEvents: number;
    upcomingAutoEvents: number;
    lastSuccessfulScan: string | null;
    serpApiConfigured: boolean;
  };
}

const STATUS_BADGES: Record<string, string> = {
  SUCCESS: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  ERROR: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  SKIPPED: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  PARTIAL: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  PUBLISHED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  EXPIRED: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  DRAFT: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  WATCHLIST: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
};

function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase tracking-wide ${
        STATUS_BADGES[value] || "text-slate-400 bg-slate-500/10 border-slate-500/20"
      }`}
    >
      {value}
    </span>
  );
}

export default function AutoScanClient({ logs, events, stats }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const handleScanNow = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await runScanNowAction();
      if (res.success && res.summary) {
        const s = res.summary;
        setFeedback({
          ok: true,
          text: `Scan finished — found ${s.totalFound}, added ${s.totalCreated} new, refreshed ${s.totalUpdated}, expired ${s.expired} past events.`,
        });
      } else {
        setFeedback({ ok: false, text: res.error || "Scan failed. Check server logs." });
      }
      router.refresh();
    });
  };

  const statCards = [
    { label: "Auto-Scanned Events", value: stats.totalAutoEvents, icon: Database, color: "text-brand-glow bg-brand-accent/10" },
    { label: "Upcoming & Live", value: stats.upcomingAutoEvents, icon: CalendarCheck, color: "text-emerald-400 bg-emerald-500/10" },
    {
      label: "Last Successful Scan",
      value: stats.lastSuccessfulScan
        ? new Date(stats.lastSuccessfulScan).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        : "Never",
      icon: Clock,
      color: "text-cyan-400 bg-cyan-500/10",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-glow">
            Auto-Scan Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Radar className="w-7 h-7 text-brand-accent" /> Web Event Radar
          </h1>
          <p className="text-xs text-slate-500 font-semibold max-w-xl">
            Automatically scans the web (Google Events) for upcoming happenings across Odisha,
            publishes them to the site, and expires past events. Runs daily via cron — or trigger it now.
          </p>
        </div>
        <button
          onClick={handleScanNow}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-tr from-brand-accent to-brand-glow text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-brand-accent/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
          {isPending ? "Scanning the web..." : "Scan Now"}
        </button>
      </div>

      {/* Feedback + config warnings */}
      {feedback && (
        <div
          className={`flex items-start gap-2.5 p-4 rounded-2xl border text-xs font-bold ${
            feedback.ok
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/20 bg-rose-500/10 text-rose-300"
          }`}
        >
          {feedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{feedback.text}</span>
        </div>
      )}
      {!stats.serpApiConfigured && (
        <div className="flex items-start gap-2.5 p-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            SERPAPI_KEY is not configured, so web scanning is paused. Add a free key from serpapi.com
            to the Vercel project environment variables to activate the radar. Expiry cleanup still runs.
          </span>
        </div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
              </div>
              <div className="text-lg font-black text-white">{stat.value}</div>
            </div>
          );
        })}
      </section>

      {/* Discovered events list */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-accent" /> Discovered Events ({events.length})
          </h2>
          <Link
            href="/admin/dashboard/events"
            className="text-[10px] font-extrabold uppercase tracking-wider text-brand-glow hover:text-white transition-colors"
          >
            Manage in Events Panel →
          </Link>
        </div>
        <div className="glass-panel rounded-2xl border border-white/5 overflow-x-auto">
          {events.length === 0 ? (
            <p className="p-6 text-xs text-slate-500 font-semibold">
              No auto-scanned events yet. Hit “Scan Now” to fetch the latest events from the web.
            </p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5 font-extrabold">Event</th>
                  <th className="px-5 py-3.5 font-extrabold">City</th>
                  <th className="px-5 py-3.5 font-extrabold">Category</th>
                  <th className="px-5 py-3.5 font-extrabold">Date</th>
                  <th className="px-5 py-3.5 font-extrabold">Source</th>
                  <th className="px-5 py-3.5 font-extrabold">Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white max-w-[280px]">
                      <Link href={`/events/${ev.slug}`} target="_blank" className="hover:text-brand-glow transition-colors">
                        {ev.title}
                      </Link>
                      <div className="text-[10px] text-slate-500 font-semibold truncate">{ev.venueName}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-semibold whitespace-nowrap">{ev.cityName}</td>
                    <td className="px-5 py-3.5 text-slate-300 font-semibold whitespace-nowrap">{ev.categoryName}</td>
                    <td className="px-5 py-3.5 text-slate-300 font-semibold whitespace-nowrap">{ev.startDate}</td>
                    <td className="px-5 py-3.5 text-slate-300 font-semibold whitespace-nowrap">
                      {ev.sourceUrl ? (
                        <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-brand-glow transition-colors">
                          {ev.sourceName} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        ev.sourceName
                      )}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge value={ev.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Scan history */}
      <section className="space-y-4">
        <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-accent" /> Scan History
        </h2>
        <div className="glass-panel rounded-2xl border border-white/5 overflow-x-auto">
          {logs.length === 0 ? (
            <p className="p-6 text-xs text-slate-500 font-semibold">No scans recorded yet.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5 font-extrabold">When</th>
                  <th className="px-5 py-3.5 font-extrabold">Query</th>
                  <th className="px-5 py-3.5 font-extrabold">Trigger</th>
                  <th className="px-5 py-3.5 font-extrabold">Found</th>
                  <th className="px-5 py-3.5 font-extrabold">New</th>
                  <th className="px-5 py-3.5 font-extrabold">Updated</th>
                  <th className="px-5 py-3.5 font-extrabold">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-slate-300 font-semibold whitespace-nowrap">
                      {new Date(log.startedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-semibold max-w-[240px] truncate" title={log.message || undefined}>
                      {log.query}
                      {log.message && (
                        <div className="text-[10px] text-slate-500 font-semibold truncate">{log.message}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-semibold">{log.trigger}</td>
                    <td className="px-5 py-3.5 text-slate-300 font-semibold">{log.found}</td>
                    <td className="px-5 py-3.5 text-emerald-400 font-bold">{log.created}</td>
                    <td className="px-5 py-3.5 text-cyan-400 font-bold">{log.updated}</td>
                    <td className="px-5 py-3.5"><StatusBadge value={log.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
