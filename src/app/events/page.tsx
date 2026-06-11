import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import EventCard from "@/components/EventCard";
import { Search, MapPin, Calendar, Ticket, SlidersHorizontal, ArrowUpDown, RefreshCw } from "lucide-react";

interface SearchParams {
  search?: string;
  category?: string;
  city?: string;
  date?: string;
  price?: string;
  status?: string;
  sort?: string;
  classification?: string;
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { search, category, city, date, price, status, sort, classification } = params;

  // 1. Fetch filter metadata (Categories & Cities)
  const categoriesList = await prisma.category.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
  });

  const citiesList = await prisma.city.findMany({
    where: { status: "ACTIVE" },
  });

  // 2. Build Prisma Query Where Object
  const where: any = {};

  // Default filter out expired events (event date is in the past) unless explicitly requested
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  where.startDate = { gte: now };

  // Status Filter
  if (status) {
    where.status = status.toUpperCase();
  } else {
    // Default show published and watchlist, do not show rejected/draft/expired
    where.status = { in: ["PUBLISHED", "WATCHLIST"] };
  }

  // Search Filter
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { venueName: { contains: search } },
      { district: { contains: search } },
    ];
  }

  // Category Filter
  if (category) {
    where.category = { slug: category };
  }

  // City Filter
  if (city) {
    where.city = { slug: city };
  }

  // Price Filter
  if (price) {
    if (price === "free") {
      where.priceType = "FREE";
    } else if (price === "paid") {
      where.priceType = "PAID";
    }
  }

  // Classification Filter
  if (classification) {
    where.organizerType = classification.toUpperCase();
  }

  // Date Filter logic
  if (date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date === "today") {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      where.startDate = { gte: today, lte: endOfToday };
    } else if (date === "tomorrow") {
      const startOfTomorrow = new Date();
      startOfTomorrow.setDate(today.getDate() + 1);
      startOfTomorrow.setHours(0, 0, 0, 0);
      const endOfTomorrow = new Date();
      endOfTomorrow.setDate(today.getDate() + 1);
      endOfTomorrow.setHours(23, 59, 59, 999);
      where.startDate = { gte: startOfTomorrow, lte: endOfTomorrow };
    } else if (date === "weekend") {
      const dayOfWeek = today.getDay(); // 0 is Sun, 5 is Fri, 6 is Sat
      const startOfWeekend = new Date(today);
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
      startOfWeekend.setDate(today.getDate() + (daysUntilFriday === 0 && dayOfWeek !== 5 ? 7 : daysUntilFriday));
      startOfWeekend.setHours(0, 0, 0, 0);

      const endOfWeekend = new Date(startOfWeekend);
      endOfWeekend.setDate(startOfWeekend.getDate() + 2); // Sunday
      endOfWeekend.setHours(23, 59, 59, 999);
      where.startDate = { gte: startOfWeekend, lte: endOfWeekend };
    } else if (date === "month") {
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      where.startDate = { gte: today, lte: endOfMonth };
    }
  }

  // 3. Sorting Options
  let orderBy: any = { startDate: "asc" }; // Default nearest upcoming
  if (sort === "latest") {
    orderBy = { createdAt: "desc" };
  } else if (sort === "popular") {
    orderBy = { viewsCount: "desc" };
  }

  // 4. Fetch filtered events
  const events = await prisma.event.findMany({
    where,
    include: {
      category: { select: { name: true, slug: true } },
      city: { select: { name: true, slug: true } },
    },
    orderBy,
  });

  // Query string builder helper
  const getQueryUrl = (newParams: Partial<SearchParams>) => {
    const updated = { ...params, ...newParams };
    const query = Object.entries(updated)
      .filter(([_, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return query ? `?${query}` : "";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-glow">
          Odisha Event Directory
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
          Browse Upcoming Events
        </h1>
        <p className="text-xs text-muted font-semibold">
          Showing {events.length} listings match your filters. Discover local plans and workshops.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* FILTERS SIDEBAR */}
        <aside className="lg:sticky lg:top-24 space-y-6 glass-panel p-6 rounded-3xl border border-card-line">
          <div className="flex items-center justify-between border-b border-card-line pb-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-ink flex items-center space-x-1.5">
              <SlidersHorizontal className="w-4 h-4 text-brand-accent shrink-0" />
              <span>Filters</span>
            </h3>
            <Link
              href="/events"
              className="text-[10px] font-bold text-muted hover:text-ink uppercase tracking-wider flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3 shrink-0" />
              <span>Clear All</span>
            </Link>
          </div>

          {/* Search bar */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
              Keyword
            </label>
            <form action="/events" method="GET" className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
              <input
                type="text"
                name="search"
                defaultValue={search || ""}
                placeholder="Search..."
                className="w-full bg-chip border border-card-line rounded-xl py-2 pl-9 pr-3 text-xs text-ink focus:outline-none focus:border-brand-accent/50 font-semibold"
              />
              {/* Keep other parameters in the search form */}
              {category && <input type="hidden" name="category" value={category} />}
              {city && <input type="hidden" name="city" value={city} />}
              {date && <input type="hidden" name="date" value={date} />}
              {price && <input type="hidden" name="price" value={price} />}
              {status && <input type="hidden" name="status" value={status} />}
              {sort && <input type="hidden" name="sort" value={sort} />}
              {classification && <input type="hidden" name="classification" value={classification} />}
            </form>
          </div>

          {/* City Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
              City / Location
            </label>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
              <Link
                href={getQueryUrl({ city: "" })}
                className={`px-3 py-2 rounded-xl text-left text-xs font-semibold ${
                  !city ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/25" : "bg-chip hover:bg-brand-accent/10 text-muted"
                }`}
              >
                All Cities
              </Link>
              {citiesList.map((c) => (
                <Link
                  key={c.id}
                  href={getQueryUrl({ city: c.slug })}
                  className={`px-3 py-2 rounded-xl text-left text-xs font-semibold ${
                    city === c.slug ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/25" : "bg-chip hover:bg-brand-accent/10 text-muted"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
              Category
            </label>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              <Link
                href={getQueryUrl({ category: "" })}
                className={`px-3 py-2 rounded-xl text-left text-xs font-semibold ${
                  !category ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/25" : "bg-chip hover:bg-brand-accent/10 text-muted"
                }`}
              >
                All Categories
              </Link>
              {categoriesList.map((cat) => (
                <Link
                  key={cat.id}
                  href={getQueryUrl({ category: cat.slug })}
                  className={`px-3 py-2 rounded-xl text-left text-xs font-semibold ${
                    category === cat.slug ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/25" : "bg-chip hover:bg-brand-accent/10 text-muted"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
              Date Filter
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { name: "Anytime", value: "" },
                { name: "Today", value: "today" },
                { name: "Tomorrow", value: "tomorrow" },
                { name: "This Weekend", value: "weekend" },
                { name: "This Month", value: "month" },
              ].map((d) => (
                <Link
                  key={d.name}
                  href={getQueryUrl({ date: d.value })}
                  className={`px-2.5 py-2 rounded-xl text-center text-[10px] font-bold ${
                    (date || "") === d.value ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/25" : "bg-chip hover:bg-brand-accent/10 text-muted"
                  }`}
                >
                  {d.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Classification Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
              Event Classification
            </label>
            <div className="flex flex-col gap-1.5 pr-1">
              <Link
                href={getQueryUrl({ classification: "" })}
                className={`px-3 py-2 rounded-xl text-left text-xs font-semibold ${
                  !classification ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/25" : "bg-chip hover:bg-brand-accent/10 text-muted"
                }`}
              >
                All Classifications
              </Link>
              {[
                { name: "Government Initiatives", value: "government" },
                { name: "Public Festivals", value: "public" },
                { name: "Private Gigs & Parties", value: "private" },
                { name: "Community & Social", value: "social" },
              ].map((c) => (
                <Link
                  key={c.value}
                  href={getQueryUrl({ classification: c.value })}
                  className={`px-3 py-2 rounded-xl text-left text-xs font-semibold ${
                    classification === c.value ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/25" : "bg-chip hover:bg-brand-accent/10 text-muted"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Entry Price Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
              Price
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { name: "All", value: "" },
                { name: "Free", value: "free" },
                { name: "Paid", value: "paid" },
              ].map((p) => (
                <Link
                  key={p.name}
                  href={getQueryUrl({ price: p.value })}
                  className={`py-2 rounded-xl text-center text-[10px] font-bold ${
                    (price || "") === p.value ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/25" : "bg-chip hover:bg-brand-accent/10 text-muted"
                  }`}
                >
                  {p.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
              Listing Status
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { name: "Confirmed", value: "published" },
                { name: "Watchlist", value: "watchlist" },
              ].map((s) => (
                <Link
                  key={s.name}
                  href={getQueryUrl({ status: s.value })}
                  className={`py-2 rounded-xl text-center text-[10px] font-bold ${
                    (status || "published") === s.value ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/25" : "bg-chip hover:bg-brand-accent/10 text-muted"
                  }`}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* EVENTS LIST GRID */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sorting and Grid Header */}
          <div className="flex items-center justify-between border-b border-card-line pb-4">
            <div className="text-xs font-bold text-muted">
              Showing <span className="text-ink">{events.length}</span> upcoming plans
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-brand-accent shrink-0" />
              <span className="text-muted font-extrabold uppercase tracking-wider text-[10px]">
                Sort:
              </span>
              <div className="flex gap-1.5">
                {[
                  { name: "Date", value: "" },
                  { name: "Trending", value: "popular" },
                  { name: "Latest", value: "latest" },
                ].map((s) => (
                  <Link
                    key={s.name}
                    href={getQueryUrl({ sort: s.value })}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                      (sort || "") === s.value
                        ? "border-brand-accent bg-brand-accent/10 text-brand-glow"
                        : "border-card-line hover:border-brand-accent/30 bg-chip text-muted"
                    }`}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Events Dynamic Grid */}
          {events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
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
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-16 rounded-3xl glass-panel border border-card-line space-y-4">
              <div className="w-16 h-16 rounded-full bg-chip border border-card-line flex items-center justify-center text-muted">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-ink">No Upcoming Events Found</h3>
                <p className="text-xs text-muted max-w-sm font-semibold leading-relaxed">
                  We couldn't find any events matching those specific filters. Try loosening your keywords or clearing dates!
                </p>
              </div>
              <Link
                href="/events"
                className="px-6 py-2.5 rounded-full glow-btn text-xs font-bold text-ink uppercase tracking-wider"
              >
                Reset Search
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
