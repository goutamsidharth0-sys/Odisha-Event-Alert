import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// OEA Auto-Scan Engine
// Scans the web for events happening in Odisha (via SerpApi's Google Events
// engine), normalizes the results, and upserts them into the events table.
// Runs daily via Vercel Cron and on-demand from the admin "Auto-Scan" panel.
// ---------------------------------------------------------------------------

const SOURCE_NAME = "Google Events";

const FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop";

// Each query costs one SerpApi search. Keep the default list small so a daily
// cron stays within the free 100 searches/month tier; override with the
// SCAN_QUERIES env var (comma separated) to widen coverage.
const DEFAULT_QUERIES = [
  "Events in Bhubaneswar Odisha",
  "Events in Cuttack Odisha",
  "Upcoming events in Odisha",
];

// Odisha localities we recognize in scraped addresses. The first match wins;
// unknown localities fall back to Bhubaneswar (the events hub of the state).
const KNOWN_CITIES: { name: string; district?: string }[] = [
  { name: "Bhubaneswar", district: "Khordha" },
  { name: "Cuttack", district: "Cuttack" },
  { name: "Puri", district: "Puri" },
  { name: "Konark", district: "Puri" },
  { name: "Rourkela", district: "Sundargarh" },
  { name: "Sambalpur", district: "Sambalpur" },
  { name: "Berhampur", district: "Ganjam" },
  { name: "Gopalpur", district: "Ganjam" },
  { name: "Balasore", district: "Balasore" },
  { name: "Baripada", district: "Mayurbhanj" },
  { name: "Angul", district: "Angul" },
  { name: "Dhenkanal", district: "Dhenkanal" },
  { name: "Keonjhar", district: "Kendujhar" },
  { name: "Jajpur", district: "Jajpur" },
  { name: "Paradip", district: "Jagatsinghpur" },
  { name: "Koraput", district: "Koraput" },
];

const CATEGORY_RULES: { keywords: string[]; name: string; slug: string; icon: string }[] = [
  { keywords: ["open mic", "open-mic", "poetry", "spoken word", "storytelling night"], name: "Open Mic Events", slug: "open-mic", icon: "Mic" },
  { keywords: ["jam session", "jamming", "acoustic night", "music circle", "indie jam"], name: "Jamming Sessions", slug: "jamming", icon: "Guitar" },
  { keywords: ["grand opening", "now open", "new opening", "soft launch", "grand launch"], name: "New Openings", slug: "new-openings", icon: "Store" },
  { keywords: ["comedy", "standup", "stand-up"], name: "Comedy", slug: "comedy", icon: "Smile" },
  { keywords: ["dj", "edm", "club night", "party", "nightlife"], name: "DJ Nights", slug: "dj-nights", icon: "Disc" },
  { keywords: ["concert", "music", "live", "band", "singer", "gig"], name: "Concerts", slug: "concerts", icon: "Music" },
  { keywords: ["workshop", "masterclass", "bootcamp", "training"], name: "Workshops", slug: "workshops", icon: "Compass" },
  { keywords: ["food", "culinary", "flea"], name: "Food Festivals", slug: "food-festivals", icon: "Utensils" },
  { keywords: ["startup", "business", "summit", "conference", "seminar", "expo b2b"], name: "Business Events", slug: "business", icon: "Briefcase" },
  { keywords: ["marathon", "run", "cricket", "hockey", "football", "tournament", "sports"], name: "Sports", slug: "sports", icon: "Trophy" },
  { keywords: ["yoga", "fitness", "meditation", "wellness"], name: "Fitness & Yoga", slug: "fitness", icon: "Heart" },
  { keywords: ["exhibition", "expo", "fair", "trade", "book"], name: "Exhibitions", slug: "exhibitions", icon: "Layers" },
  { keywords: ["fest", "festival", "puja", "carnival", "cultural", "dance", "odissi"], name: "Cultural Events", slug: "cultural", icon: "Sparkles" },
  { keywords: ["college", "university", "campus"], name: "College Fests", slug: "college-fests", icon: "GraduationCap" },
];

