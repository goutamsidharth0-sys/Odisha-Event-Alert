import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SITE_URL, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import SectionHead from "@/components/SectionHead";
import Rise from "@/components/Rise";
import { EventGrid, Crumbs, FaqPanel, LinkChips, EventForCard } from "@/components/landing";
import { CalendarDays, Sparkles } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

const EVENT_INCLUDE = {
  category: { select: { name: true, slug: true } },
  city: { select: { name: true, slug: true } },
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true, status: true },
  });
  if (!category || category.status !== "ACTIVE")
    return { title: "Category not found — Odisha Event Alert" };
  const description = `Upcoming ${category.name.toLowerCase()} across Odisha — Bhubaneswar, Cuttack, Puri and more. ${category.description || ""} Verified listings, free interest registration, updated daily on Odisha Event Alert.`.trim();
  return {
    title: `${category.name} in Odisha — Upcoming Listings | Odisha Event Alert`,
    description,
    alternates: { canonical: `${SITE_URL}/category/${slug}` },
    openGraph: {
      title: `${category.name} in Odisha | Odisha Event Alert`,
      description,
      url: `${SITE_URL}/category/${slug}`,
    },
  };
}

export default async function CategoryLandingPage({ params }: Props) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category || category.status !== "ACTIVE") notFound();

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [upcomingEvents, upcomingCount, freeCount, cities, otherCategories] = await Promise.all([
    prisma.event.findMany({
      where: { status: "PUBLISHED", categoryId: category.id, startDate: { gte: startOfToday } },
      include: EVENT_INCLUDE,
      orderBy: { startDate: "asc" },
      take: 12,
    }),
    prisma.event.count({
      where: { status: "PUBLISHED", categoryId: category.id, startDate: { gte: startOfToday } },
    }),
    prisma.event.count({
      where: {
        status: "PUBLISHED",
        categoryId: category.id,
        priceType: "FREE",
        startDate: { gte: startOfToday },
      },
    }),
    prisma.city.findMany({
      where: { status: "ACTIVE" },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { status: "ACTIVE", slug: { not: slug } },
      select: { name: true, slug: true },
      orderBy: { sortOrder: "asc" },
      take: 12,
    }),
  ]);

  const lowerName = category.name.toLowerCase();
  const cityNames = upcomingEvents
    .map((e) => e.city.name)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 3);

  const faqs = [
    {
      q: `Where can I find ${lowerName} in Odisha?`,
      a:
        upcomingCount > 0
          ? `Odisha Event Alert currently lists ${upcomingCount} upcoming ${lowerName}${cityNames.length ? ` across ${cityNames.join(", ")}` : " across Odisha"}. Every listing is reviewed before it goes live, and new ones are added daily.`
          : `Odisha Event Alert tracks ${lowerName} across Bhubaneswar, Cuttack, Puri, Rourkela and the rest of Odisha. New listings are added daily from organiser submissions and our auto-scan of the web.`,
    },
    {
      q: `Are there free ${lowerName} listed?`,
      a:
        freeCount > 0
          ? `Yes — ${freeCount} upcoming free listing${freeCount === 1 ? "" : "s"} in this category right now. Registration on OEA is always free.`
          : `Free listings appear in this category regularly. Registration on Odisha Event Alert is always free, and you can opt in to alerts for similar events.`,
    },
    {
      q: `How do I register for ${lowerName} on OEA?`,
      a: "Open any listing and use the Register Interest form — name and mobile number are all that's needed. You'll get a registration ID, plus reminders and instant alerts if anything changes.",
    },
    {
      q: `How do I list my ${lowerName.replace(/s$/, "")} on Odisha Event Alert?`,
      a: "Use the Submit Your Event form with your event details and a poster. Our team reviews and verifies every submission before it's published. Listing is free.",
    },
  ];

  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Categories", href: "/events" },
    { name: category.name },
  ];

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", url: SITE_URL },
      { name: "Categories", url: `${SITE_URL}/events` },
      { name: `${category.name} in Odisha`, url: `${SITE_URL}/category/${slug}` },
    ]),
    faqJsonLd(faqs),
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
              <Sparkles className="w-8 h-8 text-brand-accent shrink-0 mt-1.5 hidden sm:block" />
              <span>
                <span className="grad-text">{category.name}</span> in Odisha
              </span>
            </h1>
            <p className="max-w-3xl text-sm sm:text-base font-semibold text-muted leading-relaxed">
              {category.description ? `${category.description}. ` : ""}
              Browse verified {lowerName} across Bhubaneswar, Cuttack, Puri, Rourkela and the rest of
              Odisha — reviewed before they go live, updated daily, with free interest registration
              on OEA.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/events?category=${slug}`} className="chip-btn inline-flex items-center">
                All {category.name}
              </Link>
              <Link href={`/events?category=${slug}&price=free`} className="chip-btn inline-flex items-center">
                Free only
              </Link>
              <Link href={`/events?category=${slug}&date=weekend`} className="chip-btn inline-flex items-center">
                This Weekend
              </Link>
            </div>
          </div>
        </Rise>

        {/* Upcoming events */}
        <section>
          <SectionHead
            icon={CalendarDays}
            title={`Upcoming ${category.name}`}
            sub={`${upcomingCount} upcoming listing${upcomingCount === 1 ? "" : "s"} · refreshed daily`}
            href={`/events?category=${slug}`}
            linkText="View all"
          />
          {upcomingEvents.length > 0 ? (
            <EventGrid events={upcomingEvents as EventForCard[]} />
          ) : (
            <div className="glass-panel rounded-3xl p-10 text-center space-y-3">
              <p className="font-display font-bold text-ink">
                Nothing on the radar in this category right now.
              </p>
              <p className="text-sm text-muted font-semibold">
                New events are scanned and added daily — or be the first to{" "}
                <Link href="/submit-event" className="text-brand-accent font-bold hover:underline">
                  list yours
                </Link>
                .
              </p>
            </div>
          )}
        </section>

        {/* FAQ */}
        <Rise>
          <FaqPanel faqs={faqs} />
        </Rise>

        {/* Internal links + CTA */}
        <div className="glass-panel rounded-3xl p-7 sm:p-8 space-y-7">
          <LinkChips
            title={`${category.name} by city`}
            links={cities.map((c) => ({
              name: c.name,
              href: `/events?category=${slug}&city=${c.slug}`,
            }))}
          />
          <LinkChips
            title="Other categories"
            links={otherCategories.map((c) => ({ name: c.name, href: `/category/${c.slug}` }))}
          />
          <LinkChips
            title="Events by city"
            links={cities.slice(0, 6).map((c) => ({ name: `Events in ${c.name}`, href: `/city/${c.slug}` }))}
          />
          <div className="pt-2 border-t border-card-line flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-semibold text-muted">
              Organising {lowerName}? Put them on the radar — listing is free.
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
