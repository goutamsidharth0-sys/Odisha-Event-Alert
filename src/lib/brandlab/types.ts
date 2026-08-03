// Shared Brand Lab types. Kept free of server imports so both the client
// pipeline and the server actions can use them.

export type Orientation = "horizontal" | "square" | "vertical";

export type TemplateCategory =
  | "stationery"
  | "outdoor"
  | "signage"
  | "apparel"
  | "digital";

export type BusinessCategory =
  | "retail"
  | "office"
  | "restaurant"
  | "clinic"
  | "education"
  | "other";

export type Intent = "full_kit" | "few_items" | "storefront" | "interior";

export interface Palette {
  primary: string;
  secondary: string;
  ink: string;
  paper: string;
}

/** A point in the base image's own pixel coordinates. */
export type Point = [number, number];

/** Four corners of the logo surface: TL, TR, BR, BL, in image coordinates. */
export type Quad = [Point, Point, Point, Point];

/**
 * The client-safe half of a template's print specification — this is what the
 * spec line on screen is built from, so it ships to the browser.
 */
export interface PrintSpecs {
  /** e.g. "ACP + LED" — shown to the visitor on the spec line. */
  material: string;
  /** e.g. "8ft x 3ft" or "90mm x 54mm". */
  defaultSize: string;
  notes?: string;
}

/**
 * The costing half. Server-only — see `rates.ts`.
 *
 * Kept out of `PrintSpecs` on purpose: `templates.ts` is imported by client
 * components, so anything on it is readable in the page bundle. The internal
 * estimate is supposed to be invisible to the visitor, and a rate card sitting
 * in public JavaScript is also a gift to a competitor.
 */
export interface RateCard {
  unit: "sqft" | "piece" | "set";
  /** Quantity of `unit` in the default size. */
  unitQuantity: number;
  /** Rupees per unit. */
  ratePerUnit: number;
}

interface TemplateBase {
  slug: string;
  name: string;
  category: TemplateCategory;
  printSpecs: PrintSpecs;
  sortOrder: number;
  /** Which logo orientation this variant serves. */
  variantFor: Orientation | "any";
  active: boolean;
}

/** Type A — pure SVG/HTML with a defined logo slot. Genuinely print-ready. */
export interface FlatTemplate extends TemplateBase {
  type: "flat";
  /** Artboard size in millimetres, used for the print-ready PDF page. */
  artboardMm: { w: number; h: number };
  /** Preview aspect ratio (w / h). */
  aspect: number;
}

/** Type B — real photograph + warp quad + shading map. */
export interface PhotoTemplate extends TemplateBase {
  type: "photo";
  baseImageUrl: string;
  shadingMapUrl: string;
  /** Natural pixel size of the base image; all quads are in this space. */
  baseSize: { w: number; h: number };
  quad: Quad;
  safeArea?: Point[];
  /**
   * Whether `baseImageUrl` is a real photograph or the illustrative stand-in
   * shipped before the Odisha asset shoot. See docs/brandlab/ASSET-SHOOT.md.
   */
  assetStatus: "photograph" | "illustrative";
}

export type Template = FlatTemplate | PhotoTemplate;

/** Result of the client-side auto-analysis (Screen 2). */
export interface BrandAnalysis {
  /** Object URL of the background-removed logo, for plain <img> use. */
  processedUrl: string;
  /**
   * The same logo as a data URL.
   *
   * Required wherever the logo is referenced from inside an SVG: an SVG loaded
   * through `<img src="data:...">` is sandboxed and cannot fetch blob: or http:
   * resources, so only a data URL survives into the flat artwork and its
   * 300 DPI raster.
   */
  processedDataUrl: string;
  /** White knockout lockup, for use on brand-colour and ink grounds. */
  reverseDataUrl: string;
  palette: Palette;
  orientation: Orientation;
  /** Trimmed logo bounding box aspect ratio (w / h). */
  aspect: number;
  /** True when a uniform bright background was detected and removed. */
  backgroundRemoved: boolean;
}

/** Everything the flow knows about the visitor's brand, client-side only. */
export interface BrandDraft {
  businessName: string;
  analysis: BrandAnalysis;
  /** The uploaded file, kept for vector (SVG) PDF embedding. */
  sourceType: "png" | "jpg" | "svg" | "pdf";
  svgSource?: string;
}
