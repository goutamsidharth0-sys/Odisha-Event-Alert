// Shared SEO constants and JSON-LD builders.

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.odishaeventalert.com";

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

// ---------------------------------------------------------------------------
// Keyword-rich SEO landing paths.
// These are the CANONICAL URLs. The /city/<slug> and /category/<slug> routes
// stay live (no breakage) but point their canonical here, so Google
// consolidates ranking signals onto the keyword URL.
// To add another keyword landing page later, add a new route folder under
// src/app and a mapping entry below — nothing else changes.
// ---------------------------------------------------------------------------
export const CITY_SEO_PATH: Record<string, string> = {
  bhubaneswar: "/events-in-bhubaneswar",
  cuttack: "/events-in-cuttack",
  puri: "/events-in-puri",
};

export const CATEGORY_SEO_PATH: Record<string, string> = {
  concerts: "/concerts-in-odisha",
  "college-fests": "/college-fests-in-odisha",
};

export function cityPath(slug: string): string {
  return CITY_SEO_PATH[slug] ?? `/city/${slug}`;
}

export function categoryPath(slug: string): string {
  return CATEGORY_SEO_PATH[slug] ?? `/category/${slug}`;
}
