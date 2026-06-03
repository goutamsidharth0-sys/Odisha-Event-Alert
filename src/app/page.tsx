import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import EventCard from "@/components/EventCard";
import HeroTypewriter from "@/components/HeroTypewriter";
import * as Icons from "lucide-react";
import { Search, MapPin, Sparkles, MessageCircle, ArrowRight, TrendingUp, HelpCircle, Calendar as CalendarIcon, Music, Lightbulb, Compass, Award } from "lucide-react";

// Dynamic Category Icon Resolver
const CategoryIcon = ({ name, className }: { name: string; className: string }) => {
  const LucideIcon = (Icons as any)[name] || Icons.Calendar;
  return <LucideIcon className={className} />;
};

interface Props {
  searchParams: Promise<{ city?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedCitySlug = params.city || "";

  // 1. Resolve selected city details
  const selectedCity = selectedCitySlug
    ? await prisma.city.findFirst({ where: { slug: selectedCitySlug } })
    : null;

  const cityFilter = selectedCity ? { cityId: selectedCity.id } : {};

  // Fetch active categories
  const categories = await prisma.category.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
  });

  // Fetch active cities
  const cities = await prisma.city.findMany({
    where: { status: "ACTIVE" },
    take: 8,
  });

  // 2. Fetch Featured Events
  const featuredEvents = await prisma.event.findMany({
    where: { status: "PUBLISHED", isFeatured: true, ...cityFilter },
    include: {
      category: { select: { name: true, slug: true } },
      city: { select: { name: true, slug: true } },
    },
    orderBy: { startDate: "asc" },
    take: 3,
  });

  // 3. INTENT-BASED EVENT QUERIES

  // 🔥 TRENDING HAPPENINGS: Top popular events sorted by viewsCount
  const trendingEvents = await prisma.event.findMany({
    where: { status: "PUBLISHED", ...cityFilter },
    include: {
      category: { select: { name: true, slug: true } },
      city: { select: { name: true, slug: true } },
    },
    orderBy: { viewsCount: "desc" },
    take: 4,
  });

  // 📅 WEEKEND ESCAPES: Happening this upcoming Friday, Saturday, or Sunday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0 is Sun, 5 is Fri, 6 is Sat
  const startOfWeekend = new Date(today);
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  startOfWeekend.setDate(today.getDate() + (daysUntilFriday === 0 && dayOfWeek !== 5 ? 7 : daysUntilFriday));
  startOfWeekend.setHours(0, 0, 0, 0);

  const endOfWeekend = new Date(startOfWeekend);
  endOfWeekend.setDate(startOfWeekend.getDate() + 2); // Sunday
  endOfWeekend.setHours(23, 59, 59, 999);

  const weekendEvents = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      startDate: { gte: startOfWeekend, lte: endOfWeekend },
      ...cityFilter,
    },
    include: {
      category: { select: { name: true, slug: true } },
      city: { select: { name: true, slug: true } },
    },
    orderBy: { startDate: "asc" },
    take: 4,
  });

  // 🎵 GIGS, PARTIES & NIGHTLIFE (Concerts, DJ Nights, Comedy)
  const nightlifeGigs = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      category: { slug: { in: ["concerts", "dj-nights", "comedy"] } },
      ...cityFilter,
    },
    include: {
      category: { select: { name: true, slug: true } },
      city: { select: { name: true, slug: true } },
    },
    orderBy: { startDate: "asc" },
    take: 4,
  });

  // 💡 LEARN & GROW (Workshops, Business, Community Startup fests)
  const learningWorkshops = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      category: { slug: { in: ["workshops", "business", "community"] } },
      ...cityFilter,
    },
    include: {
      category: { select: { name: true, slug: true } },
      city: { select: { name: true, slug: true } },
    },
    orderBy: { startDate: "asc" },
    take: 4,
  });

  // 🏛️ CULTURAL & PUBLIC FESTIVALS (Cultural, Exhibitions, Sports)
  const culturalPublicFests = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      category: { slug: { in: ["cultural", "exhibitions", "sports"] } },
      ...cityFilter,
    },
    include: {
      category: { select: { name: true, slug: true } },
      city: { select: { name: true, slug: true } },
    },
    orderBy: { startDate: "asc" },
    take: 4,
  });

  // Fetch watchlist events
  const watchlistEvents = await prisma.event.findMany({
    where: { status: "WATCHLIST", ...cityFilter },
    include: {
      category: { select: { name: true, slug: true } },
      city: { select: { name: true, slug: true } },
    },
    orderBy: { startDate: "asc" },
    take: 4,
  });

  const quickCities = [
    { name: "All Odisha", slug: "" },
    { name: "Bhubaneswar", slug: "bhubaneswar" },
    { name: "Cuttack", slug: "cuttack" },
    { name: "Puri", slug: "puri" },
    { name: "Rourkela", slug: "rourkela" },
    { name: "Sambalpur", slug: "sambalpur" },
  ];

  const cityHeadline = selectedCity
    ? `Discover Happening Events In ${selectedCity.name}`
    : "Discover What’s Happening Across Odisha";

  const getCityUrl = (slug: string) => {
    return slug ? `/?city=${slug}` : "/";
  };

  const getExploreUrl = (catSlug: string) => {
    let url = `/events?category=${catSlug}`;
    if (selectedCitySlug) {
      url += `&city=${selectedCitySlug}`;
    }
    return url;
  };

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 md:pt-20 pb-12 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-accent/10 filter blur-[80px] -z-10 animate-pulse"></div>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/10 text-brand-glow text-xs font-bold uppercase tracking-widest animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Odisha's Dedicated Event Radar</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            {"Discover What's Happening"}<br className="hidden sm:inline" />
            <HeroTypewriter cityName={selectedCity?.name} />
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base font-semibold text-slate-400 leading-relaxed">
            Concerts, comedy shows, workshops, fests, nightlife gigs, cultural fests, sports tournaments, and promotions — all curated in one payment-free listing site.
          </p>

          {/* Large Search Bar */}
          <form
            action="/events"
            method="GET"
            className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 pt-4"
          >
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                name="search"
                placeholder={`Search fests, workshops, comedy in ${selectedCity ? selectedCity.name : "Odisha"}...`}
                className="w-full bg-slate-900/80 backdrop-blur border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/30 transition-all font-semibold"
              />
              {selectedCitySlug && <input type="hidden" name="city" value={selectedCitySlug} />}
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 rounded-2xl glow-btn text-sm font-bold text-white uppercase tracking-wider flex items-center justify-center space-x-2"
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Date Filters */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider py-1.5">
              Quick Dates:
            </span>
            <Link
              href={`/events?date=today${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
              className="px-3.5 py-1 rounded-full border border-white/5 bg-slate-900/50 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-all"
            >
              Today
            </Link>
            <Link
              href={`/events?date=tomorrow${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
              className="px-3.5 py-1 rounded-full border border-white/5 bg-slate-900/50 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-all"
            >
              Tomorrow
            </Link>
            <Link
              href={`/events?date=weekend${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
              className="px-3.5 py-1 rounded-full border border-white/5 bg-slate-900/50 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-all"
            >
              This Weekend
            </Link>
            <Link
              href={`/events?date=month${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
              className="px-3.5 py-1 rounded-full border border-white/5 bg-slate-900/50 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-all"
            >
              This Month
            </Link>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC HOMEPAGE CITY SELECTOR BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-4 rounded-3xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 shrink-0">
            <MapPin className="w-5 h-5 text-brand-accent animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-300">
              Select Your City:
            </span>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center justify-center sm:justify-end">
            {quickCities.map((c) => {
              const isActive = selectedCitySlug === c.slug;
              return (
                <Link
                  key={c.name}
                  href={getCityUrl(c.slug)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-brand-accent/20 border border-brand-accent/30 text-brand-glow shadow shadow-brand-accent/10"
                      : "bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-white/10 text-slate-300"
                  }`}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. CATEGORY STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-l-4 border-brand-accent pl-3">
              Browse Categories
            </h2>
            <Link
              href={`/events${selectedCitySlug ? `?city=${selectedCitySlug}` : ""}`}
              className="text-xs font-bold text-brand-glow hover:text-brand-accent flex items-center gap-1 group"
            >
              <span>See All Events</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {categories.slice(0, 14).map((cat) => (
              <Link
                key={cat.id}
                href={getExploreUrl(cat.slug)}
                className="flex flex-col items-center justify-center p-5 rounded-2xl glass-panel glass-panel-hover text-center space-y-3 group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-center text-slate-300 group-hover:text-brand-glow group-hover:bg-brand-accent/10 group-hover:border-brand-accent/20 transition-all duration-300 shadow">
                  <CategoryIcon name={cat.icon || "Calendar"} className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate w-full">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED HIGHLIGHTS (Widescreen Slider / Grid) */}
      {featuredEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-brand-glow shrink-0 animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-l-4 border-brand-accent pl-3">
                Featured Highlights
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map((event) => (
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
                  isFeatured={true}
                  isVerified={event.isVerified}
                  status={event.status}
                  organizerType={event.organizerType}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. 🔥 INTENT 1: TRENDING IN CITY */}
      {trendingEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-glow animate-pulse shrink-0" />
                <span>🔥 Trending Gigs In {selectedCity ? selectedCity.name : "Odisha"}</span>
              </h3>
              <Link
                href={`/events?sort=popular${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
                className="text-xs font-bold text-brand-glow hover:text-brand-accent flex items-center gap-0.5"
              >
                <span>Browse Hot Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingEvents.map((event) => (
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
          </div>
        </section>
      )}

      {/* 6. 📅 INTENT 2: WEEKEND ESCAPES */}
      {weekendEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-brand-accent/5 via-transparent to-transparent py-10 rounded-3xl border border-white/5">
          <div className="flex flex-col space-y-6 px-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-brand-glow shrink-0 animate-pulse" />
                  <span>📅 Weekend Escapes (Fri - Sun)</span>
                </h3>
                <p className="text-[11px] font-semibold text-slate-400">
                  Plans for this upcoming weekend in {selectedCity ? selectedCity.name : "Odisha"}. Lock your schedules!
                </p>
              </div>
              <Link
                href={`/events?date=weekend${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
                className="text-xs font-bold text-brand-glow hover:text-brand-accent flex items-center gap-0.5 shrink-0 self-start sm:self-auto"
              >
                <span>View Full Weekend List</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {weekendEvents.map((event) => (
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
          </div>
        </section>
      )}

      {/* 7. 🎵 INTENT 3: NIGHTLIFE GIGS, CONCERTS & COMEDY */}
      {nightlifeGigs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <Music className="w-5 h-5 text-brand-glow shrink-0 animate-pulse" />
                <span>🎵 Nightlife Parties, Concerts & Standups</span>
              </h3>
              <Link
                href={`/events?category=concerts${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
                className="text-xs font-bold text-brand-glow hover:text-brand-accent flex items-center gap-0.5"
              >
                <span>Browse Live Gigs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {nightlifeGigs.map((event) => (
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
          </div>
        </section>
      )}

      {/* 8. 💡 INTENT 4: WORKSHOPS & startup SUMMITS */}
      {learningWorkshops.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-brand-glow shrink-0 animate-pulse" />
                <span>💡 Creative Workshops, Seminars & Startups</span>
              </h3>
              <Link
                href={`/events?category=workshops${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
                className="text-xs font-bold text-brand-glow hover:text-brand-accent flex items-center gap-0.5"
              >
                <span>Browse Bootcamps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {learningWorkshops.map((event) => (
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
          </div>
        </section>
      )}

      {/* 9. 🏛️ INTENT 5: CULTURAL & PUBLIC FESTIVALS */}
      {culturalPublicFests.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <Compass className="w-5 h-5 text-brand-glow shrink-0 animate-pulse" />
                <span>🏛️ Traditional Cultural Recitals, Expos & Sports</span>
              </h3>
              <Link
                href={`/events?category=cultural${selectedCitySlug ? `&city=${selectedCitySlug}` : ""}`}
                className="text-xs font-bold text-brand-glow hover:text-brand-accent flex items-center gap-0.5"
              >
                <span>Browse Heritage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {culturalPublicFests.map((event) => (
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
          </div>
        </section>
      )}

      {/* 10. WATCHLIST EVENTS */}
      {watchlistEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-brand-accent/5 to-transparent py-10 rounded-3xl border border-white/5">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-brand-glow shrink-0 animate-pulse" />
                  <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-slate-200 border-l-4 border-brand-accent pl-3">
                    Watchlist Radar (Expected Events)
                  </h2>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 pl-4">
                  Rumoured concerts, unconfirmed fests, or teaser listings in {selectedCity ? selectedCity.name : "Odisha"}. Dates & details awaited!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
              {watchlistEvents.map((event) => (
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
                  isFeatured={false}
                  isVerified={event.isVerified}
                  status={event.status}
                  organizerType={event.organizerType}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 11. POPULAR CITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-6">
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-slate-200 border-l-4 border-brand-accent pl-3">
            Explore Popular Cities
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {cities.map((city) => (
              <Link
                key={city.id}
                href={getCityUrl(city.slug)}
                className="group relative rounded-2xl overflow-hidden glass-panel aspect-[4/3] flex flex-col justify-end p-4 border border-white/5 transition-all duration-300 hover:border-brand-accent/30 hover:scale-[1.02] shadow"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10"></div>
                <div className="relative z-20 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                  <span className="text-xs font-bold text-white group-hover:text-brand-glow transition-colors">
                    {city.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 12. ORGANIZER & ADVERTISING DOUBLE CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Organizer CTA */}
          <div className="relative rounded-3xl p-8 overflow-hidden glass-panel border border-white/10 flex flex-col justify-between space-y-6 group">
            <div className="absolute -right-20 -bottom-20 w-60 h-60 rounded-full bg-brand-accent/10 filter blur-[40px] -z-10 group-hover:bg-brand-accent/15 transition-all"></div>
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-glow">
                For Event Organizers
              </span>
              <h3 className="text-2xl font-bold text-white leading-tight">
                Hosting an event in Odisha? <br />
                List it on Odisha Event Alert!
              </h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Maximize your event's reach by submitting your concert, fest, or comedy show. Showcase your details directly to active local audiences.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/submit-event"
                className="px-6 py-3 rounded-full bg-white text-slate-950 hover:bg-brand-accent hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow"
              >
                Submit Event Form
              </Link>
              <a
                href="https://wa.me/919090123456?text=Hello!%20I%20want%20to%20list%20my%20upcoming%20event%20on%20Odisha%20Event%20Alert."
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-full border border-white/10 hover:border-brand-accent/30 text-slate-300 hover:text-brand-glow text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>WhatsApp Inquiry</span>
              </a>
            </div>
          </div>

          {/* Advertiser CTA */}
          <div className="relative rounded-3xl p-8 overflow-hidden glass-panel border border-white/10 flex flex-col justify-between space-y-6 group">
            <div className="absolute -right-20 -bottom-20 w-60 h-60 rounded-full bg-brand-glow/10 filter blur-[40px] -z-10 group-hover:bg-brand-glow/15 transition-all"></div>
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-glow">
                Grow Your Brand
              </span>
              <h3 className="text-2xl font-bold text-white leading-tight">
                Reach Odisha’s Active <br />
                Social Demographics!
              </h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Connect with thousands of visitors through homepage banners, featured listings, sponsored categories, and specialized Instagram campaign promotions.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/advertise"
                className="px-6 py-3 rounded-full glow-btn text-xs font-bold uppercase tracking-wider text-white"
              >
                Advertise With Us
              </Link>
              <a
                href="https://wa.me/919090123456?text=Hello!%20I%20want%20to%20inquire%20about%20sponsorship%20and%20banner%20advertisement%20packages%20on%20Odisha%20Event%20Alert."
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-full border border-white/10 hover:border-brand-accent/30 text-slate-300 hover:text-brand-glow text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Sponsor Packages</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
