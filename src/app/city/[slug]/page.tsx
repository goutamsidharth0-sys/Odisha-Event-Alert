import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SITE_URL, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import SectionHead from "@/components/SectionHead";
import Rise from "@/components/Rise";
import { EventGrid, Crumbs, FaqPanel, LinkChips, EventForCard } from "@/components/landing";
import { CalendarDays, Store, MapPin } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

const EVENT_INCLUDE = {
  category: { select: { name: true, slug: true } },
  city: { select: { name: true, slug: true } },
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = await prisma.city.findUnique({
    where: { slug },
    select: { name: true, description: true, status: true },
  });
  if (!city || city.status !== "ACTIVE") return { title: "City not found — Odisha Event Alert" };
  const description = `Find verified events in ${city.name} today, tomorrow and this weekend — concerts, open mics, workshops, food festivals, new openings and offers. ${city.description || ""} Updated daily on Odisha Event Alert.`.trim();
  return {
    title: `Events in ${city.name} Today & This Weekend | Odisha Event Alert`,
    description,
    alternates: { canonical: `${SITE_URL}/city/${slug}` },
    openGraph: {
      title: `Events in ${city.name} | Odisha Event Alert`,
      description,
      url: `${SITE_URL}/city/${slug}`,
    },
  };
}

export default async function CityLandingPage({ params }: Props) {
  const { slug } = await params;

  const city = await prisma.city.findUnique({ where: { slug } });
  if (!city || city.status !== "ACTIVE") notFound();

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const inSevenDays = new Date(startOfToday);
  inSevenDays.setDate(inSevenDays.getDate() + 7);

  const [upcomingEvents, newInCity, freeCount, weekCount, otherCities, categories] =
    await Promise.all([
      prisma.event.findMany({
        where: { status: "PUBLISHED", cityId: city.id, startDate: { gte: startOfToday } },
        include: EVENT_INCLUDE,
        orderBy: { startDate: "asc" },
        take: 12,
      }),
      prisma.event.findMany({
        where: {
          status: "PUBLISHED",
          cityId: city.id,
          category: { slug: { in: ["new-openings", "offers"] } },
        },
        include: EVENT_INCLUDE,
        orderBy: { startDate: "asc" },
        take: 4,
      }),
      prisma.event.count({
        where: { status: "PUBLISHED", cityId: city.id, priceType: "FREE", startDate: { gte: startOfToday } },
      }),
      prisma.event.count({
        where: {
          status: "PUBLISHED",
          cityId: city.id,
          startDate: { gte: startOfToday, lte: inSevenDays },
        },
      }),
      prisma.city.findMany({
        where: { status: "ACTIVE", slug: { not: slug } },
        select: { name: true, slug: true },
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        where: { status: "ACTIVE" },
        select: { name: true, slug: true },
        orderBy: { sortOrder: "asc" },
        take: 12,
      }),
    ]);

  const topTitles = upcomingEvents.slice(0, 3).map((e) => e.title);
  const faqs = [
    {
      q: `What events are happening in ${city.name} this week?`,
      a:
        weekCount > 0
          ? `There ${weekCount === 1 ? "is" : "are"} ${weekCount} verified event${weekCount === 1 ? "" : "s"} listed in ${city.name} over the next seven days on Odisha Event Alert${topTitles.length ? `, including ${topTitles.join(", ")}` : ""}. New listings are added daily from organiser submissions and our auto-scan of the web.`
          : `New events in ${city.name} are added daily on Odisha Event Alert from organiser submissions and our auto-scan of the web. Check back soon or register for alerts on any upcoming listing.`,
    },
    {
      q: `Are there free events in ${city.name}?`,
      a:
        freeCount > 0
          ? `Yes — ${freeCount} upcoming free event${freeCount === 1 ? " is" : "s are"} currently listed in ${city.name}. Every free event lets you register on OEA at no cost and get reminders before it starts.`
          : `Free events in ${city.name} appear regularly — cultural programmes, community meets, exhibitions and open mics. Registration on Odisha Event Alert is always free.`,
    },
    {
      q: `How do I list my event in ${city.name} on Odisha Event Alert?`,
      a: `Use the Submit Your Event form, add your event details with a poster, and our team will review and verify it before publishing. Listing is free, and you receive interest registrations from people in ${city.name}.`,
    },
    {
      q: "Does Odisha Event Alert sell tickets?",
      a: "No. OEA is a trusted event radar, not a ticketing site. You register interest on OEA and get confirmations, reminders and change alerts. Tickets for paid events are handled by the official organiser or source.",
    },
  ];

  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Cities", href: "/events" },
    { name: city.name },
  ];

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", url: SITE_URL },
      { name: "Cities", url: `${SITE_URL}/events` },
      { name: `Events in ${city.name}`, url: `${SITE_URL}/city/${slug}` },
    ]),
    faqJsonLd(faqs),
  ];

  const quickChips = [
    { name: "Today", href: `/events?city=${slug}&date=today` },
    { name: "This Weekend", href: `/events?city=${slug}&date=weekend` },
    { name: "Free Events", href: `/events?city=${slug}&price=free` },
    { name: `All events in ${city.name}`, href: `/events?city=${slug}` },
  ];

  return (
    <div className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {/* Hero */}
        <Rise>
          <div className="glass-panel rounded-3xl p-7 sm:p-10 space-y-5">
            <Crumbs items={crumbs} />
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-ink leading-tight flex items-start gap-3">
              <MapPin className="w-8 h-8 text-brand-accent shrink-0 mt-1.5 hidden sm:block" />
              <span>
                Events in <span className="grad-text">{city.name}</span>
              </span>
            </h1>
            <p className="max-w-3xl text-sm sm:text-base font-semibold text-muted leading-relaxed">
              {city.description ? `${city.description} ` : ""}
              Discover verified concerts, open mics, jamming sessions, workshops, food festivals,
              college fests, new openings and offers happening in {city.name} — reviewed before they
              go live, updated daily, with free interest registration on OEA.
            </p>
            <div className="flex flex-wrap gap-2">
              {quickChips.map((chip) => (
                <Link key={chip.href} href={chip.href} className="chip-btn inline-flex items-center">
                  {chip.name}
                </Link>
              ))}
            </div>
          </div>
        </Rise>

        {/* Upcoming events */}
        <section>
          <SectionHead
            icon={CalendarDays}
            title={`Upcoming in ${city.name}`}
            sub={`${weekCount} event${weekCount === 1 ? "" : "s"} in the next 7 days · refreshed daily`}
            href={`/events?city=${slug}`}
            linkText="All events"
          />
          {upcomingEvents.length > 0 ? (
            <EventGrid events={upcomingEvents as EventForCard[]} />
          ) : (
            <div className="glass-panel rounded-3xl p-10 text-center space-y-3">
              <p className="font-display font-bold text-ink">
                Nothing on the radar in {city.name} right now.
              </p>
              <p className="text-sm text-muted font-semibold">
                New events are scanned and added daily — or be the first to{" "}
                <Link href="/submit-event" className="text-brand-accent font-bold hover:underline">
                  list your event
                </Link>
                .
              </p>
            </div>
          )}
        </section>

        {/* New in city */}
        {newInCity.length > 0 && (
          <section>
            <SectionHead
              icon={Store}
              title={`New in ${city.name}`}
              sub="New openings, launch offers and deals."
              href={`/events?category=new-openings&city=${slug}`}
              linkText="Openings & offers"
            />
            <EventGrid events={newInCity as EventForCard[]} />
          </section>
        )}

        {/* FAQ */}
        <Rise>
          <FaqPanel faqs={faqs} />
        </Rise>

        {/* Internal links + CTA */}
        <div className="glass-panel rounded-3xl p-7 sm:p-8 space-y-7">
          <LinkChips
            title="Events in other cities"
            links={otherCities.map((c) => ({ name: `Events in ${c.name}`, href: `/city/${c.slug}` }))}
          />
          <LinkChips
            title="Browse by category"
            links={categories.map((c) => ({ name: c.name, href: `/category/${c.slug}` }))}
          />
          <div className="pt-2 border-t border-card-line flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-semibold text-muted">
              Hosting something in {city.name}? Put it on the radar — listing is free.
            </p>
            <Link
              href="/submit-event"
              className="px-6 py-3 rounded-full glow-btn text-white text-xs font-bold font-display uppercase tracking-wider"
            >
              Submit Your Event
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
