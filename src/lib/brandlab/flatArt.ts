// Type A artwork. Each template is a function from the visitor's brand to one
// or more SVG artboards.
//
// One generator serves three outputs, which is why the flat items are genuinely
// print-ready rather than screen mockups:
//
//   preview  — the SVG inlined into the gallery tile
//   hi-res   — the same SVG rasterised to canvas at 300 DPI
//   print    — one PDF page per artboard, at the real millimetre size
//
// Design language per §8: crop and registration marks, ink black, warm paper,
// signal yellow, modern minimalist.

import type { BusinessCategory, Palette } from "./types";
import { FLAT_TEMPLATES } from "./templates";

export interface BrandArt {
  businessName: string;
  palette: Palette;
  /** Data URL of the processed (background-removed) logo. */
  logoUrl: string;
  /** White knockout lockup, used wherever the ground is a brand colour or ink. */
  logoReverseUrl: string;
  logoAspect: number;
  businessCategory: BusinessCategory;
}

export interface Artboard {
  label: string;
  /** Real-world size, used for the PDF page and the 300 DPI raster. */
  wMm: number;
  hMm: number;
  svg: string;
}

const SIGNAL = "#f5c518"; // signal yellow
const PAPER = "#f6f2e9"; // warm paper
const INK = "#141414"; // ink black

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------

export function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] as string
  );
}

/**
 * Place the logo inside a box, preserving aspect and centring on the given
 * anchor. Never stretches — a squashed wordmark reads as amateur instantly.
 */
function logoTag(
  art: BrandArt,
  box: { x: number; y: number; w: number; h: number },
  anchor: "center" | "left" = "center",
  ground: "paper" | "dark" = "paper"
): string {
  const href = ground === "dark" ? art.logoReverseUrl : art.logoUrl;
  const boxAspect = box.w / box.h;
  let w = box.w;
  let h = box.h;
  if (art.logoAspect > boxAspect) h = box.w / art.logoAspect;
  else w = box.h * art.logoAspect;
  const x = anchor === "left" ? box.x : box.x + (box.w - w) / 2;
  const y = box.y + (box.h - h) / 2;
  // `data-logo-slot` lets the PDF builder find the placement, blank it, and
  // redraw the mark as true vector when the visitor uploaded an SVG.
  return `<image data-logo-slot="1" href="${href}" x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" preserveAspectRatio="xMidYMid meet"/>`;
}

function r(v: number): number {
  return Number(v.toFixed(2));
}

/** Crop marks at the artboard corners — the house style, and genuinely useful. */
function cropMarks(w: number, h: number, colour = INK, len = 14, off = 6): string {
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colour}" stroke-width="0.8" opacity="0.55"/>`;
  return [
    line(0, off, len, off), line(off, 0, off, len),
    line(w, off, w - len, off), line(w - off, 0, w - off, len),
    line(0, h - off, len, h - off), line(off, h, off, h - len),
    line(w, h - off, w - len, h - off), line(w - off, h, w - off, h - len),
  ].join("");
}

/** Registration mark — the crosshair-in-a-circle from the First Page identity. */
function regMark(cx: number, cy: number, rad = 7, colour = INK): string {
  return `<g opacity="0.6"><circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${colour}" stroke-width="0.8"/><line x1="${cx - rad - 4}" y1="${cy}" x2="${cx + rad + 4}" y2="${cy}" stroke="${colour}" stroke-width="0.8"/><line x1="${cx}" y1="${cy - rad - 4}" x2="${cx}" y2="${cy + rad + 4}" stroke="${colour}" stroke-width="0.8"/></g>`;
}

function svgDoc(w: number, h: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
}

/** Sample copy per business category, so the mockup reads like the buyer's own. */
function sampleCopy(category: BusinessCategory) {
  const map: Record<BusinessCategory, { role: string; line: string; tag: string }> = {
    retail: { role: "Store Manager", line: "Janpath, Bhubaneswar 751001", tag: "Retail" },
    office: { role: "Business Head", line: "Saheed Nagar, Bhubaneswar 751007", tag: "Corporate" },
    restaurant: { role: "Outlet Manager", line: "Kharavela Nagar, Bhubaneswar 751001", tag: "Hospitality" },
    clinic: { role: "Practice Manager", line: "Bapuji Nagar, Bhubaneswar 751009", tag: "Healthcare" },
    education: { role: "Administrator", line: "Chandrasekharpur, Bhubaneswar 751016", tag: "Education" },
    other: { role: "Proprietor", line: "Cuttack, Odisha 753001", tag: "Business" },
  };
  return map[category] ?? map.other;
}

