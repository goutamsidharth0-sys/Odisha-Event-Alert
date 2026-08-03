// The kit PDF, generated with pdf-lib — in the browser, like everything else
// in Phase 1.
//
// Two sections:
//
//   1. Presentation — cover, then one page per mockup with its spec line.
//      This is what the visitor receives and forwards.
//   2. Print-ready artwork — the flat items at their true millimetre size.
//      When the client uploaded an SVG, the logo is embedded as true vector
//      rather than a rasterised placement. That is a real quality difference
//      against a rasterised web-to-print flow, and worth claiming on the page.

import { PDFDocument, rgb, StandardFonts, type PDFPage } from "pdf-lib";
import { renderFlat, svgToDataUrl, type BrandArt } from "./flatArt";
import { pixelSizeFor } from "./render";
import { specLine } from "./templates";
import type { FlatTemplate, Palette, Template } from "./types";

const MM = 2.834645669; // millimetres -> PDF points
const A4 = { w: 210 * MM, h: 297 * MM };

const INK = rgb(0.08, 0.08, 0.08);
const MUTED = rgb(0.45, 0.45, 0.45);
const PAPER = rgb(0.965, 0.949, 0.914);

export interface KitPdfInput {
  art: BrandArt;
  refCode: string;
  /** One entry per rendered artboard, in gallery order. */
  items: Array<{ template: Template; label: string; png: Uint8Array }>;
  /** Raw SVG source, when the visitor uploaded one. Enables vector artwork. */
  svgSource?: string;
}