const OTHER_CATEGORY = { name: "Other Events", slug: "other-events", icon: "Calendar" };

export interface SourceResult {
  source: string;
  query: string;
  status: "SUCCESS" | "ERROR" | "SKIPPED";
  found: number;
  created: number;
  updated: number;
  message?: string;
}

export interface ScanSummary {
  trigger: "CRON" | "MANUAL";
  startedAt: string;
  finishedAt: string;
  expired: number;
  totalFound: number;
  totalCreated: number;
  totalUpdated: number;
  results: SourceResult[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// SerpApi returns dates like "Jun 12", "12 Jun", or "Jun 12, 2026" in
// date.start_date / date.when. Resolve to the next occurrence of that
// calendar day so results are never accidentally dated a year in the past.
export function parseSerpDate(raw: string | undefined, now = new Date()): Date | null {
  if (!raw) return null;
  const text = raw.toLowerCase();

  const explicitYear = text.match(/\b(20\d{2})\b/)?.[1];
  const monthMatch = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/);
  const dayMatch = text.match(/\b([0-3]?\d)\b/);
  if (!monthMatch || !dayMatch) return null;

  const month = MONTHS[monthMatch[1]];
  const day = parseInt(dayMatch[1], 10);
  if (day < 1 || day > 31) return null;

  const year = explicitYear ? parseInt(explicitYear, 10) : now.getFullYear();
  let date = new Date(Date.UTC(year, month, day));

  if (!explicitYear) {
    // Roll to next year if the date already passed more than 2 days ago
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    if (date < twoDaysAgo) {
      date = new Date(Date.UTC(year + 1, month, day));
    }
  }
  return isNaN(date.getTime()) ? null : date;
}

function inferCategory(title: string, description: string) {
  const haystack = `${title} ${description}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) return rule;
  }
  return { ...OTHER_CATEGORY, keywords: [] };
}

function detectCity(texts: (string | undefined)[]) {
  const haystack = texts.filter(Boolean).join(" ").toLowerCase();
  for (const city of KNOWN_CITIES) {
    if (haystack.includes(city.name.toLowerCase())) return city;
  }
  return KNOWN_CITIES[0]; // Bhubaneswar
}

async function ensureCity(name: string, district?: string) {
  const slug = slugify(name);
  return prisma.city.upsert({
    where: { slug },
    update: {},
    create: { name, slug, district: district || null, status: "ACTIVE" },
  });
}

async function ensureCategory(name: string, slug: string, icon: string) {
  return prisma.category.upsert({
    where: { slug },
    update: {},
    create: { name, slug, icon, status: "ACTIVE", sortOrder: 99 },
  });
}

// Mark past events as EXPIRED so the public listing stays fresh.
async function expirePastEvents(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [withEnd, withoutEnd] = await Promise.all([
    prisma.event.updateMany({
      where: { status: "PUBLISHED", endDate: { not: null, lt: cutoff } },
      data: { status: "EXPIRED" },
    }),
    prisma.event.updateMany({
      where: { status: "PUBLISHED", endDate: null, startDate: { lt: cutoff } },
      data: { status: "EXPIRED" },
    }),
  ]);
  return withEnd.count + withoutEnd.count;
}

interface SerpApiEvent {
  title?: string;
  description?: string;
  link?: string;
  date?: { start_date?: string; when?: string };
  address?: string[];
  venue?: { name?: string };
  thumbnail?: string;
  image?: string;
  ticket_info?: { link?: string; source?: string; link_type?: string }[];
}

async function scanGoogleEvents(query: string, apiKey: string): Promise<SourceResult> {
  const result: SourceResult = {
    source: SOURCE_NAME,
    query,
    status: "SUCCESS",
    found: 0,
    created: 0,
    updated: 0,
  };

  const url = `https://serpapi.com/search.json?engine=google_events&q=${encodeURIComponent(query)}&hl=en&gl=in&api_key=${apiKey}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`SerpApi request failed with status ${response.status}`);
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(`SerpApi error: ${data.error}`);
  }

  const events: SerpApiEvent[] = data.events_results || [];
  result.found = events.length;

