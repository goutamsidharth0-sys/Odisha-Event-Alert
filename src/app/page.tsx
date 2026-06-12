import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import EventCard, { EventCardProps } from "@/components/EventCard";
import HeroTypewriter from "@/components/HeroTypewriter";
import RadarFeed, { RadarEvent } from "@/components/RadarFeed";
import TiltCard from "@/components/TiltCard";
import Rise from "@/components/Rise";
import * as Icons from "lucide-react";
import {
  Search,
  MapPin,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  CalendarDays,
  Gift,
  Store,
  Radar,
} from "lucide-react";

// Dynamic Category Icon Resolver
const CategoryIcon = ({ name, className }: { name: string; className: string }) => {
  const LucideIcon =
    (Icons as unknown as Record<string, React.ElementType>)[name] || Icons.Calendar;
  return <LucideIcon className={className} />;
};

interface Props {
  searchParams: Promise<{ city?: string }>;
}

const EVENT_INCLUDE = {
  category: { select: { name: true, slug: true } },
  city: { select: { name: true, slug: true } },
} as const;

type EventWithRels = Awaited<ReturnType<typeof prisma.event.findFirst<{ include: typeof EVENT_INCLUDE }>>>;

function toCardProps(event: NonNullable<EventWithRels>): EventCardProps {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    shortDescription: event.shortDescription,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime,
    venueName: event.venueName,
    city: event.city,
    category: event.category,
    priceType: event.priceType,
    minPrice: event.minPrice,
    posterUrl: event.posterUrl,
    isFeatured: event.isFeatured,
    isVerified: event.isVerified,
    status: event.status,
    organizerType: event.organizerType,
  };
}

