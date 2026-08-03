"use client";

import React from "react";
import { Phone, MessageCircle, ChevronDown, Target, TrendingUp } from "lucide-react";
import { formatRupees } from "@/lib/brandlab/format";
import { updateKitRequestAction } from "./actions";

export interface InboxRow {
  id: string;
  refCode: string;
  intent: string;
  status: string;
  estimatedValue: number;
  band: "low" | "mid" | "high";
  items: string[];
  contactName: string | null;
  contactEmail: string | null;
  adminNotes: string | null;
  whatsappOpenedAt: string | null;
  createdAt: string;
  businessName: string;
  phone: string | null;
  category: string | null;
  logoUrl: string | null;
  renderUrls: string[];
}

interface Funnel {
  uploaded: number;
  viewed: number;
  opened: number;
  qualified: number;
  completionRate: number;
  conversionRate: number;
}

const STATUSES = ["new", "contacted", "quoted", "won", "lost"] as const;

const BAND_STYLE: Record<InboxRow["band"], string> = {
  high: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  mid: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  low: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

export default function BrandLabInboxClient({ rows, funnel }: { rows: InboxRow[]; funnel: Funnel }) {
  const [filter, setFilter] = React.useState<string>("all");
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<string | null>(null);

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const pipeline = visible.reduce((sum, row) => sum + row.estimatedValue, 0);

  const update = async (id: string, data: { status?: string; adminNotes?: string }) => {
    setPending(id);
    await updateKitRequestAction(id, data);
    setPending(null);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Brand Lab</h1>
        <p className="text-sm text-slate-400 mt-1">
          Kit requests, highest value first. Estimated value is internal — it is never shown to the client.
        </p>
      </header>

      {/* Phase 2 gate metrics (§10) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GateCard
          label="Kit completion"
          value={`${Math.round(funnel.completionRate * 100)}%`}
          target="Target 60%"
          hit={funnel.completionRate >= 0.6}
          icon={Target}
          detail={`${funnel.viewed} of ${funnel.uploaded} uploads reached the gallery`}
        />
        <GateCard
          label="Lead conversion"
          value={`${Math.round(funnel.conversionRate * 100)}%`}
          target="Target 20%"
          hit={funnel.conversionRate >= 0.2}
          icon={TrendingUp}
          detail={`${funnel.opened} of ${funnel.viewed} galleries opened WhatsApp`}
        />
        <GateCard
          label="Qualified leads"
          value={String(funnel.qualified)}
          target="Target 40 / 30 days"
          hit={funnel.qualified >= 40}
          icon={MessageCircle}
          detail="Kit requests in the last 30 days"
        />
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pipeline shown</p>
          <p className="mt-1 text-2xl font-bold text-white">{formatRupees(pipeline)}</p>
          <p className="mt-1 text-[11px] text-slate-500">{visible.length} requests</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", ...STATUSES].map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              filter === value
                ? "bg-brand-accent text-white"
                : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center text-sm text-slate-500">
          No kit requests yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((row) => (
            <li key={row.id} className="rounded-2xl border border-white/10 bg-slate-900 overflow-hidden">
              <button
                className="flex w-full items-center gap-4 p-4 text-left hover:bg-white/5"
                onClick={() => setExpanded(expanded === row.id ? null : row.id)}
              >
                {row.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.logoUrl}
                    alt=""
                    className="h-10 w-10 flex-none rounded-lg bg-white object-contain p-1"
                  />
                ) : (
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white/5 text-[10px] font-bold text-slate-500">
                    {row.businessName.slice(0, 2).toUpperCase()}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{row.businessName}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {row.refCode} · {row.intent.replace("_", " ")} · {row.items.length} items
                    {row.whatsappOpenedAt ? " · opened WhatsApp" : ""}
                  </p>
                </div>

                <span
                  className={`hidden flex-none rounded-lg border px-2.5 py-1 text-xs font-bold sm:block ${BAND_STYLE[row.band]}`}
                >
                  {formatRupees(row.estimatedValue)}
                </span>

                <span className="flex-none rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {row.status}
                </span>

                <ChevronDown
                  className={`h-4 w-4 flex-none text-slate-500 transition-transform ${
                    expanded === row.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expanded === row.id && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 text-xs text-slate-400">
                      <p>
                        <span className="text-slate-500">Phone:</span>{" "}
                        <span className="font-mono text-white">{row.phone ?? "—"}</span>
                      </p>
                      {row.contactName && (
                        <p><span className="text-slate-500">Name:</span> {row.contactName}</p>
                      )}
                      {row.contactEmail && (
                        <p><span className="text-slate-500">Email:</span> {row.contactEmail}</p>
                      )}
                      <p><span className="text-slate-500">Business type:</span> {row.category ?? "—"}</p>
                      <p>
                        <span className="text-slate-500">Created:</span>{" "}
                        {new Date(row.createdAt).toLocaleString("en-IN")}
                      </p>
                      <p className="pt-1"><span className="text-slate-500">Items:</span> {row.items.join(", ")}</p>
                    </div>

                    <div className="flex flex-wrap items-start gap-2">
                      {row.phone && (
                        <>
                          <a
                            href={`tel:${row.phone}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
                          >
                            <Phone className="h-3.5 w-3.5" /> Call
                          </a>
                          <a
                            href={`https://wa.me/91${row.phone}?text=${encodeURIComponent(
                              `Hi, this is First Page about your Brand Lab kit ${row.refCode}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {row.renderUrls.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {row.renderUrls.map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={url}
                          src={url}
                          alt=""
                          className="h-20 w-28 flex-none rounded-lg border border-white/10 object-cover"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((status) => (
                      <button
                        key={status}
                        disabled={pending === row.id}
                        onClick={() => update(row.id, { status })}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors disabled:opacity-50 ${
                          row.status === status
                            ? "bg-brand-accent text-white"
                            : "bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  <textarea
                    defaultValue={row.adminNotes ?? ""}
                    placeholder="Internal notes…"
                    rows={2}
                    onBlur={(e) => {
                      if (e.target.value !== (row.adminNotes ?? "")) {
                        void update(row.id, { adminNotes: e.target.value });
                      }
                    }}
                    className="w-full rounded-lg border border-white/10 bg-slate-950 p-3 text-xs text-white placeholder:text-slate-600 focus:border-brand-accent focus:outline-none"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GateCard({
  label,
  value,
  target,
  hit,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  target: string;
  hit: boolean;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <Icon className={`h-4 w-4 ${hit ? "text-emerald-400" : "text-slate-600"}`} />
      </div>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <p className={`mt-1 text-[11px] font-bold ${hit ? "text-emerald-400" : "text-slate-500"}`}>{target}</p>
      <p className="mt-1 text-[11px] text-slate-600">{detail}</p>
    </div>
  );
}
