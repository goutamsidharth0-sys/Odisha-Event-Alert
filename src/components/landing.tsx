import React from "react";
import Link from "next/link";
import { ChevronRight, HelpCircle } from "lucide-react";
import EventCard, { EventCardProps } from "./EventCard";
import TiltCard from "./TiltCard";
import Rise from "./Rise";

// Shared building blocks for the SEO landing pages (/city/*, /category/*).

export interface EventForCard {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  startDate: Date;
  endDate: Date | null;
  startTime: string | null;
  venueName: string;
  city: { name: string; slug: string };
  category: { name: string; slug: string };
  priceType: string;
  minPrice: number | null;
  posterUrl: string | null;
  isFeatured: boolean;
  isVerified: boolean;
  status: string;
  organizerType: string;
  sourceName?: string | null;
  updatedAt?: Date | string | null;
}

export function eventToCardProps(event: EventForCard): EventCardProps {
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
    sourceName: event.sourceName,
    updatedAt: event.updatedAt,
  };
}

export function EventGrid({ events, columns = 4 }: { events: EventForCard[]; columns?: 3 | 4 }) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-6`}
    >
      {events.map((event, i) => (
        <Rise key={event.id} delay={i * 60}>
          <TiltCard className="rounded-2xl h-full">
            <EventCard {...eventToCardProps(event)} />
          </TiltCard>
        </Rise>
      ))}
    </div>
  );
}

export function Crumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-brand-accent transition-colors">
              {item.name}
            </Link>
          ) : (
            <span className="text-ink">{item.name}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export function FaqPanel({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8">
      <h2 className="text-lg font-display font-bold text-ink tracking-tight flex items-center gap-2 mb-5">
        <HelpCircle className="w-5 h-5 text-brand-accent shrink-0" />
        Frequently Asked Questions
      </h2>
      <div className="divide-y divide-card-line">
        {faqs.map((faq, i) => (
          <details key={i} className="group py-3.5" open={i === 0}>
            <summary className="cursor-pointer list-none flex items-start justify-between gap-3 text-sm font-bold text-ink hover:text-brand-accent transition-colors">
              <span>{faq.q}</span>
              <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 transition-transform group-open:rotate-90 text-brand-accent" />
            </summary>
            <p className="text-sm font-medium text-muted leading-relaxed mt-2 pr-6">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function LinkChips({ title, links }: { title: string; links: { name: string; href: string }[] }) {
  if (links.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-brand-accent">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="chip-btn inline-flex items-center">
            {link.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
