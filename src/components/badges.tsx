import React from "react";
import { CheckCircle2, Radar, Star } from "lucide-react";

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
