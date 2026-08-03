// Internal lead scoring (§5).
//
// `estimatedValue` is computed from the selected templates x their print-spec
// unit rates. It exists so the team can sort the inbox by deal size and call the
// Rs 80,000 signage lead before the Rs 1,200 visiting-card lead.
//
// It never reaches the browser. Nothing in this module is imported by a client
// component, and the server actions strip it from every response.

import { rateFor } from "./rates";
import type { Intent } from "./types";

function itemValue(slug: string): number {
  const rate = rateFor(slug);
  return rate ? rate.unitQuantity * rate.ratePerUnit : 0;
}

/**
 * Rupee value of a kit request.
 *
 * Storefront and interior intents are Phase 2/3 tickets. Phase 1 cannot render
 * them, but the interest is captured and scored at the bottom of their band so
 * those leads sort above a stationery kit — they are the reason the phases
 * exist, and they should not be buried in the inbox.
 */
export function estimateValue(intent: Intent, selectedSlugs: string[]): number {
  if (intent === "storefront") return 25000;
  if (intent === "interior") return 100000;

  return selectedSlugs.reduce((total, slug) => total + itemValue(slug), 0);
}