export async function buildKitPdf(input: KitPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${input.art.businessName} — Branding kit (${input.refCode})`);
  pdf.setProducer("First Page Brand Lab");
  pdf.setCreator("First Page — Branding Brand's");

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);

  // ---- Cover ----
  const cover = pdf.addPage([A4.w, A4.h]);
  cover.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: PAPER });
  cover.drawRectangle({ x: 0, y: A4.h - 14, width: A4.w, height: 14, color: hex(input.art.palette.primary) });

  cover.drawText("FIRST PAGE", {
    x: 48, y: A4.h - 110, size: 30, font: bold, color: INK,
  });
  cover.drawText("Branding Brand's", {
    x: 48, y: A4.h - 138, size: 13, font: regular, color: MUTED,
  });

  cover.drawText(truncate(input.art.businessName.toUpperCase(), 30), {
    x: 48, y: A4.h - 250, size: 26, font: bold, color: INK,
  });
  cover.drawText("Branding kit — indicative visualisation", {
    x: 48, y: A4.h - 278, size: 12, font: regular, color: MUTED,
  });

  drawSwatches(cover, input.art.palette, 48, A4.h - 350);

  cover.drawText(`Reference ${input.refCode}`, {
    x: 48, y: 78, size: 12, font: bold, color: INK,
  });
  cover.drawText("Manufactured, delivered and installed in Bhubaneswar, Cuttack and Puri.", {
    x: 48, y: 58, size: 10, font: regular, color: MUTED,
  });

  // ---- One page per mockup ----
  for (const item of input.items) {
    const page = pdf.addPage([A4.w, A4.h]);
    page.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: PAPER });

    const image = await pdf.embedPng(item.png);
    const box = { x: 40, y: 150, w: A4.w - 80, h: A4.h - 260 };
    const scale = Math.min(box.w / image.width, box.h / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    page.drawImage(image, {
      x: box.x + (box.w - w) / 2,
      y: box.y + (box.h - h) / 2,
      width: w,
      height: h,
    });

    page.drawText(truncate(item.template.name, 42), {
      x: 40, y: 108, size: 16, font: bold, color: INK,
    });
    page.drawText(truncate(specLine(item.template), 88), {
      x: 40, y: 88, size: 9.5, font: regular, color: MUTED,
    });
    page.drawText(`${input.refCode}  ·  ${item.label}`, {
      x: 40, y: 52, size: 8.5, font: regular, color: MUTED,
    });
  }

  // ---- Print-ready artwork, true size ----
  await appendPrintArtwork(pdf, input, bold, regular);

  return pdf.save();
}

async function appendPrintArtwork(
  pdf: PDFDocument,
  input: KitPdfInput,
  bold: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  regular: Awaited<ReturnType<PDFDocument["embedFont"]>>
) {
  const flats = input.items
    .map((i) => i.template)
    .filter((t, i, arr): t is FlatTemplate => t.type === "flat" && arr.indexOf(t) === i);
  if (flats.length === 0) return;

  const divider = pdf.addPage([A4.w, A4.h]);
  divider.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: PAPER });
  divider.drawText("PRINT-READY ARTWORK", { x: 48, y: A4.h / 2, size: 22, font: bold, color: INK });
  divider.drawText(
    input.svgSource
      ? "Logo embedded as vector from your uploaded SVG. Pages are at true size."
      : "Pages are at true size. Upload an SVG logo for fully vector artwork.",
    { x: 48, y: A4.h / 2 - 24, size: 10.5, font: regular, color: MUTED }
  );

  const vector = input.svgSource ? parseVectorLogo(input.svgSource) : null;

  for (const template of flats) {
    const boards = renderFlat(template.slug, input.art);
    for (const board of boards) {
      const page = pdf.addPage([board.wMm * MM, board.hMm * MM]);
      const { w: pxW, h: pxH } = pixelSizeFor(template, board.wMm, board.hMm);

      // Rasterise the artboard, optionally with the logo slot left empty so the
      // vector mark can be drawn into it instead.
      const stripped = vector ? removeLogoSlots(board.svg) : { svg: board.svg, slots: [] };
      const png = await rasterise(stripped.svg, pxW, pxH);
      const image = await pdf.embedPng(png);
      page.drawImage(image, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });

      if (vector) {
        const sx = page.getWidth() / boardWidth(board.svg);
        const sy = page.getHeight() / boardHeight(board.svg);
        for (const slot of stripped.slots) {
          drawVectorLogo(page, vector, {
            x: slot.x * sx,
            y: slot.y * sy,
            w: slot.w * sx,
            h: slot.h * sy,
          });
        }
      }
    }
  }
}

// -------------------------------------------------------------
// Rasterising an SVG string in the browser
// -------------------------------------------------------------

async function rasterise(svg: string, w: number, h: number): Promise<Uint8Array> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not rasterise artwork."));
    el.src = svgToDataUrl(svg);
  });

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.drawImage(img, 0, 0, w, h);

  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// -------------------------------------------------------------
// Logo slots
// -------------------------------------------------------------

interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

function parseSvg(svg: string): Document {
  return new DOMParser().parseFromString(svg, "image/svg+xml");
}

function boardWidth(svg: string): number {
  const vb = parseSvg(svg).documentElement.getAttribute("viewBox")?.split(/[\s,]+/);
  return vb ? Number(vb[2]) : 1;
}

function boardHeight(svg: string): number {
  const vb = parseSvg(svg).documentElement.getAttribute("viewBox")?.split(/[\s,]+/);
  return vb ? Number(vb[3]) : 1;
}

/** Pull the logo placements out of an artboard and blank them. */
function removeLogoSlots(svg: string): { svg: string; slots: Slot[] } {
  const doc = parseSvg(svg);
  const slots: Slot[] = [];
  doc.querySelectorAll("[data-logo-slot]").forEach((node) => {
    slots.push({
      x: Number(node.getAttribute("x") ?? 0),
      y: Number(node.getAttribute("y") ?? 0),
      w: Number(node.getAttribute("width") ?? 0),
      h: Number(node.getAttribute("height") ?? 0),
    });
    node.remove();
  });
  return { svg: new XMLSerializer().serializeToString(doc), slots };
}

// -------------------------------------------------------------
// Vector logo embedding
// -------------------------------------------------------------

interface VectorLogo {
  viewBox: { w: number; h: number };
  paths: Array<{ d: string; fill: string }>;
}

/**
 * Convert an uploaded SVG into flat path data pdf-lib can draw.
 *
 * Supported: path, rect, circle, ellipse, line, polyline, polygon, with solid
 * fills. Anything else — transforms, <use>, <text>, embedded images, gradient
 * fills — returns null and the PDF falls back to the raster placement, which is
 * still correct, just not vector. Claiming vector output for artwork we
 * silently mangled would be worse than not claiming it.
 */
export function parseVectorLogo(svgSource: string): VectorLogo | null {
  let doc: Document;
  try {
    doc = parseSvg(svgSource);
  } catch {
    return null;
  }
  const root = doc.documentElement;
  if (!root || root.nodeName === "parsererror") return null;

  const viewBox = root.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number);
  const w = viewBox?.[2] ?? Number(root.getAttribute("width")) ?? 0;
  const h = viewBox?.[3] ?? Number(root.getAttribute("height")) ?? 0;
  if (!w || !h || !Number.isFinite(w) || !Number.isFinite(h)) return null;

  if (root.querySelector("text, image, use, defs linearGradient, defs radialGradient")) {
    return null;
  }
  if (root.querySelector("[transform]")) return null;

  const paths: VectorLogo["paths"] = [];
  const shapes = root.querySelectorAll("path, rect, circle, ellipse, line, polyline, polygon");
  for (const node of Array.from(shapes)) {
    const fill = node.getAttribute("fill") ?? "#000000";
    if (fill.startsWith("url(")) return null;
    if (fill === "none") continue;
    const d = shapeToPath(node);
    if (!d) return null;
    paths.push({ d, fill });
  }
  if (paths.length === 0) return null;

  return { viewBox: { w, h }, paths };
}

function shapeToPath(node: Element): string | null {
  const num = (name: string, fallback = 0) => Number(node.getAttribute(name) ?? fallback);

  switch (node.nodeName.toLowerCase()) {
    case "path":
      return node.getAttribute("d");
    case "rect": {
      const x = num("x");
      const y = num("y");
      const w = num("width");
      const h = num("height");
      return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
    }
    case "circle": {
      const cx = num("cx");
      const cy = num("cy");
      const r = num("r");
      return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
    }
    case "ellipse": {
      const cx = num("cx");
      const cy = num("cy");
      const rx = num("rx");
      const ry = num("ry");
      return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;
    }
    case "line":
      return `M${num("x1")} ${num("y1")}L${num("x2")} ${num("y2")}`;
    case "polyline":
    case "polygon": {
      const points = (node.getAttribute("points") ?? "").trim().split(/[\s,]+/).map(Number);
      if (points.length < 4) return null;
      const parts = [`M${points[0]} ${points[1]}`];
      for (let i = 2; i < points.length - 1; i += 2) parts.push(`L${points[i]} ${points[i + 1]}`);
      if (node.nodeName.toLowerCase() === "polygon") parts.push("Z");
      return parts.join("");
    }
    default:
      return null;
  }
}

function drawVectorLogo(page: PDFPage, logo: VectorLogo, slot: Slot) {
  // Fit inside the slot, preserving aspect — the same rule the raster path uses.
  const scale = Math.min(slot.w / logo.viewBox.w, slot.h / logo.viewBox.h);
  const w = logo.viewBox.w * scale;
  const h = logo.viewBox.h * scale;
  const x = slot.x + (slot.w - w) / 2;
  const yTop = slot.y + (slot.h - h) / 2;

  for (const path of logo.paths) {
    page.drawSvgPath(path.d, {
      // drawSvgPath treats (x, y) as the origin of an SVG (y-down) coordinate
      // system, so the anchor is the slot's top edge measured from the page top.
      x,
      y: page.getHeight() - yTop,
      scale,
      color: hex(path.fill),
      borderWidth: 0,
    });
  }
}

// -------------------------------------------------------------
// Small helpers
// -------------------------------------------------------------

function drawSwatches(page: PDFPage, palette: Palette, x: number, y: number) {
  const entries: Array<[string, string]> = [
    ["Primary", palette.primary],
    ["Secondary", palette.secondary],
    ["Ink", palette.ink],
    ["Paper", palette.paper],
  ];
  entries.forEach(([, colour], i) => {
    page.drawRectangle({
      x: x + i * 58,
      y,
      width: 48,
      height: 48,
      color: hex(colour),
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 0.5,
    });
  });
}

export function hex(value: string) {
  const clean = value.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return rgb(0, 0, 0);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}
