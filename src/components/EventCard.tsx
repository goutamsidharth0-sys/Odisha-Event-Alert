import React from "react";
import Link from "next/link";
import { MapPin, Ticket } from "lucide-react";
import { OeaVerifiedBadge, WatchlistBadge, FeaturedBadge, priceLabel } from "./badges";

export interface EventCardProps {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  startTime: string | null;
  venueName: string;
  city: { name: string; slug: string };
  category: { name: string; slug: string };
  priceType: string;
  minPrice: number | null;
  posterUrl: string | null;
  isFeatured?: boolean;
  isVerified?: boolean;
  status?: string;
  organizerType?: string;
}

export default function EventCard({
  title,
  slug,
  shortDescription,
  startDate,
  venueName,
  city,
  category,
  priceType,
  minPrice,
  posterUrl,
  isFeatured,
  isVerified,
  status,
}: EventCardProps) {
  const dateObj = new Date(startDate);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString("en-US", { month: "short" });
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });

  const isWatchlist = status === "WATCHLIST";

  const priceColor =
    priceType === "FREE"
      ? "text-emerald-600 dark:text-emerald-400"
      : priceType === "PAID"
        ? "text-brand-accent dark:text-brand-glow"
        : priceType === "REGISTRATION_REQUIRED"
          ? "text-cyan-600 dark:text-cyan-400"
          : "text-muted";

  return (
    <div
      className={`relative h-full rounded-2xl overflow-hidden glass-panel glass-panel-hover flex flex-col group ${
        isFeatured ? "glow-border" : ""
      }`}
    >
      {/* Event Poster Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-card-line bg-brand-navy/10">
        <img
          src={
            posterUrl ||
            (isWatchlist
              ? "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800&auto=format&fit=crop"
              : "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800&auto=format&fit=crop")
          }
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Date Overlay Badge */}
        <div className="absolute top-3.5 left-3.5 date-badge px-3 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-12 shadow shadow-black/40 font-mono">
          <span className="text-lg font-bold leading-none">{day}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider">{month}</span>
        </div>

        {/* Top-right badges */}
        <div className="absolute top-3.5 right-3.5 flex flex-col gap-1.5 items-end">
          <span className="bg-brand-navy/80 backdrop-blur text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow font-mono">
            {category.name}
          </span>
          {isFeatured && <FeaturedBadge />}
        </div>

        {/* Verification status (blueprint §8.2) */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {isVerified && <OeaVerifiedBadge className="backdrop-blur bg-emerald-950/60" />}
          {isWatchlist && <WatchlistBadge className="backdrop-blur bg-amber-950/50" />}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
        <div className="space-y-2">
          {/* Date + Venue line */}
          <div className="flex items-center gap-2 text-xs font-mono text-brand-accent">
            <span>
              {weekday} {day} {month}
            </span>
            <span className="text-card-line">·</span>
            <span className="flex items-center gap-1 text-muted truncate font-sans font-semibold">
              <MapPin className="w-3.5 h-3.5 text-brand-accent shrink-0" />
              <span className="truncate">
                {venueName}, {city.name}
              </span>
            </span>
          </div>

          {/* Event Title */}
          <h3 className="text-base font-display font-bold text-ink leading-snug line-clamp-2 group-hover:text-brand-accent transition-colors duration-200">
            {title}
          </h3>

          {shortDescription && (
            <p className="text-xs text-muted leading-relaxed font-semibold line-clamp-2">
              {shortDescription}
            </p>
          )}
        </div>

        {/* Price & CTA Row */}
        <div className="flex items-center justify-between pt-3 border-t border-card-line">
          <div className="flex items-center gap-1.5 text-xs">
            <Ticket className="w-3.5 h-3.5 text-brand-accent shrink-0" />
            <span className={`font-display font-semibold ${priceColor}`}>
              {priceLabel(priceType, minPrice)}
            </span>
          </div>

          <Link
            href={`/events/${slug}`}
            className="px-4 py-2 rounded-xl text-xs font-bold font-display bg-chip hover:bg-brand-accent hover:text-white border border-card-line hover:border-brand-accent text-ink transition-all duration-300"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
