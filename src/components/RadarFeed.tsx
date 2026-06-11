"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { OeaVerifiedBadge, WatchlistBadge, priceLabel } from "./badges";
import TiltCard from "./TiltCard";

export interface RadarEvent {
  id: string;
  title: string;
  slug: string;
  startDate: string; // ISO
  venueName: string;
  cityName: string;
  categoryName: string;
  categorySlug: string;
  priceType: string;
  minPrice: number | null;
  isVerified: boolean;
  isFeatured: boolean;
  status: string;
}

interface Props {
  events: RadarEvent[];
}

// The mockup's radar feed: month tabs + category chips filtering in-memory.
export default function RadarFeed({ events }: Props) {
  const months = useMemo(() => {
    const list: { key: string; label: string; title: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      list.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: `${d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()} ’${String(d.getFullYear()).slice(2)}`,
        title: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      });
    }
    return list;
  }, []);

  const categories = useMemo(() => {
    const set = new Map<string, string>();
    for (const e of events) set.set(e.categorySlug, e.categoryName);
    return [["all", "All"], ...Array.from(set.entries()).slice(0, 8)] as [string, string][];
  }, [events]);

  const [activeMonth, setActiveMonth] = useState(months[0].key);
  const [activeCat, setActiveCat] = useState("all");

  const filtered = events.filter((e) => {
    const d = new Date(e.startDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    return key === activeMonth && (activeCat === "all" || e.categorySlug === activeCat);
  });

  const monthTitle = months.find((m) => m.key === activeMonth)?.title || "";

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-7">
      {/* Head */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display font-semibold text-xl tracking-tight text-ink">{monthTitle}</h2>
          <p className="text-muted text-xs font-semibold mt-0.5">
            Scanned from the web & verified listings — refreshed daily
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(([slug, name]) => (
            <button
              key={slug}
              onClick={() => setActiveCat(slug)}
              className={`chip-btn ${activeCat === slug ? "on" : ""}`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Month tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {months.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveMonth(m.key)}
            className={`mono-tab ${activeMonth === m.key ? "on" : ""}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 px-4">
          <b className="block font-display text-ink text-lg mb-1.5">Nothing matches yet</b>
          <p className="text-muted text-sm font-semibold">
            Try another month or category — or check the full Explore page for everything on the radar.
          </p>
          <Link
            href="/events"
            className="inline-block mt-4 px-6 py-2.5 rounded-xl glow-btn text-xs font-bold font-display text-white uppercase tracking-wider"
          >
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.slice(0, 12).map((e) => {
            const d = new Date(e.startDate);
            const dateLabel = d.toLocaleDateString("en-US", {
              weekday: "short",
              day: "2-digit",
              month: "short",
            });
            return (
              <TiltCard key={e.id} className="rounded-2xl">
                <Link
                  href={`/events/${e.slug}`}
                  className="block h-full rounded-2xl glass-panel p-5 hover:border-brand-accent/45 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <span className="font-mono text-xs text-brand-accent">{dateLabel}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-accent/12 text-brand-accent">
                      {e.categoryName}
                    </span>
                    <span className="ml-auto">
                      {e.status === "WATCHLIST" ? <WatchlistBadge /> : e.isVerified ? <OeaVerifiedBadge /> : null}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-base leading-snug text-ink line-clamp-2 mb-1.5">
                    {e.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-muted text-xs font-semibold mb-4 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {e.venueName}, {e.cityName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-display font-semibold text-sm ${
                        e.priceType === "FREE" ? "text-brand-accent" : "text-ink"
                      }`}
                    >
                      {priceLabel(e.priceType, e.minPrice)}
                    </span>
                    <span className="px-3.5 py-1.5 rounded-lg bg-brand-accent text-white text-xs font-bold font-display">
                      {e.priceType === "FREE" ? "Register on OEA" : "Register Interest"}
                    </span>
                  </div>
                </Link>
              </TiltCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
