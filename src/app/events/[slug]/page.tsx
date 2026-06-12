import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import EventCard from "@/components/EventCard";
import TiltCard from "@/components/TiltCard";
import Rise from "@/components/Rise";
import RegisterInterestPanel from "@/components/RegisterInterestPanel";
import SaveShareButtons from "@/components/SaveShareButtons";
import MobileRegisterBar from "@/components/MobileRegisterBar";
import { OeaVerifiedBadge, WatchlistBadge, priceLabel } from "@/components/badges";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/seo";
import { Crumbs } from "@/components/landing";
import {
  Calendar,
  MapPin,
  Ticket,
  Clock,
  IndianRupee,
  Sparkles,
  Flag,
  ExternalLink,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { title: true, shortDescription: true, description: true, posterUrl: true },
  });
  if (!event) return { title: "Event not found — Odisha Event Alert" };
  const description = event.shortDescription || event.description.substring(0, 160);
  return {
    title: `${event.title} | Odisha Event Alert`,
    description,
    alternates: { canonical: `${SITE_URL}/events/${slug}` },
    openGraph: {
      title: event.title,
      description,
      url: `${SITE_URL}/events/${slug}`,
      images: event.posterUrl ? [{ url: event.posterUrl }] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      category: true,
      city: true,
    },
  });

  if (!event) {
    notFound();
  }

  // Increment views count asynchronously (fire and forget)
  prisma.event
    .update({ where: { id: event.id }, data: { viewsCount: { increment: 1 } } })
    .catch(() => {});

  const [relatedEvents, cities] = await Promise.all([
    prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        id: { not: event.id },
        OR: [{ categoryId: event.categoryId }, { cityId: event.cityId }],
      },
      include: {
        category: { select: { name: true, slug: true } },
        city: { select: { name: true, slug: true } },
      },
      take: 3,
      orderBy: { startDate: "asc" },
    }),
    prisma.city.findMany({
      where: { status: "ACTIVE" },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

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

  const canonical = `${SITE_URL}/events/${event.slug}`;
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.shortDescription || event.description.substring(0, 150),
    startDate: event.startDate.toISOString(),
    endDate: event.endDate ? event.endDate.toISOString() : event.startDate.toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: canonical,
    image: [event.posterUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800"],
    location: {
      "@type": "Place",
      name: event.venueName,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.city.name,
        addressRegion: "Odisha",
        addressCountry: "IN",
      },
    },
    offers: {
      "@type": "Offer",
      price: event.minPrice || 0,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: (event.publishedAt || event.createdAt).toISOString(),
      url: event.ticketingUrl || event.registrationUrl || canonical,
    },
    organizer: {
      "@type": "Organization",
      name: "Odisha Event Alert",
      url: SITE_URL,
    },
  };

  const isWatchlist = event.status === "WATCHLIST";
  const isPaid = event.priceType === "PAID";
  const poster =
    event.posterUrl ||
    event.bannerUrl ||
    (isWatchlist
      ? "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1600&auto=format&fit=crop"
      : "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop");

  const reportMailto = `mailto:goutamsidharth0@gmail.com?subject=${encodeURIComponent(
    `Report listing: ${event.slug}`
  )}&body=${encodeURIComponent(
    `I want to report incorrect details for the event "${event.title}" (${canonical}).\n\nWhat's wrong:\n`
  )}`;

  return (
    <div className="pb-28 lg:pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            eventSchema,
            breadcrumbJsonLd([
              { name: "Home", url: SITE_URL },
              { name: `Events in ${event.city.name}`, url: `${SITE_URL}/city/${event.city.slug}` },
              { name: event.title, url: canonical },
            ]),
          ]),
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-5">
          <Crumbs
            items={[
              { name: "Home", href: "/" },
              { name: `Events in ${event.city.name}`, href: `/city/${event.city.slug}` },
              { name: event.title },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
          {/* LEFT: event content */}
          <Rise as="article">
            <div className="glass-panel rounded-3xl overflow-hidden">
              {/* Poster hero */}
              <div className="relative aspect-[16/8.5] overflow-hidden bg-brand-navy">
                <img src={poster} alt={event.title} fetchPriority="high" className="w-full h-full object-cover" />
                <div className="absolute top-3.5 left-3.5 flex gap-2 flex-wrap pr-24">
                  {event.isVerified && <OeaVerifiedBadge className="backdrop-blur bg-emerald-950/60" />}
                  {isWatchlist && <WatchlistBadge className="backdrop-blur bg-amber-950/50" />}
                  <Link
                    href={`/category/${event.category.slug}`}
                    className="font-mono text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-slate-950/70 backdrop-blur text-white hover:bg-brand-accent transition-colors"
                  >
                    {event.category.name}
                  </Link>
                  <span
                    className={`font-mono text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md backdrop-blur text-white ${
                      isPaid ? "bg-brand-accent/90" : "bg-emerald-600/90"
                    }`}
                  >
                    {isPaid ? "Paid Event" : priceLabel(event.priceType, event.minPrice)}
                  </span>
                </div>
                <div className="absolute top-3.5 right-3.5">
                  <SaveShareButtons slug={event.slug} title={event.title} />
                </div>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-8">
                <h1 className="font-display text-2xl sm:text-4xl font-bold text-ink tracking-tight leading-tight mb-6">
                  {event.title}
                </h1>

                {/* Meta grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
                  <div className="flex gap-3 items-start rounded-2xl border border-card-line bg-chip p-3.5">
                    <Calendar className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <b className="font-display text-sm text-ink block">
                        {formattedStartDate}
                        {formattedEndDate ? ` – ${formattedEndDate}` : ""}
                      </b>
                      <span className="text-muted text-xs font-semibold">
                        {event.startTime ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : " onwards"}` : "Timing to be announced"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start rounded-2xl border border-card-line bg-chip p-3.5">
                    <MapPin className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <b className="font-display text-sm text-ink block">{event.venueName}</b>
                      <span className="text-muted text-xs font-semibold">
                        {event.address ? `${event.address}, ` : ""}
                        <Link href={`/city/${event.city.slug}`} className="text-brand-accent hover:underline">
                          {event.city.name}
                        </Link>
                        , Odisha
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start rounded-2xl border border-card-line bg-chip p-3.5">
                    <Clock className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <b className="font-display text-sm text-ink block uppercase">{event.eventType.toLowerCase()}</b>
                      <span className="text-muted text-xs font-semibold">{event.category.name}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start rounded-2xl border border-card-line bg-chip p-3.5">
                    <IndianRupee className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <b className="font-display text-sm text-ink block">
                        {priceLabel(event.priceType, event.minPrice)}
                        {isPaid && event.maxPrice ? ` – ₹${event.maxPrice}` : ""}
                      </b>
                      <span className="text-muted text-xs font-semibold">
                        {isPaid ? "Tickets via official source" : "Register interest on OEA"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* About */}
                <h2 className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-brand-accent mb-3">
                  About this event
                </h2>
                <div className="text-sm font-medium text-muted leading-relaxed space-y-4 whitespace-pre-line mb-7">
                  {event.description}
                </div>

                {/* Paid ticket-source box (blueprint §8.3) */}
                {isPaid && (
                  <>
                    <h2 className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-brand-accent mb-3">
                      Tickets for this paid event
                    </h2>
                    <div className="flex gap-3.5 items-start rounded-2xl border border-dashed border-brand-accent/50 bg-brand-accent/5 p-4 mb-7">
                      <Ticket className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                      <div>
                        <b className="font-display text-sm text-ink block mb-1">
                          Ticket source: {event.sourceName || "the official organiser"}
                        </b>
                        <p className="text-muted text-xs font-semibold leading-relaxed">
                          Tickets for paid events are handled by the official organiser/source. Search this
                          event on the official source to book paid tickets. OEA helps you track it and
                          register interest — OEA does not sell tickets.
                        </p>
                        {(event.ticketingUrl || event.officialUrl) && (
                          <a
                            href={event.ticketingUrl || event.officialUrl || "#"}
                            target="_blank"
                            rel="noreferrer nofollow"
                            className="inline-flex items-center gap-1 text-xs font-bold text-brand-accent hover:underline mt-2"
                          >
                            Official ticket source <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Disclaimer + report */}
                <div className="bg-brand-accent/8 border border-brand-accent/20 p-5 rounded-2xl space-y-1.5 mb-4">
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">
                    Disclaimer
                  </h4>
                  <p className="text-[11px] font-semibold text-muted leading-relaxed">
                    Odisha Event Alert is an event discovery and registration platform — not a ticketing
                    company. Schedules, line-ups, pricing and entry rules can change without notice; always
                    verify final details with the organiser before attending.
                  </p>
                </div>

                <a
                  href={reportMailto}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-brand-accent transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" /> Report incorrect event details
                </a>
              </div>
            </div>
          </Rise>

          {/* RIGHT: register interest panel */}
          <Rise delay={120}>
            <aside id="register-panel" className="glass-panel rounded-3xl p-6 lg:sticky lg:top-24 scroll-mt-24">
              <RegisterInterestPanel
                eventId={event.id}
                eventTitle={event.title}
                priceType={event.priceType}
                status={event.status}
                cities={cities}
              />
            </aside>
          </Rise>
        </div>

        {/* RELATED EVENTS */}
        {relatedEvents.length > 0 && (
          <section className="border-t border-card-line mt-12 pt-10 space-y-6">
            <h2 className="text-lg font-display font-bold text-ink tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-accent" />
              Similar events on the radar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedEvents.map((rel, i) => (
                <Rise key={rel.id} delay={i * 80}>
                  <TiltCard className="rounded-2xl h-full">
                    <EventCard
                      id={rel.id}
                      title={rel.title}
                      slug={rel.slug}
                      shortDescription={rel.shortDescription}
                      startDate={rel.startDate}
                      endDate={rel.endDate}
                      startTime={rel.startTime}
                      venueName={rel.venueName}
                      city={rel.city}
                      category={rel.category}
                      priceType={rel.priceType}
                      minPrice={rel.minPrice}
                      posterUrl={rel.posterUrl}
                      isFeatured={rel.isFeatured}
                      isVerified={rel.isVerified}
                      status={rel.status}
                      organizerType={rel.organizerType}
                    />
                  </TiltCard>
                </Rise>
              ))}
            </div>
          </section>
        )}
      </div>

      <MobileRegisterBar priceType={event.priceType} minPrice={event.minPrice} status={event.status} />
    </div>
  );
}
