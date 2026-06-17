import { prisma } from "@/lib/db";
import { isMovieContent, isNonPublicListing, isDisallowedEvent } from "@/lib/contentPolicy";

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

// Self-healing content-policy guard. The import filter only blocks NEW
// disallowed listings; rows imported before the filter (or that slip past it)
// stay live. Each scan, re-check every live event against the movie/cinema AND
// tender/notice/non-public policies and expire any that match — so the
// catalogue self-corrects without manual SQL.
async function archiveDisallowedEvents(): Promise<number> {
  const live = await prisma.event.findMany({
    where: { status: { in: ["PUBLISHED", "WATCHLIST"] } },
    select: {
      id: true,
      title: true,
      shortDescription: true,
      description: true,
      venueName: true,
      address: true,
    },
  });
  const badIds = live
    .filter(
      (e) =>
        isMovieContent(e.title, e.shortDescription, e.description, e.venueName, e.address) ||
        isNonPublicListing(e.title, e.shortDescription, e.description)
    )
    .map((e) => e.id);
  if (badIds.length === 0) return 0;
  const res = await prisma.event.updateMany({
    where: { id: { in: badIds } },
    data: { status: "EXPIRED" },
  });
  return res.count;
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
    // Content policy: never import movie / cinema ticketing listings.
    if (isDisallowedEvent(title, description, event.venue?.name)) continue;
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

// ---------------------------------------------------------------------------
// Social hashtag scanning — Instagram/Facebook events (esp. clubs & DJ nights).
//
// Meta does NOT allow open hashtag scraping. Two sanctioned routes, each gated
// behind a credential the operator provisions (so this stays ToS-compliant and
// never logs into / scrapes gated pages directly):
//   1. Instagram Graph API "Hashtag Search"  (IG_GRAPH_TOKEN + IG_USER_ID)
//   2. A third-party scraper, Apify          (APIFY_TOKEN)
// Posts that look like events become WATCHLIST listings (source=Instagram,
// unverified) — i.e. they show as "Rumoured" until an admin confirms them.
// ---------------------------------------------------------------------------
const SOCIAL_SOURCE = "Instagram";
const GRAPH_VERSION = "v21.0";

// Odisha club / DJ / nightlife / event hashtags. IG Graph allows ~30 unique
// hashtag queries per rolling 7 days, so keep the daily set small. Override
// with SCAN_HASHTAGS (comma separated, with or without the leading #).
const DEFAULT_HASHTAGS = [
  "bhubaneswarnightlife",
  "bhubaneswarevents",
  "odishaevents",
  "djnightbhubaneswar",
];

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Captions rarely carry a full date; understand "tonight", "tomorrow" and
// "this saturday" too, then fall back to the month/day parser.
export function parseSocialDate(text: string | undefined, now = new Date()): Date | null {
  if (!text) return null;
  // Normalise ordinals ("6th Dec", "21st Jan") so the day number is parseable.
  const t = text.toLowerCase().replace(/(\d{1,2})(st|nd|rd|th)\b/g, "$1");
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (/\b(tonight|today)\b/.test(t)) return today;
  if (/\btomorrow\b/.test(t)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }
  for (let i = 0; i < 7; i++) {
    const wd = WEEKDAYS[i];
    if (new RegExp(`\\b(${wd}|${wd.slice(0, 3)})\\b`).test(t)) {
      const d = new Date(today);
      const delta = ((i - d.getDay() + 7) % 7) || 7; // next occurrence
      d.setDate(d.getDate() + delta);
      return d;
    }
  }
  return parseSerpDate(t, now);
}

async function upsertSocialPost(args: {
  caption: string;
  mediaUrl: string | null;
  permalink: string | null;
  postId: string;
  result: SourceResult;
}): Promise<void> {
  const { caption, mediaUrl, permalink, postId, result } = args;
  const cleaned = caption.replace(/#[\p{L}\p{N}_]+/gu, " ").replace(/\s+/g, " ").trim();
  const title = (cleaned.split(/[\n.!|–\-•]/)[0] || cleaned).trim().substring(0, 90);
  if (!title || title.length < 4) return;
  // Content policy: no movies / tenders / non-public listings.
  if (isDisallowedEvent(title, caption)) return;

  const startDate = parseSocialDate(caption);
  if (!startDate) return; // require a parseable date to avoid noise

  const cityInfo = detectCity([caption]);
  const city = await ensureCity(cityInfo.name, cityInfo.district);
  const rule = inferCategory(title, caption);
  const category = await ensureCategory(rule.name, rule.slug, rule.icon);

  const slug = `social-ig-${slugify(postId)}`.substring(0, 90);
  const existing = await prisma.event.findUnique({ where: { slug }, select: { id: true } });

  await prisma.event.upsert({
    where: { slug },
    update: {
      shortDescription: cleaned.substring(0, 200),
      posterUrl: mediaUrl || FALLBACK_POSTER,
      sourceUrl: permalink || null,
      instagramUrl: permalink || null,
      // status intentionally not updated: keep admin moderation decisions
    },
    create: {
      title,
      slug,
      shortDescription: cleaned.substring(0, 200),
      description: cleaned || title,
      categoryId: category.id,
      cityId: city.id,
      organizerType: "PRIVATE",
      eventType: "OFFLINE",
      status: "WATCHLIST", // social finds are rumoured until an admin verifies
      startDate,
      venueName: "See Instagram post for venue",
      district: city.district,
      priceType: "NOT_ANNOUNCED",
      posterUrl: mediaUrl || FALLBACK_POSTER,
      sourceName: SOCIAL_SOURCE,
      sourceUrl: permalink || null,
      instagramUrl: permalink || null,
      isVerified: false,
      seoTitle: `${title} | Odisha Event Alert`,
      seoDescription: cleaned.substring(0, 160),
    },
  });

  if (existing) result.updated++;
  else result.created++;
}

interface GraphMedia {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
}

// Official Instagram Graph API hashtag search.
async function scanInstagramGraph(hashtags: string[], token: string, userId: string): Promise<SourceResult> {
  const result: SourceResult = {
    source: SOCIAL_SOURCE,
    query: hashtags.map((h) => `#${h}`).join(" "),
    status: "SUCCESS",
    found: 0,
    created: 0,
    updated: 0,
  };
  const base = `https://graph.facebook.com/${GRAPH_VERSION}`;

  for (const tag of hashtags) {
    const idRes = await fetch(
      `${base}/ig_hashtag_search?user_id=${encodeURIComponent(userId)}&q=${encodeURIComponent(tag)}&access_token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );
    const idJson = await idRes.json();
    if (idJson.error) throw new Error(`IG hashtag "${tag}": ${idJson.error.message || idJson.error}`);
    const hashtagId = idJson.data?.[0]?.id;
    if (!hashtagId) continue;

    const mediaRes = await fetch(
      `${base}/${hashtagId}/recent_media?user_id=${encodeURIComponent(userId)}&fields=id,caption,media_type,media_url,permalink,timestamp&limit=25&access_token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );
    const mediaJson = await mediaRes.json();
    if (mediaJson.error) throw new Error(`IG media "${tag}": ${mediaJson.error.message || mediaJson.error}`);
    const items: GraphMedia[] = mediaJson.data || [];
    result.found += items.length;

    for (const m of items) {
      if (!m.caption) continue;
      await upsertSocialPost({
        caption: m.caption,
        mediaUrl: m.media_type === "IMAGE" || m.media_type === "CAROUSEL_ALBUM" ? m.media_url || null : null,
        permalink: m.permalink || null,
        postId: m.id,
        result,
      });
    }
  }
  return result;
}

interface ApifyPost {
  id?: string;
  shortCode?: string;
  caption?: string;
  text?: string;
  url?: string;
  displayUrl?: string;
  imageUrl?: string;
}

// Optional third-party scraper (Apify Instagram Hashtag Scraper).
async function scanApifyHashtags(hashtags: string[], token: string): Promise<SourceResult> {
  const result: SourceResult = {
    source: "Instagram (Apify)",
    query: hashtags.map((h) => `#${h}`).join(" "),
    status: "SUCCESS",
    found: 0,
    created: 0,
    updated: 0,
  };
  const res = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hashtags, resultsLimit: 15 }),
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(`Apify request failed with status ${res.status}`);
  const items: ApifyPost[] = await res.json();
  result.found = Array.isArray(items) ? items.length : 0;

  for (const it of Array.isArray(items) ? items : []) {
    const caption = it.caption || it.text || "";
    if (!caption) continue;
    await upsertSocialPost({
      caption,
      mediaUrl: it.displayUrl || it.imageUrl || null,
      permalink: it.url || null,
      postId: it.id || it.shortCode || slugify(caption).substring(0, 40),
      result,
    });
  }
  return result;
}