  for (const event of events) {
    if (!event.title) continue;

    const title = event.title.trim();
    const description = (event.description || event.date?.when || title).trim();
    const venueName = event.venue?.name || event.address?.[0] || "Venue to be announced";
    const startDate = parseSerpDate(event.date?.start_date || event.date?.when);
    if (!startDate) continue; // skip events we cannot date reliably

    const cityInfo = detectCity([event.address?.join(", "), title, description]);
    const city = await ensureCity(cityInfo.name, cityInfo.district);

    const categoryRule = inferCategory(title, description);
    const category = await ensureCategory(categoryRule.name, categoryRule.slug, categoryRule.icon);

    const ticketLink =
      event.ticket_info?.find((t) => t.link_type === "tickets")?.link ||
      event.ticket_info?.[0]?.link ||
      event.link ||
      null;

    const slug = `auto-${slugify(title).substring(0, 60)}-${city.slug}`.substring(0, 90);
    const existing = await prisma.event.findUnique({ where: { slug }, select: { id: true } });

    await prisma.event.upsert({
      where: { slug },
      update: {
        shortDescription: description.substring(0, 200),
        description,
        venueName,
        address: event.address?.join(", ") || null,
        startDate,
        posterUrl: event.image || event.thumbnail || FALLBACK_POSTER,
        ticketingUrl: ticketLink,
        sourceUrl: event.link || null,
        // status intentionally not updated: keep admin moderation decisions
      },
      create: {
        title,
        slug,
        shortDescription: description.substring(0, 200),
        description,
        categoryId: category.id,
        cityId: city.id,
        organizerType: "PUBLIC",
        eventType: "OFFLINE",
        status: "PUBLISHED",
        startDate,
        venueName,
        address: event.address?.join(", ") || null,
        district: city.district,
        priceType: "NOT_ANNOUNCED",
        posterUrl: event.image || event.thumbnail || FALLBACK_POSTER,
        ticketingUrl: ticketLink,
        sourceName: SOURCE_NAME,
        sourceUrl: event.link || null,
        isVerified: false,
        seoTitle: `${title} | Odisha Event Alert`,
        seoDescription: description.substring(0, 160),
        publishedAt: new Date(),
      },
    });

    if (existing) result.updated++;
    else result.created++;
  }

  return result;
}

export async function runAutoScan(trigger: "CRON" | "MANUAL"): Promise<ScanSummary> {
  const startedAt = new Date();
  const results: SourceResult[] = [];

  const expired = await expirePastEvents();

  const apiKey = process.env.SERPAPI_KEY;
  const queries = (process.env.SCAN_QUERIES || "")
    .split(",")
    .map((q) => q.trim())
    .filter(Boolean);
  const scanQueries = queries.length > 0 ? queries : DEFAULT_QUERIES;

  if (!apiKey) {
    const skipped: SourceResult = {
      source: SOURCE_NAME,
      query: scanQueries.join(" | "),
      status: "SKIPPED",
      found: 0,
      created: 0,
      updated: 0,
      message: "SERPAPI_KEY is not configured — add it in Vercel project settings to enable web scanning.",
    };
    results.push(skipped);
  } else {
    for (const query of scanQueries) {
      try {
        results.push(await scanGoogleEvents(query, apiKey));
      } catch (error) {
        results.push({
          source: SOURCE_NAME,
          query,
          status: "ERROR",
          found: 0,
          created: 0,
          updated: 0,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const finishedAt = new Date();

  // Persist one log row per source query so the admin panel shows history.
  for (const r of results) {
    await prisma.scanLog.create({
      data: {
        source: r.source,
        query: r.query,
        trigger,
        status: r.status,
        found: r.found,
        created: r.created,
        updated: r.updated,
        expired,
        message: r.message || null,
        startedAt,
        finishedAt,
      },
    });
  }

  return {
    trigger,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    expired,
    totalFound: results.reduce((n, r) => n + r.found, 0),
    totalCreated: results.reduce((n, r) => n + r.created, 0),
    totalUpdated: results.reduce((n, r) => n + r.updated, 0),
    results,
  };
}
