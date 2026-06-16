// Content policy: Odisha Event Alert is an event-discovery platform, NOT a
// movie/cinema ticketing platform. These helpers keep movie/cinema content
// out of submissions, admin publishing and the auto-scan importer.

// Strong, low-false-positive movie/cinema signals. The word "film" alone is
// intentionally NOT blocked (filmmaking workshops, documentary talks are fine);
// only movie-screening / cinema-ticketing phrases are rejected.
export const MOVIE_KEYWORDS = [
  "movie",
  "movies",
  "cinema",
  "cineplex",
  "multiplex",
  "film screening",
  "film show",
  "movie ticket",
  "movie tickets",
  "theatre movie",
  "movie premiere",
  "movie night",
  "movie show",
  "first day first show",
  "in cinemas",
  "now showing in theatres",
  // Phrases common to auto-scraped Google "Movies" listings:
  "movie show time",
  "show time in",
  "showtimes",
  "book tickets for the movie",
  "biopic",
  "box office collection",
  "(u/a)",
  "u/a certificate",
  "censor certificate",
];

// Cinema chains and known Odisha multiplex venues. Auto-scanned movie
// listings almost always carry one of these as the venue, even when the
// title (a film name) and blurb contain no obvious movie keyword. Matched
// against the event venue/address. Keep these distinctive to avoid matching
// ordinary event halls (do NOT add bare "mall"/"plaza").
export const CINEMA_VENUE_KEYWORDS = [
  "pvr",
  "inox",
  "cinepolis",
  "cinépolis",
  "movieex",
  "miraj cinema",
  "carnival cinema",
  "mukta a2",
  "city pride",
  "movietime",
  "cinema hall",
  "cineplex",
  "multiplex",
  "uday plaza", // Bhubaneswar cinema seen in scans
];

export function isMovieContent(...parts: (string | null | undefined)[]): boolean {
  const haystack = parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!haystack) return false;
  return (
    MOVIE_KEYWORDS.some((kw) => haystack.includes(kw)) ||
    CINEMA_VENUE_KEYWORDS.some((kw) => haystack.includes(kw))
  );
}

// Non-public / administrative listings that are NOT real public events:
// tenders, notices, recruitment, government documents, results, etc. These
// sometimes appear in scraped "events" feeds but must never surface publicly.
export const NON_PUBLIC_KEYWORDS = [
  "tender",
  "e-tender",
  "e-procurement",
  "notice inviting",
  "nit no",
  "request for proposal",
  "request for quotation",
  " rfp ",
  " rfq ",
  "expression of interest",
  " eoi ",
  "corrigendum",
  "addendum to tender",
  "gazette notification",
  "office order",
  "office memorandum",
  "circular no",
  "recruitment",
  "vacancy",
  "walk-in interview",
  "walk in interview",
  "admit card",
  "answer key",
  "merit list",
  "exam result",
  "result declared",
  "counselling schedule",
  "auction notice",
  "public notice",
  "tender notice",
];

export function isNonPublicListing(...parts: (string | null | undefined)[]): boolean {
  // Pad with spaces so " rfp "/" eoi " word-boundary-ish checks work at edges.
  const haystack = ` ${parts.filter(Boolean).join(" ").toLowerCase()} `;
  if (haystack.trim().length === 0) return false;
  return NON_PUBLIC_KEYWORDS.some((kw) => haystack.includes(kw));
}

// Single guard used by submissions, admin publishing and the importer.
export function isDisallowedEvent(...parts: (string | null | undefined)[]): boolean {
  return isMovieContent(...parts) || isNonPublicListing(...parts);
}

export const NON_PUBLIC_REJECTION_MESSAGE =
  "This looks like a tender, notice, recruitment or government document rather than a public event. Odisha Event Alert only lists real, public events open to attendees.";

// User-facing rejection copy (mandated wording).
export const MOVIE_REJECTION_MESSAGE =
  "Odisha Event Alert does not list or sell movie tickets. We only cover events, experiences, activities, workshops, concerts, shows, fests, exhibitions, and community happenings across Odisha.";

// Reusable site copy.
export const NO_MOVIES_NOTE =
  "Odisha Event Alert does not list or sell movie tickets. We only cover events, experiences, activities, workshops, concerts, shows, fests, exhibitions, and community happenings across Odisha.";

export const POSITIONING_STATEMENT =
  "Odisha Event Alert is a dedicated event discovery platform for Odisha — not a movie ticketing platform.";

export const EVENT_TRUST_NOTE =
  "Event details are collected from public sources, organiser submissions, or official event platforms. Please verify final timing, venue, and ticket details from the official source before attending.";
