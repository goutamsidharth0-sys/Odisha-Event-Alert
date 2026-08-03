// The Phase 1 template library — 13 items, per spec §4.
//
// The governing rule: every mockup here corresponds to something the First Page
// workshop can physically produce and deliver in Odisha. No mugs, no pens, no
// products outside the workshop's capability. Showing a render First Page
// cannot fulfil destroys trust at the exact moment of highest intent.
//
// This module is the source of truth. `prisma/seed.ts` mirrors it into
// `MockupTemplate` so the team can deactivate or re-order items without a
// deploy, and so the internal estimate can be computed server-side.

import type { FlatTemplate, PhotoTemplate, Template } from "./types";

const ASSETS = "/brandlab/templates";

// -------------------------------------------------------------
// Type A — flat vector templates (7)
// Pure SVG with a defined logo slot. Output is genuinely print-ready.
// -------------------------------------------------------------

export const FLAT_TEMPLATES: FlatTemplate[] = [
  {
    slug: "visiting-card",
    name: "Visiting card",
    category: "stationery",
    type: "flat",
    artboardMm: { w: 90, h: 54 },
    aspect: 190 / 54, // front + back shown side by side
    variantFor: "any",
    sortOrder: 10,
    active: true,
    printSpecs: {
      material: "300gsm matt art card, front + back",
      defaultSize: "90mm x 54mm",
      notes: "Set of 1000, 4-colour both sides",
    },
  },
  {
    slug: "letterhead-a4",
    name: "Letterhead A4",
    category: "stationery",
    type: "flat",
    artboardMm: { w: 210, h: 297 },
    aspect: 210 / 297,
    variantFor: "any",
    sortOrder: 20,
    active: true,
    printSpecs: {
      material: "100gsm bond paper",
      defaultSize: "A4 — 210mm x 297mm",
      notes: "Set of 500, single side",
    },
  },
  {
    slug: "envelope",
    name: "Envelope",
    category: "stationery",
    type: "flat",
    artboardMm: { w: 220, h: 110 },
    aspect: 2,
    variantFor: "any",
    sortOrder: 30,
    active: true,
    printSpecs: {
      material: "120gsm white wove",
      defaultSize: "DL — 220mm x 110mm",
      notes: "Set of 500, window optional",
    },
  },
  {
    slug: "id-card",
    name: "ID card + lanyard",
    category: "stationery",
    type: "flat",
    artboardMm: { w: 54, h: 86 },
    aspect: 54 / 86,
    variantFor: "any",
    sortOrder: 40,
    active: true,
    printSpecs: {
      material: "PVC card + printed polyester lanyard",
      defaultSize: "54mm x 86mm",
      notes: "Includes lanyard and clip",
    },
  },
  {
    slug: "bill-book",
    name: "Bill book / invoice",
    category: "stationery",
    type: "flat",
    artboardMm: { w: 210, h: 297 },
    aspect: 210 / 297,
    variantFor: "any",
    sortOrder: 50,
    active: true,
    printSpecs: {
      material: "NCR triplicate, gum-bound",
      defaultSize: "A4 — 50 x 3 leaves",
      notes: "GST-ready column layout",
    },
  },
  {
    slug: "file-folder",
    name: "File folder",
    category: "stationery",
    type: "flat",
    artboardMm: { w: 240, h: 340 },
    aspect: 240 / 340,
    variantFor: "any",
    sortOrder: 60,
    active: true,
    printSpecs: {
      material: "300gsm art card, matt lamination",
      defaultSize: "240mm x 340mm closed",
      notes: "Set of 250, die-cut pocket",
    },
  },
  {
    slug: "instagram-set",
    name: "Instagram post set",
    category: "digital",
    type: "flat",
    artboardMm: { w: 100, h: 100 },
    aspect: 3, // three 1:1 layouts shown as a strip
    variantFor: "any",
    sortOrder: 70,
    active: true,
    printSpecs: {
      material: "Digital — 1080 x 1080 px, 3 layouts",
      defaultSize: "1080px x 1080px",
      notes: "Editable template set, 3 layouts",
    },
  },
];

// -------------------------------------------------------------
// Type B — photoreal composites (6)
// Base image + shading map + four-point quad, in base-image coordinates.
//
// `assetStatus: "illustrative"` marks the stand-in artwork shipped ahead of the
// Odisha asset shoot. The engine, quads, shading maps and print specs are the
// real thing — swapping in the photographs is a URL change per row, no code.
// See docs/brandlab/ASSET-SHOOT.md for the shot list and the quad workflow.
// -------------------------------------------------------------

const BASE = { w: 1600, h: 1200 };