function EventRow({ events }: { events: NonNullable<EventWithRels>[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {events.map((event, i) => (
        <Rise key={event.id} delay={i * 70}>
          <TiltCard className="rounded-2xl h-full">
            <EventCard {...toCardProps(event)} />
          </TiltCard>
        </Rise>
      ))}
    </div>
  );
}

function SectionHead({
  icon: Icon,
  title,
  sub,
  href,
  linkText,
}: {
  icon: React.ElementType;
  title: string;
  sub?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-card-line pb-4 mb-6">
      <div className="space-y-1">
        <h2 className="text-lg font-display font-bold text-ink tracking-tight flex items-center gap-2">
          <Icon className="w-5 h-5 text-brand-accent shrink-0" />
          <span>{title}</span>
        </h2>
        {sub && <p className="text-[11px] font-semibold text-muted">{sub}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="text-xs font-bold text-brand-accent hover:text-brand-glow flex items-center gap-1 shrink-0 group"
        >
          <span>{linkText || "View all"}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedCitySlug = params.city || "";

  const selectedCity = selectedCitySlug
    ? await prisma.city.findFirst({ where: { slug: selectedCitySlug } })
    : null;

  const cityFilter = selectedCity ? { cityId: selectedCity.id } : {};

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const inSevenDays = new Date(startOfToday);
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  inSevenDays.setHours(23, 59, 59, 999);
  const inThreeMonths = new Date(now.getFullYear(), now.getMonth() + 3, 1);

  const [
    categories,
    featuredEvents,
    radarEvents,
    weekEvents,
    freeEvents,
    newInOdisha,
    watchlistEvents,
  ] = await Promise.all([
    prisma.category.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.event.findMany({
      where: { status: "PUBLISHED", isFeatured: true, ...cityFilter },
      include: EVENT_INCLUDE,
      orderBy: { startDate: "asc" },
      take: 3,
    }),
    prisma.event.findMany({
      where: {
        status: { in: ["PUBLISHED", "WATCHLIST"] },
        startDate: { gte: startOfToday, lt: inThreeMonths },
        ...cityFilter,
      },
      include: EVENT_INCLUDE,
      orderBy: { startDate: "asc" },
      take: 36,
    }),
    prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        startDate: { gte: startOfToday, lte: inSevenDays },
        ...cityFilter,
      },
      include: EVENT_INCLUDE,
      orderBy: { startDate: "asc" },
      take: 4,
    }),
    prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        priceType: "FREE",
        startDate: { gte: startOfToday },
        ...cityFilter,
      },
      include: EVENT_INCLUDE,
      orderBy: { startDate: "asc" },
      take: 4,
    }),
    prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        category: { slug: { in: ["new-openings", "offers"] } },
        ...cityFilter,
      },
      include: EVENT_INCLUDE,
      orderBy: { startDate: "asc" },
      take: 4,
    }),
    prisma.event.findMany({
      where: { status: "WATCHLIST", ...cityFilter },
      include: EVENT_INCLUDE,
      orderBy: { startDate: "asc" },
      take: 4,
    }),
  ]);

  const serializedRadar: RadarEvent[] = radarEvents.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    startDate: e.startDate.toISOString(),
    venueName: e.venueName,
    cityName: e.city.name,
    categoryName: e.category.name,
    categorySlug: e.category.slug,
    priceType: e.priceType,
    minPrice: e.minPrice,
    isVerified: e.isVerified,
    isFeatured: e.isFeatured,
    status: e.status,
  }));

  const quickCities = [
    { name: "All Odisha", slug: "" },
    { name: "Bhubaneswar", slug: "bhubaneswar" },
    { name: "Cuttack", slug: "cuttack" },
    { name: "Puri", slug: "puri" },
    { name: "Rourkela", slug: "rourkela" },
    { name: "Sambalpur", slug: "sambalpur" },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO */}
      <section className="relative pt-16 md:pt-24 pb-10 flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.24em] uppercase text-brand-accent">
            <span className="live-dot" />
            <span>Odisha Event Alert · odishaeventalert.com</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-ink leading-[1.05]">
            Odisha&apos;s live
            <br />
            <span className="grad-text">event radar.</span>
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base font-semibold text-muted leading-relaxed">
            Discover verified events, workshops, openings, offers, concerts and community activities
            near you — reviewed before they go live.
            {selectedCity && (
              <span className="block mt-1 text-brand-accent">
                Now showing: <HeroTypewriter cityName={selectedCity.name} />
              </span>
            )}
          </p>

          {/* Search */}
          <form action="/events" method="GET" className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
              <input
                type="text"
                name="search"
                placeholder={`Search events, venues in ${selectedCity ? selectedCity.name : "Odisha"}…`}
                className="w-full glass-panel rounded-2xl py-3.5 pl-12 pr-4 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all font-semibold"
              />
              {selectedCitySlug && <input type="hidden" name="city" value={selectedCitySlug} />}
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 rounded-2xl glow-btn text-sm font-bold font-display text-white uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-2.5">
            <Link
              href="/submit-event"
              className="px-6 py-2.5 rounded-xl border-[1.5px] border-brand-accent text-brand-accent text-xs font-bold font-display uppercase tracking-wider hover:bg-brand-accent hover:text-white transition-all"
            >
              Submit Your Event
            </Link>
            {[
              { label: "Today", q: "date=today" },
              { label: "This Weekend", q: "date=weekend" },
              { label: "Free Events", q: "price=free" },
            ].map((f) => (
              <Link
                key={f.label}
                href={`/events?${f.q}${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
                className="chip-btn inline-flex items-center"
              >
                {f.label}
              </Link>
            ))}
          </div>

          {/* City pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-3">
            {quickCities.map((c) => {
              const isActive = selectedCitySlug === c.slug;
              return (
                <Link key={c.name} href={c.slug ? `/?city=${c.slug}` : "/"} className={`chip-btn inline-flex items-center gap-1 ${isActive ? "on" : ""}`}>
                  <MapPin className="w-3 h-3" />
                  {c.name}
                </Link>
              );
            })}
          </div>

          <div className="font-mono text-[10px] tracking-[0.2em] text-muted bounce-cue pt-2">▼ SCROLL</div>
        </div>
      </section>

      {/* 2. RADAR FEED */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Rise>
          <RadarFeed events={serializedRadar} />
        </Rise>
      </section>

      {/* 3. CATEGORY STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHead
          icon={Sparkles}
          title="Browse Categories"
          href={`/events${selectedCitySlug ? `?city=${selectedCitySlug}` : ""}`}
          linkText="Explore Events"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.slice(0, 18).map((cat, i) => (
            <Rise key={cat.id} delay={i * 30}>
              <Link
                href={`/events?category=${cat.slug}${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
                className="flex flex-col items-center justify-center p-5 rounded-2xl glass-panel glass-panel-hover text-center space-y-3 group h-full"
              >
                <div className="w-12 h-12 rounded-xl bg-chip border border-card-line flex items-center justify-center text-muted group-hover:text-brand-accent group-hover:bg-brand-accent/10 group-hover:border-brand-accent/25 transition-all duration-300">
                  <CategoryIcon name={cat.icon || "Calendar"} className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-ink truncate w-full">{cat.name}</span>
              </Link>
            </Rise>
          ))}
        </div>
      </section>

      {/* 4. FEATURED VERIFIED */}
      {featuredEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead
            icon={ShieldCheck}
            title="Featured Verified Events"
            sub="Hand-picked, high-trust listings reviewed by the OEA team."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredEvents.map((event, i) => (
              <Rise key={event.id} delay={i * 80}>
                <TiltCard className="rounded-2xl h-full">
                  <EventCard {...toCardProps(event)} isFeatured />
                </TiltCard>
              </Rise>
            ))}
          </div>
        </section>
      )}

      {/* 5. HAPPENING THIS WEEK */}
      {weekEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead
            icon={CalendarDays}
            title={`Happening This Week${selectedCity ? ` in ${selectedCity.name}` : ""}`}
            sub="Fast plans for the next seven days."
            href={`/events?date=weekend${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
            linkText="Weekend list"
          />
          <EventRow events={weekEvents} />
        </section>
      )}

      {/* 6. FREE EVENTS */}
      {freeEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead
            icon={Gift}
            title="Free Events"
            sub="Zero-cost plans for students, families and the whole community."
            href={`/events?price=free${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
            linkText="All free events"
          />
          <EventRow events={freeEvents} />
        </section>
      )}

      {/* 7. NEW IN ODISHA */}
      {newInOdisha.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead
            icon={Store}
            title="New in Odisha"
            sub="New openings, launch offers, weekend deals and trial classes."
            href={`/events?category=new-openings${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
            linkText="Openings & offers"
          />
          <EventRow events={newInOdisha} />
        </section>
      )}

      {/* 8. WATCHLIST RADAR */}
      {watchlistEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead
            icon={Radar}
            title="Watchlist Radar"
            sub="Found or submitted but not fully confirmed yet — dates and details awaited."
            href={`/events?status=watchlist${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
            linkText="Full watchlist"
          />
          <EventRow events={watchlistEvents} />
        </section>
      )}

      {/* 9. TRUST BLOCK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Rise>
          <div className="glass-panel rounded-3xl p-8 sm:p-10 text-center space-y-4">
            <ShieldCheck className="w-9 h-9 text-emerald-500 mx-auto" />
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Every listing is reviewed before it appears on OEA.
            </h2>
            <p className="max-w-2xl mx-auto text-sm text-muted font-semibold leading-relaxed">
              OEA is a trusted event radar, not a ticketing site. You register interest on OEA and get
              confirmations, reminders and change alerts. Tickets for paid events are handled by the
              official organiser or source — OEA never collects payment.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-2 font-mono text-[10px] tracking-[0.18em] uppercase text-muted">
              <span>✓ Verified listings</span>
              <span>✓ No payment handling</span>
              <span>✓ Free registration</span>
              <span>✓ Change alerts</span>
            </div>
          </div>
        </Rise>
      </section>

      {/* 10. ORGANIZER & ADVERTISER CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Rise>
            <div className="relative rounded-3xl p-8 overflow-hidden glass-panel flex flex-col justify-between space-y-6 group h-full">
              <div className="space-y-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent">
                  For Event Organisers
                </span>
                <h3 className="text-2xl font-display font-bold text-ink leading-tight">
                  Hosting something in Odisha?
                  <br />
                  Put it on the radar.
                </h3>
                <p className="text-xs text-muted font-semibold leading-relaxed">
                  Submit your event, opening or offer with a poster. Our team reviews it, verifies the
                  details, and publishes it to active local audiences — with interest registrations
                  delivered to you.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/submit-event"
                  className="px-6 py-3 rounded-full glow-btn text-white text-xs font-bold font-display uppercase tracking-wider transition-all"
                >
                  Submit Your Event
                </Link>
                <a
                  href="https://wa.me/917008181478?text=Hello!%20I%20want%20to%20list%20my%20upcoming%20event%20on%20Odisha%20Event%20Alert."
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-full border border-card-line hover:border-brand-accent/40 text-muted hover:text-brand-accent text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>WhatsApp Inquiry</span>
                </a>
              </div>
            </div>
          </Rise>

          <Rise delay={120}>
            <div className="relative rounded-3xl p-8 overflow-hidden glass-panel flex flex-col justify-between space-y-6 group h-full">
              <div className="space-y-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent">
                  Grow Your Brand
                </span>
                <h3 className="text-2xl font-display font-bold text-ink leading-tight">
                  Reach Odisha&apos;s most active
                  <br />
                  local audience.
                </h3>
                <p className="text-xs text-muted font-semibold leading-relaxed">
                  Featured listings, homepage placement, category sponsorships and Instagram promotion
                  packages for venues, cafés, institutes and brands.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/advertise"
                  className="px-6 py-3 rounded-full glow-btn text-xs font-bold font-display uppercase tracking-wider text-white"
                >
                  Advertise With Us
                </Link>
                <a
                  href="https://wa.me/917008181478?text=Hello!%20I%20want%20to%20inquire%20about%20sponsorship%20and%20banner%20advertisement%20packages%20on%20Odisha%20Event%20Alert."
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-full border border-card-line hover:border-brand-accent/40 text-muted hover:text-brand-accent text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>Sponsor Packages</span>
                </a>
              </div>
            </div>
          </Rise>
        </div>
      </section>
    </div>
  );
}
