"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { updateRegistrationStatusAction, deleteRegistrationAction } from "@/lib/actions";
import { Ticket, Download, Trash2, Phone, Mail, MapPin, Users, CheckCircle } from "lucide-react";

interface RegistrationRow {
  id: string;
  code: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  eventDate: string;
  name: string;
  mobile: string;
  email: string | null;
  city: string | null;
  attendeeCount: number;
  status: string;
  consentEventUpdates: boolean;
  consentSimilarAlerts: boolean;
  notes: string | null;
  createdAt: string;
}

const STATUSES = ["REGISTERED", "PENDING", "CONFIRMED", "WAITLISTED", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  REGISTERED: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  PENDING: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  CONFIRMED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  WAITLISTED: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  CANCELLED: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

function toCsv(rows: RegistrationRow[]): string {
  const headers = [
    "Code",
    "Event",
    "Event Date",
    "Name",
    "Mobile",
    "Email",
    "City",
    "Attendees",
    "Status",
    "Event Updates Consent",
    "Similar Alerts Consent",
    "Registered At",
  ];
  const esc = (v: string | number | boolean | null) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [
      r.code,
      r.eventTitle,
      r.eventDate,
      r.name,
      r.mobile,
      r.email,
      r.city,
      r.attendeeCount,
      r.status,
      r.consentEventUpdates ? "YES" : "NO",
      r.consentSimilarAlerts ? "YES" : "NO",
      new Date(r.createdAt).toLocaleString("en-IN"),
    ]
      .map(esc)
      .join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

export default function RegistrationsClient({ registrations: initial }: { registrations: RegistrationRow[] }) {
  const [registrations, setRegistrations] = useState(initial);
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const events = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of registrations) map.set(r.eventId, r.eventTitle);
    return Array.from(map.entries());
  }, [registrations]);

  const filtered = registrations.filter(
    (r) =>
      (eventFilter === "all" || r.eventId === eventFilter) &&
      (statusFilter === "all" || r.status === statusFilter)
  );

  const handleStatusChange = async (id: string, status: string) => {
    const res = await updateRegistrationStatusAction(id, status);
    if (res.success) {
      setRegistrations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } else {
      alert(res.error || "Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this registration permanently?")) return;
    const res = await deleteRegistrationAction(id);
    if (res.success) {
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert(res.error || "Failed to delete registration.");
    }
  };

  const handleExport = () => {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oea-registrations-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const totalAttendees = filtered.reduce((n, r) => n + r.attendeeCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-glow">
            Interest Registrations
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-brand-accent" /> Event Registrations
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            {filtered.length} registrations · {totalAttendees} expected attendees
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-tr from-brand-accent to-brand-glow text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-brand-accent/20 hover:opacity-90 transition-all disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="bg-slate-900 border border-white/10 text-slate-200 text-xs font-bold rounded-xl px-4 py-2.5 max-w-xs"
        >
          <option value="all">All Events ({registrations.length})</option>
          {events.map(([id, title]) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-white/10 text-slate-200 text-xs font-bold rounded-xl px-4 py-2.5"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-x-auto bg-slate-900/60">
        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Ticket className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">
              No registrations yet. They will appear here as users register interest on event pages.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5 font-extrabold">Code</th>
                <th className="px-5 py-3.5 font-extrabold">Attendee</th>
                <th className="px-5 py-3.5 font-extrabold">Event</th>
                <th className="px-5 py-3.5 font-extrabold">People</th>
                <th className="px-5 py-3.5 font-extrabold">Registered</th>
                <th className="px-5 py-3.5 font-extrabold">Status</th>
                <th className="px-5 py-3.5 font-extrabold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((reg) => (
                <tr key={reg.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-mono text-[11px] text-brand-glow whitespace-nowrap">{reg.code}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-white">{reg.name}</div>
                    <div className="text-[10px] text-slate-500 font-semibold flex flex-wrap items-center gap-x-2.5 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" /> {reg.mobile}
                      </span>
                      {reg.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5" /> {reg.email}
                        </span>
                      )}
                      {reg.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {reg.city}
                        </span>
                      )}
                      {reg.consentSimilarAlerts && (
                        <span className="inline-flex items-center gap-1 text-emerald-500">
                          <CheckCircle className="w-2.5 h-2.5" /> similar alerts
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 max-w-[220px]">
                    <Link
                      href={`/events/${reg.eventSlug}`}
                      target="_blank"
                      className="font-semibold text-slate-300 hover:text-brand-glow transition-colors line-clamp-2"
                    >
                      {reg.eventTitle}
                    </Link>
                    <div className="text-[10px] text-slate-500 font-semibold">{reg.eventDate}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 font-bold">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" /> {reg.attendeeCount}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-semibold whitespace-nowrap">
                    {new Date(reg.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={reg.status}
                      onChange={(e) => handleStatusChange(reg.id, e.target.value)}
                      className={`text-[10px] font-extrabold uppercase tracking-wide rounded-lg border px-2 py-1.5 bg-slate-950 ${STATUS_COLORS[reg.status] || "text-slate-400 border-white/10"}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleDelete(reg.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Delete registration"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