const SAMPLE_PHONE = "+91 98XX XXX XXX";

// -------------------------------------------------------------
// 1. Visiting card — front + back
// -------------------------------------------------------------

function visitingCard(art: BrandArt): Artboard[] {
  const W = 900;
  const H = 540; // 90 x 54mm at 10px/mm
  const { palette, businessName } = art;
  const copy = sampleCopy(art.businessCategory);

  const front = svgDoc(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="${PAPER}"/>
     <rect x="0" y="0" width="${W}" height="10" fill="${palette.primary}"/>
     ${logoTag(art, { x: 90, y: 130, w: 400, h: 190 }, "left")}
     <text x="90" y="392" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="${INK}" letter-spacing="1">${escapeXml(businessName.toUpperCase())}</text>
     <line x1="90" y1="418" x2="240" y2="418" stroke="${palette.primary}" stroke-width="4"/>
     <text x="90" y="456" font-family="Helvetica, Arial, sans-serif" font-size="19" fill="#5b5b5b">${escapeXml(copy.line)}</text>
     ${cropMarks(W, H)}`
  );

  const back = svgDoc(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="${palette.primary}"/>
     <rect x="0" y="${H - 10}" width="${W}" height="10" fill="${palette.secondary}"/>
     ${logoTag(art, { x: 250, y: 110, w: 400, h: 170 }, "center", "dark")}
     <text x="${W / 2}" y="352" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff" letter-spacing="3">${escapeXml(copy.role.toUpperCase())}</text>
     <text x="${W / 2}" y="404" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#ffffff" opacity="0.9">${SAMPLE_PHONE}</text>
     ${cropMarks(W, H, "#ffffff")}`
  );

  return [
    { label: "Front", wMm: 90, hMm: 54, svg: front },
    { label: "Back", wMm: 90, hMm: 54, svg: back },
  ];
}

// -------------------------------------------------------------
// 2. Letterhead A4
// -------------------------------------------------------------

function letterhead(art: BrandArt): Artboard[] {
  const W = 840;
  const H = 1188; // A4 at 4px/mm
  const { palette, businessName } = art;
  const copy = sampleCopy(art.businessCategory);

  const rules = Array.from({ length: 14 }, (_, i) => {
    const y = 420 + i * 34;
    const w = i % 5 === 4 ? 330 : 620;
    return `<rect x="110" y="${y}" width="${w}" height="7" rx="3.5" fill="${INK}" opacity="0.09"/>`;
  }).join("");

  const body = `<rect width="${W}" height="${H}" fill="${PAPER}"/>
    <rect x="0" y="0" width="14" height="${H}" fill="${palette.primary}"/>
    ${logoTag(art, { x: 110, y: 96, w: 300, h: 130 }, "left")}
    <text x="${W - 110}" y="140" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="21" font-weight="700" fill="${INK}" letter-spacing="1.5">${escapeXml(businessName.toUpperCase())}</text>
    <text x="${W - 110}" y="170" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#6a6a6a">${escapeXml(copy.line)}</text>
    <text x="${W - 110}" y="196" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#6a6a6a">${SAMPLE_PHONE}</text>
    <line x1="110" y1="262" x2="${W - 110}" y2="262" stroke="${palette.primary}" stroke-width="3"/>
    <text x="110" y="352" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="${INK}">Subject line</text>
    ${rules}
    <rect x="110" y="${H - 132}" width="${W - 220}" height="2" fill="${INK}" opacity="0.18"/>
    <text x="110" y="${H - 96}" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#7a7a7a">GSTIN 21XXXXXXXXXXXZX  ·  Odisha, India</text>
    ${regMark(W - 130, H - 104, 8, palette.primary)}
    ${cropMarks(W, H)}`;

  return [{ label: "Letterhead", wMm: 210, hMm: 297, svg: svgDoc(W, H, body) }];
}

// -------------------------------------------------------------
// 3. Envelope
// -------------------------------------------------------------

