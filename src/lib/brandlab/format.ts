// Display helpers safe to import from a client component.
//
// Kept apart from `pricing.ts`, which reaches the internal rate card: the admin
// inbox is a client component, and importing the pricing module there would
// pull the rate card into a browser bundle.

export function formatRupees(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Coarse band for the admin inbox, so triage does not require reading numbers. */
export function valueBand(value: number): "low" | "mid" | "high" {
  if (value >= 75000) return "high";
  if (value >= 20000) return "mid";
  return "low";
}