export const PHOTO_TEMPLATES: PhotoTemplate[] = [
  {
    slug: "umbrella",
    name: "Umbrella",
    category: "outdoor",
    type: "photo",
    baseImageUrl: `${ASSETS}/umbrella-base.svg`,
    shadingMapUrl: `${ASSETS}/umbrella-shading.svg`,
    baseSize: BASE,
    quad: [
      [672, 470],
      [928, 470],
      [962, 650],
      [638, 650],
    ],
    assetStatus: "illustrative",
    variantFor: "any",
    sortOrder: 80,
    active: true,
    printSpecs: {
      material: "Polyester canopy, screen print",
      defaultSize: "42 inch, 8 panel",
      notes: "Minimum order 10",
    },
  },
  {
    slug: "canopy",
    name: "Canopy / gazebo",
    category: "outdoor",
    type: "photo",
    baseImageUrl: `${ASSETS}/canopy-base.svg`,
    shadingMapUrl: `${ASSETS}/canopy-shading.svg`,
    baseSize: BASE,
    quad: [
      [300, 565],
      [1300, 565],
      [1300, 648],
      [300, 648],
    ],
    assetStatus: "illustrative",
    variantFor: "any",
    sortOrder: 90,
    active: true,
    printSpecs: {
      material: "Iron frame + printed valance",
      defaultSize: "10ft x 10ft",
      notes: "Frame, canopy and carry bag",
    },
  },
  {
    slug: "flex-standee",
    name: "Flex standee",
    category: "outdoor",
    type: "photo",
    baseImageUrl: `${ASSETS}/standee-base.svg`,
    shadingMapUrl: `${ASSETS}/standee-shading.svg`,
    baseSize: BASE,
    quad: [
      [600, 240],
      [1042, 255],
      [1036, 640],
      [594, 626],
    ],
    assetStatus: "illustrative",
    variantFor: "any",
    sortOrder: 100,
    active: true,
    printSpecs: {
      material: "Star flex + roll-up stand",
      defaultSize: "3ft x 6ft",
      notes: "Includes stand and carry bag",
    },
  },
  {
    slug: "glow-signboard",
    name: "Glow signboard",
    category: "signage",
    type: "photo",
    baseImageUrl: `${ASSETS}/signboard-base.svg`,
    shadingMapUrl: `${ASSETS}/signboard-shading.svg`,
    baseSize: BASE,
    quad: [
      [300, 318],
      [1300, 293],
      [1300, 524],
      [300, 552],
    ],
    assetStatus: "illustrative",
    variantFor: "any",
    sortOrder: 110,
    active: true,
    printSpecs: {
      material: "ACP + LED",
      defaultSize: "8ft x 3ft",
      notes: "Aluminium frame, installed",
    },
  },
  {
    slug: "staff-uniform",
    name: "Staff uniform / t-shirt",
    category: "apparel",
    type: "photo",
    baseImageUrl: `${ASSETS}/uniform-base.svg`,
    shadingMapUrl: `${ASSETS}/uniform-shading.svg`,
    baseSize: BASE,
    quad: [
      [600, 430],
      [820, 424],
      [824, 584],
      [604, 590],
    ],
    assetStatus: "illustrative",
    variantFor: "any",
    sortOrder: 120,
    active: true,
    printSpecs: {
      material: "180gsm cotton, chest print",
      defaultSize: "S - XXL, left chest",
      notes: "Minimum order 15",
    },
  },
  {
    slug: "vehicle-sticker",
    name: "Delivery vehicle sticker",
    category: "outdoor",
    type: "photo",
    baseImageUrl: `${ASSETS}/vehicle-base.svg`,
    shadingMapUrl: `${ASSETS}/vehicle-shading.svg`,
    baseSize: BASE,
    quad: [
      [390, 490],
      [1060, 490],
      [1060, 770],
      [390, 770],
    ],
    assetStatus: "illustrative",
    variantFor: "any",
    sortOrder: 130,
    active: true,
    printSpecs: {
      material: "Cast vinyl, laminated",
      defaultSize: "6ft x 2.5ft per side",
      notes: "Both sides, applied",
    },
  },
];

export const TEMPLATES: Template[] = [...FLAT_TEMPLATES, ...PHOTO_TEMPLATES].sort(
  (a, b) => a.sortOrder - b.sortOrder
);

export const TEMPLATES_BY_SLUG: Record<string, Template> = Object.fromEntries(
  TEMPLATES.map((t) => [t.slug, t])
);

/** The spec line shown under each mockup: "Glow signboard · ACP + LED · 8ft × 3ft". */
export function specLine(template: Template): string {
  return [template.name, template.printSpecs.material, template.printSpecs.defaultSize].join(" · ");
}

/**
 * Which templates a given intent + business category should show.
 *
 * Q2 drives the template set: a clinic has no delivery van, a restaurant does
 * not hand out ID cards to walk-ins. Showing an item the buyer has no use for
 * dilutes the gallery.
 */
export function templatesForIntent(
  intent: string,
  businessCategory: string,
  selected?: string[]
): Template[] {
  const active = TEMPLATES.filter((t) => t.active);

  if (intent === "few_items" && selected?.length) {
    const wanted = new Set(selected);
    return active.filter((t) => wanted.has(t.slug));
  }

  const drop: Record<string, string[]> = {
    clinic: ["vehicle-sticker", "umbrella", "canopy"],
    office: ["umbrella", "canopy", "vehicle-sticker"],
    education: ["vehicle-sticker"],
    restaurant: ["file-folder", "id-card"],
    retail: [],
    other: [],
  };
  const excluded = new Set(drop[businessCategory] ?? []);
  return active.filter((t) => !excluded.has(t.slug));
}
