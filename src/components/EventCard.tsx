import React from "react";
import Link from "next/link";
import { Calendar, MapPin, Ticket, ShieldCheck, Share2 } from "lucide-react";

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
  endDate,
  startTime,
  venueName,
  city,
  category,
  priceType,
  minPrice,
  posterUrl,
  isFeatured,
  isVerified,
  status,
  organizerType,
}: EventCardProps) {
  // Format Date beautifully
  const dateObj = new Date(startDate);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString("en-US", { month: "short" });
  const year = dateObj.getFullYear();

  // Price label helper
  const getPriceLabel = () => {
    switch (priceType) {
      case "FREE":
        return <span className="text-emerald-400 font-bold">FREE</span>;
      case "REGISTRATION_REQUIRED":
        return <span className="text-cyan-400 font-bold">Register Required</span>;
      case "NOT_ANNOUNCED":
        return <span className="text-slate-500 dark:text-slate-400 font-semibold">TBA</span>;
      case "PAID":
        return (
          <span className="text-brand-glow font-bold">
            ₹{minPrice !== null ? minPrice : "TBD"}
          </span>
        );
      default:
        return <span className="text-slate-500 dark:text-slate-400 font-semibold">Details Awaited</span>;
    }
  };

  // Classification badge helper
  const getClassificationBadge = () => {
    const type = organizerType || "PUBLIC";
    switch (type.toUpperCase()) {
      case "GOVERNMENT":
        return (
          <span className="bg-gradient-to-r from-emerald-500/90 to-teal-500/90 backdrop-blur border border-emerald-400/20 text-white text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full shadow">
            GOVT
          </span>
        );
      case "PRIVATE":
        return (
          <span className="bg-gradient-to-r from-purple-600/90 to-fuchsia-600/90 backdrop-blur border border-purple-500/20 text-white text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full shadow">
            PRIVATE
          </span>
        );
      case "SOCIAL":
        return (
          <span className="bg-gradient-to-r from-rose-500/90 to-pink-500/90 backdrop-blur border border-rose-400/20 text-white text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full shadow">
            SOCIAL
          </span>
        );
      case "PUBLIC":
      default:
        return (
          <span className="bg-gradient-to-r from-cyan-500/90 to-blue-500/90 backdrop-blur border border-cyan-400/20 text-white text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full shadow">
            PUBLIC
          </span>
        );
    }
  };

  const isWatchlist = status === "WATCHLIST";

  return (
    <div
      className={`relative rounded-3xl overflow-hidden glass-panel glass-panel-hover flex flex-col group ${
        isFeatured ? "glow-border" : ""
      }`}
    >
      {/* Event Poster Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-950/60 border-b border-slate-200 dark:border-white/5">
        <img
          src={
            posterUrl || (isWatchlist
              ? "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800&auto=format&fit=crop"
              : "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800&auto=format&fit=crop")
          }
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Date Overlay Badge */}
        <div className="absolute top-4 left-4 date-badge px-3 py-1.5 rounded-2xl flex flex-col items-center justify-center min-w-12 shadow shadow-black/40">
          <span className="text-lg font-extrabold leading-none">{day}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider">{month}</span>
        </div>

        {/* Top Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
          {/* Category Badge */}
          <span className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow">
            {category.name}
          </span>
          {/* Classification Badge */}
          {getClassificationBadge()}
          {/* Watchlist / Confirmation Badge */}
          {isWatchlist && (
            <span className="bg-orange-500 text-slate-950 text-[9px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full shadow animate-pulse">
              DETAILS AWAITED
            </span>
          )}
          {isFeatured && (
            <span className="bg-brand-accent text-white text-[9px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full shadow">
              FEATURED
            </span>
          )}
        </div>

        {/* Verification Checkmark */}
        {isVerified && (
          <div className="absolute bottom-3 left-3 bg-emerald-500/80 backdrop-blur text-white p-1 rounded-full shadow flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
        <div className="space-y-2">
          {/* Venue & City */}
          <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5 text-brand-accent shrink-0" />
            <span className="truncate">
              {venueName}, {city.name}
            </span>
          </div>

          {/* Event Title */}
          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-brand-glow transition-colors duration-200">
            {title}
          </h3>

          {/* Short Description */}
          {shortDescription && (
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold line-clamp-2">
              {shortDescription}
            </p>
          )}
        </div>

        {/* Price & Details Link Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/5">
          {/* Price Label */}
          <div className="flex items-center space-x-1 text-xs">
            <Ticket className="w-3.5 h-3.5 text-brand-glow shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold leading-none">
                Entry
              </span>
              <span className="text-xs leading-tight">{getPriceLabel()}</span>
            </div>
          </div>

          {/* View Details Button */}
          <Link
            href={`/events/${slug}`}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/5 hover:bg-brand-accent dark:hover:bg-brand-accent hover:text-white border border-slate-200 dark:border-white/10 hover:border-brand-accent text-slate-700 dark:text-slate-200 transition-all duration-300"
          >
            {isWatchlist ? "View Status" : "Get Details"}
          </Link>
        </div>
      </div>
    </div>
  );
}