function envelope(art: BrandArt): Artboard[] {
  const W = 880;
  const H = 440; // DL at 4px/mm
  const { palette, businessName } = art;
  const copy = sampleCopy(art.businessCategory);

  const body = `<rect width="${W}" height="${H}" fill="${PAPER}"/>
    <path d="M0 0 L${W} 0 L${W / 2} 176 Z" fill="${INK}" opacity="0.05"/>
    <path d="M0 0 L${W} 0 L${W / 2} 176 Z" fill="none" stroke="${INK}" stroke-width="1.5" opacity="0.22"/>
    <rect x="0" y="${H - 12}" width="${W}" height="12" fill="${palette.primary}"/>
    ${logoTag(art, { x: 58, y: 214, w: 210, h: 92 }, "left")}
    <text x="58" y="344" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="${INK}" letter-spacing="1.2">${escapeXml(businessName.toUpperCase())}</text>
    <text x="58" y="374" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#6a6a6a">${escapeXml(copy.line)}</text>
    <rect x="${W - 190}" y="42" width="140" height="104" fill="none" stroke="${INK}" stroke-width="1.5" opacity="0.3" stroke-dasharray="6 5"/>
    <text x="${W - 120}" y="100" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#9a9a9a">STAMP</text>
    ${cropMarks(W, H)}`;

  return [{ label: "Envelope DL", wMm: 220, hMm: 110, svg: svgDoc(W, H, body) }];
}

// -------------------------------------------------------------
// 4. ID card + lanyard
// -------------------------------------------------------------

function idCard(art: BrandArt): Artboard[] {
  const W = 540;
  const H = 860; // 54 x 86mm at 10px/mm
  const { palette, businessName } = art;
  const copy = sampleCopy(art.businessCategory);

  const body = `<rect width="${W}" height="${H}" rx="26" fill="${PAPER}"/>
    <path d="M0 0 H${W} V250 H0 Z" fill="${palette.primary}"/>
    <path d="M0 0 H${W} V26 a26 26 0 0 0 -26 -26 H26 A26 26 0 0 0 0 26 Z" fill="${palette.primary}"/>
    <rect x="${W / 2 - 46}" y="34" width="92" height="18" rx="9" fill="${PAPER}"/>
    ${logoTag(art, { x: 120, y: 82, w: 300, h: 128 }, "center", "dark")}
    <circle cx="${W / 2}" cy="392" r="94" fill="#ffffff" stroke="${palette.secondary}" stroke-width="4"/>
    <circle cx="${W / 2}" cy="360" r="34" fill="#c9c9c9"/>
    <path d="M${W / 2 - 56} 470 a56 56 0 0 1 112 0 z" fill="#c9c9c9"/>
    <text x="${W / 2}" y="556" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="${INK}">Employee Name</text>
    <text x="${W / 2}" y="594" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="${palette.primary}" letter-spacing="2">${escapeXml(copy.role.toUpperCase())}</text>
    <line x1="90" y1="632" x2="${W - 90}" y2="632" stroke="${INK}" stroke-width="1.5" opacity="0.2"/>
    <text x="${W / 2}" y="676" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="19" fill="#6a6a6a">ID · ${escapeXml(copy.tag.toUpperCase())}-0142</text>
    <rect x="0" y="${H - 84}" width="${W}" height="84" fill="${INK}"/>
    <path d="M0 ${H - 84} H${W} V${H - 26} a26 26 0 0 1 -26 26 H26 A26 26 0 0 1 0 ${H - 26} Z" fill="${INK}"/>
    <text x="${W / 2}" y="${H - 40}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="21" font-weight="700" fill="${PAPER}" letter-spacing="2">${escapeXml(businessName.toUpperCase())}</text>
    ${cropMarks(W, H)}`;

  return [{ label: "ID card", wMm: 54, hMm: 86, svg: svgDoc(W, H, body) }];
}

// -------------------------------------------------------------
// 5. Bill book / invoice
// -------------------------------------------------------------

