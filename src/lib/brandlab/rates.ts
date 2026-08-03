// SERVER ONLY — First Page's internal rate card.
//
// This is the input to `estimatedValue` (§5), the number the team sorts the
// inbox by. It is kept in its own module, separate from `templates.ts`, because
// `templates.ts` is imported by client components and everything on it is
// readable in the page bundle.
//
// Two reasons that matters:
//   1. The visitor is deliberately never shown a price on the kit screen. A
//      rate card in the JavaScript makes that a formality rather than a fact.
//   2. Unit rates are competitive information. They should not be one
//      "view source" away.
//
// Nothing in this file may be imported from a `"use client"` module.

import type { RateCard } from "./types";

if (typeof window !== "undefined") {
  throw new Error(
    "brandlab/rates.ts was imported into the browser bundle. It holds the internal rate card and must stay server-side."
  );
}

export const RATE_CARD: Record<string, RateCard> = {
  "visiting-card": { unit: "set", unitQuantity: 1, ratePerUnit: 1200 },
  "letterhead-a4": { unit: "set", unitQuantity: 1, ratePerUnit: 2200 },
  envelope: { unit: "set", unitQuantity: 1, ratePerUnit: 2500 },
  "id-card": { unit: "piece", unitQuantity: 25, ratePerUnit: 120 },
  "bill-book": { unit: "piece", unitQuantity: 5, ratePerUnit: 360 },
  "file-folder": { unit: "set", unitQuantity: 1, ratePerUnit: 4500 },
  "instagram-set": { unit: "set", unitQuantity: 1, ratePerUnit: 2500 },
  umbrella: { unit: "piece", unitQuantity: 10, ratePerUnit: 950 },
  canopy: { unit: "piece", unitQuantity: 1, ratePerUnit: 18000 },
  "flex-standee": { unit: "piece", unitQuantity: 2, ratePerUnit: 1400 },
  "glow-signboard": { unit: "sqft", unitQuantity: 24, ratePerUnit: 850 },
  "staff-uniform": { unit: "piece", unitQuantity: 15, ratePerUnit: 420 },
  "vehicle-sticker": { unit: "sqft", unitQuantity: 30, ratePerUnit: 180 },
};

export function rateFor(slug: string): RateCard | undefined {
  return RATE_CARD[slug];
}
