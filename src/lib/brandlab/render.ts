// High-resolution output. Same composition as the preview, redrawn to an
// offscreen canvas — still client-side, still zero marginal cost.
//
// Deliberately not server-side: sharp cannot do perspective distortion, and
// pulling ImageMagick or a native canvas binding onto Vercel adds cost, cold
// starts and a class of bugs with no offsetting benefit at this stage.

import { applyMatrix, fitQuad, invert, quadBounds, quadTransform } from "./homography";
import { renderFlat, svgToDataUrl, type BrandArt } from "./flatArt";
import type { FlatTemplate, PhotoTemplate, Quad, Template } from "./types";
import { canvasToBlob } from "./analysis";

const DPI = 300;
const MM_PER_INCH = 25.4;

/**
 * Ceiling on the long edge of any single export.
 *
 * A visiting card at 300 DPI is ~1063px. An 8ft signboard at 300 DPI would be
 * 28,800px — a 3 GB canvas the browser will refuse to allocate. Large-format
 * signage is produced at reduced DPI with a scale factor as standard practice,
 * so the cap costs nothing real and keeps the export inside a phone's memory.
 */
const MAX_EDGE = 4096;

export function pixelSizeFor(template: FlatTemplate, artboardW: number, artboardH: number) {
  const scale = DPI / MM_PER_INCH;
  let w = Math.round(artboardW * scale);
  let h = Math.round(artboardH * scale);
  const over = Math.max(w, h) / MAX_EDGE;
  if (over > 1) {
    w = Math.round(w / over);
    h = Math.round(h / over);
  }
  return { w, h };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "sync";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

// -------------------------------------------------------------
// Type A — rasterise the print-ready SVG
// -------------------------------------------------------------

export async function renderFlatHiRes(
  template: FlatTemplate,
  art: BrandArt
): Promise<HTMLCanvasElement[]> {
  const boards = renderFlat(template.slug, art);
  const canvases: HTMLCanvasElement[] = [];

  for (const board of boards) {
    const { w, h } = pixelSizeFor(template, board.wMm, board.hMm);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable in this browser.");
    const img = await loadImage(svgToDataUrl(board.svg));
    ctx.drawImage(img, 0, 0, w, h);
    canvases.push(canvas);
  }

  return canvases;
}

// -------------------------------------------------------------
// Type B — base photograph + warped logo + shading map
// -------------------------------------------------------------

/**
 * Warp `logo` onto `quad` inside a canvas of the given size.
 *
 * Inverse mapping with bilinear sampling: for each destination pixel inside the
 * quad, project back through the inverse homography and sample the logo. Canvas
 * 2D has only affine transforms, so a triangle-subdivision approximation is the
 * usual workaround — this is exact instead, which matters when the whole product
 * rests on the logo being pixel-perfect.
 */
function warpOnto(
  target: CanvasRenderingContext2D,
  logo: CanvasImageSource & { width: number; height: number },
  quad: Quad,
  canvasW: number,
  canvasH: number
) {
  const lw = logo.width;
  const lh = logo.height;

  // Rasterise the logo once so we can sample its pixels directly.
  const src = document.createElement("canvas");
  src.width = lw;
  src.height = lh;
  const sctx = src.getContext("2d", { willReadFrequently: true });
  if (!sctx) throw new Error("Canvas is unavailable in this browser.");
  sctx.drawImage(logo, 0, 0);
  const srcData = sctx.getImageData(0, 0, lw, lh).data;

  const bounds = quadBounds(quad);
  const x0 = Math.max(0, Math.floor(bounds.minX));
  const y0 = Math.max(0, Math.floor(bounds.minY));
  const x1 = Math.min(canvasW, Math.ceil(bounds.maxX));
  const y1 = Math.min(canvasH, Math.ceil(bounds.maxY));
  const w = x1 - x0;
  const h = y1 - y0;
  if (w <= 0 || h <= 0) return;

  const inv = invert(quadTransform(lw, lh, quad));
  const out = target.createImageData(w, h);
  const dst = out.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Sample at the pixel centre.
      const [u, v] = applyMatrix(inv, x0 + x + 0.5, y0 + y + 0.5);
      if (u < 0 || v < 0 || u >= lw || v >= lh) continue;

      // Bilinear: the logo is usually being scaled up onto a large surface, and
      // nearest-neighbour there produces visibly jagged letterforms.
      const fx = Math.floor(u);
      const fy = Math.floor(v);
      const cx = Math.min(fx + 1, lw - 1);
      const cy = Math.min(fy + 1, lh - 1);
      const tx = u - fx;
      const ty = v - fy;

      const i00 = (fy * lw + fx) * 4;
      const i10 = (fy * lw + cx) * 4;
      const i01 = (cy * lw + fx) * 4;
      const i11 = (cy * lw + cx) * 4;
      const o = (y * w + x) * 4;

      for (let c = 0; c < 4; c++) {
        const top = srcData[i00 + c] * (1 - tx) + srcData[i10 + c] * tx;
        const bottom = srcData[i01 + c] * (1 - tx) + srcData[i11 + c] * tx;
        dst[o + c] = top * (1 - ty) + bottom * ty;
      }
    }
  }

  // createImageData/putImageData replaces rather than blends, so stage the warp
  // on its own canvas and composite it over the photograph.
  const layer = document.createElement("canvas");
  layer.width = w;
  layer.height = h;
  const lctx = layer.getContext("2d");
  if (!lctx) throw new Error("Canvas is unavailable in this browser.");
  lctx.putImageData(out, 0, 0);
  target.drawImage(layer, x0, y0);
}

export async function renderPhotoHiRes(
  template: PhotoTemplate,
  logo: HTMLCanvasElement
): Promise<HTMLCanvasElement> {
  const [base, shading] = await Promise.all([
    loadImage(template.baseImageUrl),
    loadImage(template.shadingMapUrl),
  ]);

  const { w: bw, h: bh } = template.baseSize;
  const scale = Math.min(2, MAX_EDGE / Math.max(bw, bh));
  const w = Math.round(bw * scale);
  const h = Math.round(bh * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  ctx.drawImage(base, 0, 0, w, h);

  const fitted = fitQuad(template.quad, logo.width / logo.height);
  const scaled = fitted.map(([x, y]) => [x * scale, y * scale]) as Quad;
  warpOnto(ctx, logo, scaled, w, h);

  // The shading map carries the surface's folds, gloss and shadow. Multiplying
  // it last means the logo picks up the scene's lighting instead of sitting on
  // top of the photograph like a sticker.
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(shading, 0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";

  return canvas;
}

// -------------------------------------------------------------
// Entry point
// -------------------------------------------------------------

export interface RenderedItem {
  slug: string;
  label: string;
  canvas: HTMLCanvasElement;
}

export async function renderHiRes(
  template: Template,
  art: BrandArt,
  logoCanvas: HTMLCanvasElement
): Promise<RenderedItem[]> {
  if (template.type === "flat") {
    const boards = renderFlat(template.slug, art);
    const canvases = await renderFlatHiRes(template, art);
    return canvases.map((canvas, i) => ({
      slug: template.slug,
      label: boards[i]?.label ?? template.name,
      canvas,
    }));
  }
  const canvas = await renderPhotoHiRes(template, logoCanvas);
  return [{ slug: template.slug, label: template.name, canvas }];
}

export async function renderToBlob(
  template: Template,
  art: BrandArt,
  logoCanvas: HTMLCanvasElement
): Promise<Blob[]> {
  const items = await renderHiRes(template, art, logoCanvas);
  return Promise.all(items.map((item) => canvasToBlob(item.canvas, "image/png")));
}