function billBook(art: BrandArt): Artboard[] {
  const W = 840;
  const H = 1188;
  const { palette, businessName } = art;
  const copy = sampleCopy(art.businessCategory);

  const rows = Array.from({ length: 9 }, (_, i) => {
    const y = 604 + i * 52;
    return `<line x1="70" y1="${y}" x2="${W - 70}" y2="${y}" stroke="${INK}" stroke-width="1" opacity="0.14"/>`;
  }).join("");

  const cols = [300, 460, 600].map(
    (x) => `<line x1="${x}" y1="552" x2="${x}" y2="1072" stroke="${INK}" stroke-width="1" opacity="0.14"/>`
  ).join("");

  const body = `<rect width="${W}" height="${H}" fill="${PAPER}"/>
    <rect x="0" y="0" width="${W}" height="150" fill="${palette.primary}"/>
    ${logoTag(art, { x: 70, y: 34, w: 210, h: 84 }, "left", "dark")}
    <text x="${W - 70}" y="72" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff" letter-spacing="2">TAX INVOICE</text>
    <text x="${W - 70}" y="106" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#ffffff" opacity="0.85">No. 0142  ·  Date __ / __ / ____</text>
    <text x="70" y="206" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="700" fill="${INK}" letter-spacing="1">${escapeXml(businessName.toUpperCase())}</text>
    <text x="70" y="236" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#6a6a6a">${escapeXml(copy.line)}  ·  ${SAMPLE_PHONE}</text>
    <text x="70" y="262" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#6a6a6a">GSTIN 21XXXXXXXXXXXZX</text>
    <rect x="70" y="308" width="${W - 140}" height="190" fill="#ffffff" stroke="${INK}" stroke-opacity="0.15"/>
    <text x="90" y="344" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#8a8a8a" letter-spacing="1.5">BILL TO</text>
    <line x1="90" y1="392" x2="${W - 110}" y2="392" stroke="${INK}" stroke-width="1" opacity="0.18"/>
    <line x1="90" y1="440" x2="${W - 110}" y2="440" stroke="${INK}" stroke-width="1" opacity="0.18"/>
    <rect x="70" y="552" width="${W - 140}" height="46" fill="${INK}"/>
    <text x="90" y="582" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="${PAPER}" letter-spacing="1">DESCRIPTION</text>
    <text x="320" y="582" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="${PAPER}" letter-spacing="1">QTY</text>
    <text x="480" y="582" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="${PAPER}" letter-spacing="1">RATE</text>
    <text x="620" y="582" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="${PAPER}" letter-spacing="1">AMOUNT</text>
    <rect x="70" y="552" width="${W - 140}" height="520" fill="none" stroke="${INK}" stroke-opacity="0.15"/>
    ${rows}${cols}
    <rect x="480" y="1090" width="${W - 550}" height="52" fill="${palette.primary}" opacity="0.14"/>
    <text x="500" y="1124" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="700" fill="${INK}">TOTAL</text>
    ${cropMarks(W, H)}`;

  return [{ label: "Invoice", wMm: 210, hMm: 297, svg: svgDoc(W, H, body) }];
}

// -------------------------------------------------------------
// 6. File folder
// -------------------------------------------------------------

function fileFolder(art: BrandArt): Artboard[] {
  const W = 720;
  const H = 1020; // 240 x 340mm at 3px/mm
  const { palette, businessName } = art;
  const copy = sampleCopy(art.businessCategory);

  const body = `<rect width="${W}" height="${H}" fill="${palette.primary}"/>
    <path d="M0 ${H * 0.58} L${W} ${H * 0.42} L${W} ${H} L0 ${H} Z" fill="${INK}" opacity="0.18"/>
    <rect x="0" y="${H - 300}" width="${W}" height="300" fill="${PAPER}"/>
    <path d="M0 ${H - 300} L${W} ${H - 356} L${W} ${H - 300} Z" fill="${PAPER}" opacity="0.5"/>
    ${logoTag(art, { x: 150, y: 168, w: 420, h: 200 }, "center", "dark")}
    <text x="${W / 2}" y="452" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff" letter-spacing="3">${escapeXml(businessName.toUpperCase())}</text>
    <line x1="${W / 2 - 60}" y1="486" x2="${W / 2 + 60}" y2="486" stroke="${SIGNAL}" stroke-width="5"/>
    <text x="${W / 2}" y="530" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="19" fill="#ffffff" opacity="0.82" letter-spacing="4">${escapeXml(copy.tag.toUpperCase())}</text>
    <text x="60" y="${H - 190}" font-family="Helvetica, Arial, sans-serif" font-size="17" fill="#6a6a6a">${escapeXml(copy.line)}</text>
    <text x="60" y="${H - 158}" font-family="Helvetica, Arial, sans-serif" font-size="17" fill="#6a6a6a">${SAMPLE_PHONE}</text>
    <rect x="60" y="${H - 118}" width="${W - 120}" height="2" fill="${INK}" opacity="0.15"/>
    ${regMark(W - 92, H - 74, 9, palette.primary)}
    ${cropMarks(W, H)}`;

  return [{ label: "Folder front", wMm: 240, hMm: 340, svg: svgDoc(W, H, body) }];
}

// -------------------------------------------------------------
// 7. Instagram post set — 3 layouts
// -------------------------------------------------------------