// Runs the configured social providers; returns one SourceResult per provider.
async function scanSocialHashtags(): Promise<SourceResult[]> {
  const out: SourceResult[] = [];
  const hashtags = (process.env.SCAN_HASHTAGS || "")
    .split(",")
    .map((h) => h.trim().replace(/^#/, ""))
    .filter(Boolean);
  const tags = hashtags.length ? hashtags : DEFAULT_HASHTAGS;
  const igToken = process.env.IG_GRAPH_TOKEN;
  const igUser = process.env.IG_USER_ID;
  const apifyToken = process.env.APIFY_TOKEN;

  if (!igToken && !apifyToken) {
    out.push({
      source: SOCIAL_SOURCE,
      query: tags.map((h) => `#${h}`).join(" "),
      status: "SKIPPED",
      found: 0,
      created: 0,
      updated: 0,
      message:
        "Instagram/Facebook hashtag scan is off. Set IG_GRAPH_TOKEN + IG_USER_ID (official Instagram Graph API) or APIFY_TOKEN (third-party scraper) to enable.",
    });
    return out;
  }

  if (igToken && igUser) {
    try {
      out.push(await scanInstagramGraph(tags, igToken, igUser));
    } catch (error) {
      out.push({
        source: SOCIAL_SOURCE,
        query: tags.map((h) => `#${h}`).join(" "),
        status: "ERROR",
        found: 0,
        created: 0,
        updated: 0,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  } else if (igToken && !igUser) {
    out.push({
      source: SOCIAL_SOURCE,
      query: "",
      status: "SKIPPED",
      found: 0,
      created: 0,
      updated: 0,
      message: "IG_GRAPH_TOKEN is set but IG_USER_ID is missing (the connected Instagram Business account ID).",
    });
  }

  if (apifyToken) {
    try {
      out.push(await scanApifyHashtags(tags, apifyToken));
    } catch (error) {
      out.push({
        source: "Instagram (Apify)",
        query: tags.map((h) => `#${h}`).join(" "),
        status: "ERROR",
        found: 0,
        created: 0,
        updated: 0,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return out;
}

export async function runAutoScan(trigger: "CRON" | "MANUAL"): Promise<ScanSummary> {
  const startedAt = new Date();
  const results: SourceResult[] = [];

  const expired = await expirePastEvents();
  const moviesArchived = await archiveDisallowedEvents();

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

  // Social hashtag scan (Instagram/Facebook) — clubs, DJ nights & Odisha events.
  try {
    results.push(...(await scanSocialHashtags()));
  } catch (error) {
    results.push({
      source: SOCIAL_SOURCE,
      query: "",
      status: "ERROR",
      found: 0,
      created: 0,
      updated: 0,
      message: error instanceof Error ? error.message : String(error),
    });
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
        message:
          moviesArchived > 0
            ? `${r.message ? r.message + " · " : ""}${moviesArchived} disallowed listing(s) auto-archived`
            : r.message || null,
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
