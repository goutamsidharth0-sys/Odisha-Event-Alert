import React from "react";
import { CheckCircle2, Radar, Star, Megaphone, BadgeCheck } from "lucide-react";

// Single source of truth for the blueprint's status labels and price chips.

export function OeaVerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25 ${className || ""}`}
    >
      <CheckCircle2 className="w-3 h-3" /> OEA Verified
    </span>
  );
}

export function WatchlistBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-gold/15 text-amber-600 dark:text-gold border border-amber-500/25 ${className || ""}`}
    >
      <Radar className="w-3 h-3" /> Watchlist
    </span>
  );
}

export function FeaturedBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-brand-accent text-white ${className || ""}`}
    >
      <Star className="w-3 h-3 fill-current" /> Featured
    </span>
  );
}

export function priceLabel(priceType: string, minPrice?: number | null): string {
  switch (priceType) {
    case "FREE":
      return "Free Entry";
    case "PAID":
      return minPrice && minPrice > 0 ? `₹${minPrice} onwards` : "Paid Event";
    case "REGISTRATION_REQUIRED":
      return "Registration Required";
    default:
      return "Price TBA";
  }
}

// ---------------------------------------------------------------------------
// Transparency: where the listing came from + how confirmed it is.
// Mapped from the existing sourceName / status / isVerified fields so users can
// instantly judge each listing's provenance and confidence.
// ---------------------------------------------------------------------------

// Source: Official Organiser / BookMyShow / District / Instagram /
// Government Website / Venue Page / Other Verified Source
export function sourceLabel(sourceName?: string | null, organizerType?: string): string {
  const s = (sourceName || "").toLowerCase();
  if (s.includes("bookmyshow")) return "BookMyShow";
  if (s.includes("instagram")) return "Instagram";
  if (s.includes("district")) return "District Administration";
  if (s.includes("tourism") || s.includes("government") || s.includes("gov.") || s.includes(".gov"))
    return "Government Website";
  if (s.includes("venue")) return "Venue Page";
  if (s.includes("google")) return "Public Event Listing";
  if (sourceName && sourceName.trim()) return sourceName.trim();
  if (organizerType === "GOVERNMENT") return "Government Website";
  // No external source recorded → it came in as an organiser submission.
  return "Official Organiser";
}

// Status: Confirmed / Watchlist / Rumoured / Awaiting Organiser Confirmation
export function confirmationLabel(status: string, isVerified?: boolean): string {
  if (status === "WATCHLIST") return isVerified ? "Watchlist" : "Rumoured";
  if (status === "EXPIRED") return "Past Event";
  if (status === "PUBLISHED") return isVerified ? "Confirmed" : "Awaiting Organiser Confirmation";
  return "Awaiting Organiser Confirmation";
}

export function SourceStatusBar({
  sourceName,
  organizerType,
  status,
  isVerified,
  className,
}: {
  sourceName?: string | null;
  organizerType?: string;
  status: string;
  isVerified?: boolean;
  className?: string;
}) {
  const source = sourceLabel(sourceName, organizerType);
  const confirmation = confirmationLabel(status, isVerified);

  const confirmStyle =
    confirmation === "Confirmed"
      ? "text-emerald-600 dark:text-emerald-300 bg-emerald-500/12 border-emerald-500/25"
      : confirmation === "Watchlist" || confirmation === "Rumoured"
        ? "text-amber-600 dark:text-gold bg-gold/12 border-amber-500/25"
        : confirmation === "Past Event"
          ? "text-muted bg-chip border-card-line"
          : "text-cyan-600 dark:text-cyan-300 bg-cyan-500/12 border-cyan-500/25";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ""}`}>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-card-line bg-chip text-ink">
        <Megaphone className="w-3 h-3 text-brand-accent shrink-0" />
        <span className="font-mono uppercase tracking-wide text-[9px] text-muted">Source</span>
        {source}
      </span>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${confirmStyle}`}
      >
        <BadgeCheck className="w-3 h-3 shrink-0" />
        <span className="font-mono uppercase tracking-wide text-[9px] opacity-70">Status</span>
        {confirmation}
      </span>
    </div>
  );
}

export function PriceChip({
  priceType,
  minPrice,
  className,
}: {
  priceType: string;
  minPrice?: number | null;
  className?: string;
}) {
  const color =
    priceType === "FREE"
      ? "text-emerald-600 dark:text-emerald-400"
      : priceType === "PAID"
        ? "text-brand-accent dark:text-brand-glow"
        : priceType === "REGISTRATION_REQUIRED"
          ? "text-cyan-600 dark:text-cyan-400"
          : "text-muted";
  return (
    <span className={`font-display font-semibold text-sm ${color} ${className || ""}`}>
      {priceLabel(priceType, minPrice)}
    </span>
  );
}
