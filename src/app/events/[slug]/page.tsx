import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import EventCard from "@/components/EventCard";
import { Calendar, MapPin, Ticket, ShieldCheck, Share2, Phone, Mail, Globe, Sparkles, MessageCircle } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  
  // Classification badge helper
  const getClassificationBadge = (type: string) => {
    switch (type ? type.toUpperCase() : "PUBLIC") {
      case "GOVERNMENT":
        return (
          <span className="bg-gradient-to-r from-emerald-500/90 to-teal-500/90 border border-emerald-400/20 text-white text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full shadow">
            GOVT INITIATIVE
          </span>
        );
      case "PRIVATE":
        return (
          <span className="bg-gradient-to-r from-purple-600/90 to-fuchsia-600/90 border border-purple-500/20 text-white text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full shadow">
            PRIVATE GIG
          </span>
        );
      case "SOCIAL":
        return (
          <span className="bg-gradient-to-r from-rose-500/90 to-pink-500/90 border border-rose-400/20 text-white text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full shadow">
            SOCIAL EVENT
          </span>
        );
      case "PUBLIC":
      default:
        return (
          <span className="bg-gradient-to-r from-cyan-500/90 to-blue-500/90 border border-cyan-400/20 text-white text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full shadow">
            PUBLIC EVENT
          </span>
        );
    }
  };

  // 1. Fetch Event with relations
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      category: true,
      city: true,
      organizer: true,
    },
  });

  if (!event) {
    notFound();
  }

  // Increment views count asynchronously (fire and forget)
  prisma.event.update({
    where: { id: event.id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  // 2. Fetch Related Events (same city or same category, excluding current event)
  const relatedEvents = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: event.id },
      OR: [
        { categoryId: event.categoryId },
        { cityId: event.cityId },
      ],
    },
    include: {
      category: { select: { name: true, slug: true } },
      city: { select: { name: true, slug: true } },
    },
    take: 3,
    orderBy: { startDate: "asc" },
  });

  // 3. Format Date
  const startDateObj = new Date(event.startDate);
  const formattedStartDate = startDateObj.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedEndDate = event.endDate
    ? new Date(event.endDate).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // 4. Generate JSON-LD Schema Markup
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "description": event.shortDescription || event.description.substring(0, 150),
    "startDate": event.startDate.toISOString(),
    "endDate": event.endDate ? event.endDate.toISOString() : event.startDate.toISOString(),
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "image": [
      event.posterUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800"
    ],
    "location": {
      "@type": "Place",
      "name": event.venueName,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": event.city.name,
        "addressRegion": "Odisha",
        "addressCountry": "IN"
      }
    },
    "offers": {
      "@type": "Offer",
      "price": event.minPrice || 0,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "url": event.registrationUrl || ""
    },
    "organizer": {
      "@type": "Organization",
      "name": event.organizer?.name || "Odisha Event Alert",
      "url": event.organizer?.websiteUrl || ""
    }
  };

  const isWatchlist = event.status === "WATCHLIST";

  return (
    <div className="pb-20 space-y-12">
      {/* Dynamic SEO JSON-LD Script Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />

      {/* COVER HERO IMAGE HEADER */}
      <section className="relative h-[250px] md:h-[450px] w-full overflow-hidden">
        {/* Cover Photo */}
        <div className="absolute inset-0 bg-slate-950/60 z-10"></div>
        <img
          src={
            event.bannerUrl || event.posterUrl || (isWatchlist
              ? "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1600&auto=format&fit=crop"
              : "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop")
          }
          alt={event.title}
          className="w-full h-full object-cover blur-sm opacity-50 scale-105"
        />

        {/* Floating Content Layout */}
        <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-4xl">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="bg-brand-accent text-white text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full shadow-lg shadow-brand-accent/20">
                  {event.category.name}
                </span>
                {getClassificationBadge(event.organizerType)}
                {isWatchlist ? (
                  <span className="bg-orange-500 text-slate-950 text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full shadow animate-pulse">
                    DETAILS AWAITED
                  </span>
                ) : (
                  <span className="bg-emerald-500 text-white text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full shadow">
                    CONFIRMED LISTING
                  </span>
                )}
                {event.isVerified && (
                  <span className="bg-slate-900 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Details</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {event.title}
              </h1>

              {/* Quick Info Grid */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-300">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-brand-accent shrink-0" />
                  <span>{formattedStartDate}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-brand-accent shrink-0" />
                  <span>
                    {event.venueName}, {event.city.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Price Badge */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 shrink-0 flex flex-col justify-center min-w-44 text-center">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500 mb-1">
                Entry Tickets
              </span>
              <div className="text-xl font-black text-brand-glow">
                {event.priceType === "FREE" && <span className="text-emerald-400">FREE</span>}
                {event.priceType === "REGISTRATION_REQUIRED" && <span className="text-cyan-400">REGISTER REQUIRED</span>}
                {event.priceType === "NOT_ANNOUNCED" && <span className="text-slate-400">TBA</span>}
                {event.priceType === "PAID" && (
                  <span>
                    ₹{event.minPrice} {event.maxPrice ? ` - ₹${event.maxPrice}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE DETAILS LAYOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Main Description */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
              <h2 className="text-lg font-bold uppercase tracking-wider text-slate-200 border-l-4 border-brand-accent pl-3">
                About the Event
              </h2>
              <div className="text-sm font-semibold text-slate-300 leading-relaxed space-y-4 whitespace-pre-line">
                {event.description}
              </div>
            </div>

            {/* Disclaimer Box */}
            <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-glow">
                Disclaimer
              </h4>
              <p className="text-[11px] font-semibold text-slate-400 leading-relaxed">
                Odisha Event Alert is an event discovery and directory platform. Event schedules, line-ups, ticket pricing, and entry rules are subject to change by the official organizers without prior notice. Please always verify the final schedule and safety measures with the organizers directly before attending.
              </p>
            </div>
          </div>

          {/* Booking / Details Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            {/* Primary Booking Card */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5 text-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                {isWatchlist ? "Event Status" : "Get Your Entry Pass"}
              </h3>

              {isWatchlist ? (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-orange-500/20 p-4 rounded-2xl text-xs font-semibold text-slate-300 text-left">
                    🚩 This is currently listed on our <strong>Watchlist Radar</strong>. The official registration links, schedule, and ticket inventory have not been released by the organizers yet.
                  </div>
                  <a
                    href={`https://wa.me/919090123456?text=I%20want%20to%20get%20notified%20as%20soon%20as%20tickets/details%20go%20live%20for%20${encodeURIComponent(
                      event.title
                    )}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded-2xl bg-orange-500 text-slate-950 hover:bg-orange-600 transition-colors text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-lg shadow-orange-500/20"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>Get Alerts on WhatsApp</span>
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {event.registrationUrl ? (
                    <a
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3.5 rounded-2xl glow-btn text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center space-x-1.5 shadow"
                    >
                      <Ticket className="w-4 h-4 shrink-0" />
                      <span>Book Now / Register</span>
                    </a>
                  ) : (
                    <div className="bg-slate-900 p-4 rounded-2xl text-xs font-bold text-slate-400 border border-white/5">
                      Entry details or manual passes are handled at the physical venue.
                    </div>
                  )}
                  {event.organizer?.whatsapp && (
                    <a
                      href={`https://wa.me/${event.organizer.whatsapp.replace(/[^0-9]/g, "")}?text=Hello!%20I%20saw%20your%20event%20"${encodeURIComponent(
                        event.title
                      )}"%20on%20Odisha%20Event%20Alert%20and%20had%20an%20inquiry.`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-600 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/10"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>WhatsApp Organizer</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Quick Specs Table Card */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Key Information
              </h4>
              <div className="divide-y divide-white/5 text-xs font-semibold">
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Date</span>
                  <span className="text-white text-right">{formattedStartDate}</span>
                </div>
                {formattedEndDate && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">End Date</span>
                    <span className="text-white text-right">{formattedEndDate}</span>
                  </div>
                )}
                {event.startTime && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">Time</span>
                    <span className="text-white text-right">
                      {event.startTime} {event.endTime ? ` - ${event.endTime}` : ""}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Location</span>
                  <span className="text-brand-glow text-right truncate max-w-40">
                    {event.venueName}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">City</span>
                  <span className="text-white text-right">{event.city.name}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Event Type</span>
                  <span className="text-white text-right uppercase">{event.eventType}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Classification</span>
                  <span className="text-white text-right uppercase">{event.organizerType}</span>
                </div>
              </div>
            </div>

            {/* Organizer Profile Card */}
            {event.organizer && (
              <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Organizer Details
                </h4>
                <div className="space-y-3 text-xs font-semibold text-slate-300">
                  <div className="text-sm font-bold text-white leading-tight">
                    {event.organizer.name}
                  </div>
                  {event.organizer.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-brand-accent" />
                      <span>{event.organizer.phone}</span>
                    </div>
                  )}
                  {event.organizer.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-brand-accent" />
                      <span>{event.organizer.email}</span>
                    </div>
                  )}
                  {event.organizer.websiteUrl && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-3.5 h-3.5 text-brand-accent" />
                      <a
                        href={event.organizer.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-glow hover:underline truncate"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* RELATED EVENTS */}
      {relatedEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5 pt-12 space-y-6">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-5 h-5 text-brand-glow animate-pulse" />
            <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-slate-200">
              Related Happenings
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                slug={event.slug}
                shortDescription={event.shortDescription}
                startDate={event.startDate}
                endDate={event.endDate}
                startTime={event.startTime}
                venueName={event.venueName}
                city={event.city}
                category={event.category}
                priceType={event.priceType}
                minPrice={event.minPrice}
                posterUrl={event.posterUrl}
                isFeatured={event.isFeatured}
                isVerified={event.isVerified}
                status={event.status}
                organizerType={event.organizerType}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