function instagramSet(art: BrandArt): Artboard[] {
  const S = 1080;
  const { palette, businessName } = art;
  const copy = sampleCopy(art.businessCategory);
  const name = escapeXml(businessName.toUpperCase());

  // Layout 1 — logo lock-up on brand colour
  const one = svgDoc(
    S,
    S,
    `<rect width="${S}" height="${S}" fill="${palette.primary}"/>
     <circle cx="${S - 120}" cy="120" r="220" fill="#ffffff" opacity="0.07"/>
     ${logoTag(art, { x: 240, y: 300, w: 600, h: 280 }, "center", "dark")}
     <line x1="${S / 2 - 70}" y1="630" x2="${S / 2 + 70}" y2="630" stroke="${SIGNAL}" stroke-width="7"/>
     <text x="${S / 2}" y="712" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="46" font-weight="700" fill="#ffffff" letter-spacing="5">${name}</text>
     <text x="${S / 2}" y="770" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#ffffff" opacity="0.8" letter-spacing="6">${escapeXml(copy.tag.toUpperCase())}</text>`
  );

  // Layout 2 — announcement, paper ground
  const two = svgDoc(
    S,
    S,
    `<rect width="${S}" height="${S}" fill="${PAPER}"/>
     <rect x="0" y="0" width="${S}" height="18" fill="${palette.primary}"/>
     <rect x="0" y="${S - 18}" width="${S}" height="18" fill="${palette.secondary}"/>
     ${logoTag(art, { x: 80, y: 90, w: 260, h: 120 }, "left")}
     <text x="80" y="470" font-family="Helvetica, Arial, sans-serif" font-size="96" font-weight="700" fill="${INK}">NOW</text>
     <text x="80" y="580" font-family="Helvetica, Arial, sans-serif" font-size="96" font-weight="700" fill="${palette.primary}">OPEN</text>
     <rect x="80" y="626" width="220" height="10" fill="${SIGNAL}"/>
     <text x="80" y="720" font-family="Helvetica, Arial, sans-serif" font-size="32" fill="#5b5b5b">${escapeXml(copy.line)}</text>
     <text x="80" y="${S - 90}" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="${INK}" letter-spacing="2">${name}</text>`
  );

  // Layout 3 — offer tile, ink ground
  const three = svgDoc(
    S,
    S,
    `<rect width="${S}" height="${S}" fill="${INK}"/>
     <circle cx="${S / 2}" cy="${S / 2}" r="330" fill="none" stroke="${palette.primary}" stroke-width="3" opacity="0.5"/>
     <text x="${S / 2}" y="440" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="150" font-weight="700" fill="${SIGNAL}">20%</text>
     <text x="${S / 2}" y="516" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="44" fill="#ffffff" letter-spacing="10">OFF</text>
     <line x1="${S / 2 - 120}" y1="566" x2="${S / 2 + 120}" y2="566" stroke="${palette.primary}" stroke-width="4"/>
     <text x="${S / 2}" y="632" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="#cfcfcf" letter-spacing="4">THIS WEEK ONLY</text>
     ${logoTag(art, { x: 340, y: 730, w: 400, h: 160 }, "center", "dark")}
     <text x="${S / 2}" y="${S - 70}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff" letter-spacing="4">${name}</text>`
  );

  return [
    { label: "Layout 1", wMm: 100, hMm: 100, svg: one },
    { label: "Layout 2", wMm: 100, hMm: 100, svg: two },
    { label: "Layout 3", wMm: 100, hMm: 100, svg: three },
  ];
}

// -------------------------------------------------------------
// Registry
// -------------------------------------------------------------

const GENERATORS: Record<string, (art: BrandArt) => Artboard[]> = {
  "visiting-card": visitingCard,
  "letterhead-a4": letterhead,
  envelope,
  "id-card": idCard,
  "bill-book": billBook,
  "file-folder": fileFolder,
  "instagram-set": instagramSet,
};

export function renderFlat(slug: string, art: BrandArt): Artboard[] {
  const generator = GENERATORS[slug];
  if (!generator) throw new Error(`No flat artwork registered for "${slug}".`);
  return generator(art);
}

export function hasFlatArt(slug: string): boolean {
  return slug in GENERATORS;
}

/** Guard against a template row without artwork silently disappearing. */
export const FLAT_SLUGS_WITHOUT_ART = FLAT_TEMPLATES.filter(
  (t) => !hasFlatArt(t.slug)
).map((t) => t.slug);

export function svgToDataUrl(svg: string): string {
  // encodeURIComponent rather than base64: it keeps the data URL readable in
  // devtools and avoids a btoa() round trip over non-Latin business names.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
