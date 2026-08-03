// Screen 2 — auto-analysis. Runs entirely in the browser: no server call, no
// AI, no cost. Three steps, in order:
//
//   1. Background removal  — corner sampling + border flood fill
//   2. Palette extraction  — k-means (k=5) over the remaining opaque pixels
//   3. Orientation         — from the trimmed logo bounding box
//
// Step 1 handles the ~80% of Indian SME logos that arrive as a JPEG on white.

import type { BrandAnalysis, Orientation, Palette } from "./types";

/** Longest edge we keep for analysis and preview. Also caps upload weight. */
export const MAX_LOGO_EDGE = 1400;

// -------------------------------------------------------------
// Loading
// -------------------------------------------------------------

/**
 * Decode an uploaded file to a canvas, downscaled to MAX_LOGO_EDGE.
 *
 * Re-encoding through a canvas is also how EXIF is stripped (§9): the pixel
 * data survives, every metadata block does not.
 */
export async function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await decode(file);
  const scale = Math.min(1, MAX_LOGO_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  if ("close" in bitmap) bitmap.close();
  return canvas;
}

async function decode(file: File): Promise<ImageBitmap> {
  // SVG and PDF need a real <img>/object URL round-trip; createImageBitmap
  // refuses SVG without intrinsic size in some browsers, so rasterise via <img>
  // at a known box.
  if (file.type === "image/svg+xml" || file.type === "application/pdf") {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const w = img.naturalWidth || MAX_LOGO_EDGE;
      const h = img.naturalHeight || MAX_LOGO_EDGE;
      return await createImageBitmap(img, { resizeWidth: w, resizeHeight: h });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return createImageBitmap(file);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That file could not be opened as an image."));
    img.src = src;
  });
}

// -------------------------------------------------------------
// 1. Background removal
// -------------------------------------------------------------

interface CornerSample {
  r: number;
  g: number;
  b: number;
  uniform: boolean;
  bright: boolean;
}

/** Average a 5x5 patch at each corner and decide whether they agree. */
function sampleCorners(data: Uint8ClampedArray, w: number, h: number): CornerSample {
  const patch = 5;
  const corners: Array<[number, number]> = [
    [0, 0],
    [w - patch, 0],
    [0, h - patch],
    [w - patch, h - patch],
  ];

  const averages = corners.map(([sx, sy]) => {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let y = Math.max(0, sy); y < Math.min(h, sy + patch); y++) {
      for (let x = Math.max(0, sx); x < Math.min(w, sx + patch); x++) {
        const i = (y * w + x) * 4;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n++;
      }
    }
    return n ? [r / n, g / n, b / n] : [255, 255, 255];
  });

  const mean = averages.reduce(
    (acc, c) => [acc[0] + c[0] / 4, acc[1] + c[1] / 4, acc[2] + c[2] / 4],
    [0, 0, 0]
  );

  // Uniform: every corner within 18 units of the mean on every channel.
  const uniform = averages.every((c) =>
    c.every((v, ch) => Math.abs(v - mean[ch]) <= 18)
  );
  const bright = (mean[0] + mean[1] + mean[2]) / 3 >= 200;

  return { r: mean[0], g: mean[1], b: mean[2], uniform, bright };
}

/**
 * Remove a uniform bright background by flooding inward from the border.
 *
 * A flood fill rather than a global "delete every white pixel" pass: a global
 * pass punches holes through white counters inside letterforms and white areas
 * inside the mark itself. Flooding from the border only removes background that
 * is actually connected to the edge of the image.
 */
function removeBackground(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  const corner = sampleCorners(data, w, h);
  if (!corner.uniform || !corner.bright) return false;

  const tolerance = 42; // euclidean distance in RGB
  const tolSq = tolerance * tolerance;
  const visited = new Uint8Array(w * h);
  // Flat typed-array stack; a JS array of pairs is measurably slower here.
  const stack = new Int32Array(w * h);
  let top = 0;

  const matches = (p: number) => {
    const i = p * 4;
    const dr = data[i] - corner.r;
    const dg = data[i + 1] - corner.g;
    const db = data[i + 2] - corner.b;
    return dr * dr + dg * dg + db * db <= tolSq;
  };

  const push = (p: number) => {
    if (!visited[p] && matches(p)) {
      visited[p] = 1;
      stack[top++] = p;
    }
  };

  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }

  while (top > 0) {
    const p = stack[--top];
    const x = p % w;
    const y = (p / w) | 0;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (y > 0) push(p - w);
    if (y < h - 1) push(p + w);
  }

  // Second pass — enclosed background regions.
  //
  // The border flood cannot reach the counters of letters (the holes in A, O,
  // R, the gap in a ring mark), so they survive as opaque white. On a white
  // visiting card that is invisible; on a dark green signboard every letter
  // suddenly has a white blob in it.
  //
  // So sweep the leftover background-coloured components too — but only small
  // ones. A counter is a fraction of a percent of the image; a deliberate white
  // panel inside the mark is much larger and must be kept.
  const areaCap = Math.max(64, Math.floor(w * h * 0.03));
  const component = new Int32Array(w * h);
  for (let seed = 0; seed < w * h; seed++) {
    if (visited[seed] || !matches(seed)) continue;

    let size = 0;
    let head = 0;
    component[size++] = seed;
    visited[seed] = 1;
    while (head < size) {
      const p = component[head++];
      const x = p % w;
      const y = (p / w) | 0;
      const neighbours = [
        x > 0 ? p - 1 : -1,
        x < w - 1 ? p + 1 : -1,
        y > 0 ? p - w : -1,
        y < h - 1 ? p + w : -1,
      ];
      for (const n of neighbours) {
        if (n < 0 || visited[n] || !matches(n)) continue;
        visited[n] = 1;
        component[size++] = n;
      }
    }

    // Too big to be a counter — put it back.
    if (size > areaCap) {
      for (let i = 0; i < size; i++) visited[component[i]] = 0;
    }
  }

  // Clear the flooded region, then feather one pixel inward so anti-aliased
  // letter edges don't keep a bright halo against a dark mockup surface.
  for (let p = 0; p < w * h; p++) {
    if (visited[p]) data[p * 4 + 3] = 0;
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (visited[p] || data[p * 4 + 3] === 0) continue;
      const edge =
        (x > 0 && visited[p - 1]) ||
        (x < w - 1 && visited[p + 1]) ||
        (y > 0 && visited[p - w]) ||
        (y < h - 1 && visited[p + w]);
      if (edge) data[p * 4 + 3] = Math.round(data[p * 4 + 3] * 0.55);
    }
  }

  ctx.putImageData(image, 0, 0);
  return true;
}

// -------------------------------------------------------------
// 2. Palette extraction — k-means, k=5
// -------------------------------------------------------------

interface Cluster {
  r: number;
  g: number;
  b: number;
  count: number;
}

function saturationOf(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function isNearWhite(r: number, g: number, b: number) {
  return r > 235 && g > 235 && b > 235;
}

function isNearBlack(r: number, g: number, b: number) {
  return r < 26 && g < 26 && b < 26;
}

function toHex(r: number, g: number, b: number) {
  const part = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** k-means over opaque, non-extreme pixels. Deterministic seeding. */
function extractPalette(ctx: CanvasRenderingContext2D, w: number, h: number): Palette {
  const { data } = ctx.getImageData(0, 0, w, h);

  // Sample on a stride: 20k pixels is plenty for a 5-way split and keeps the
  // whole analysis inside the 2-3 second animation budget on a mid-range phone.
  const total = w * h;
  const stride = Math.max(1, Math.floor(total / 20000));
  const samples: number[] = [];
  for (let p = 0; p < total; p += stride) {
    const i = p * 4;
    if (data[i + 3] < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isNearWhite(r, g, b) || isNearBlack(r, g, b)) continue;
    samples.push(r, g, b);
  }

  const fallback: Palette = {
    primary: "#1a1a1a",
    secondary: "#6b6b6b",
    ink: "#111111",
    paper: "#f5f1e8",
  };
  const n = samples.length / 3;
  if (n < 8) return fallback;

  const k = Math.min(5, n);
  // Seed evenly across the sample list rather than at random, so the same logo
  // always yields the same swatches — the visitor may re-upload.
  const centroids: Cluster[] = [];
  for (let c = 0; c < k; c++) {
    const idx = Math.floor((c * n) / k) * 3;
    centroids.push({ r: samples[idx], g: samples[idx + 1], b: samples[idx + 2], count: 0 });
  }

  const assignment = new Int32Array(n);
  for (let iter = 0; iter < 12; iter++) {
    let moved = false;
    for (let p = 0; p < n; p++) {
      const r = samples[p * 3];
      const g = samples[p * 3 + 1];
      const b = samples[p * 3 + 2];
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        const dr = r - centroids[c].r;
        const dg = g - centroids[c].g;
        const db = b - centroids[c].b;
        const d = dr * dr + dg * dg + db * db;
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      if (assignment[p] !== best) {
        assignment[p] = best;
        moved = true;
      }
    }

    const sums = Array.from({ length: k }, () => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (let p = 0; p < n; p++) {
      const c = sums[assignment[p]];
      c.r += samples[p * 3];
      c.g += samples[p * 3 + 1];
      c.b += samples[p * 3 + 2];
      c.count++;
    }
    for (let c = 0; c < k; c++) {
      if (sums[c].count === 0) continue;
      centroids[c] = {
        r: sums[c].r / sums[c].count,
        g: sums[c].g / sums[c].count,
        b: sums[c].b / sums[c].count,
        count: sums[c].count,
      };
    }
    if (!moved) break;
  }

  // Most frequent *saturated* colour wins. Ranking on frequency alone hands the
  // primary slot to a grey drop shadow on a lot of real logos.
  const ranked = centroids
    .filter((c) => c.count > 0)
    .map((c) => ({
      ...c,
      score: c.count * (0.35 + saturationOf(c.r, c.g, c.b)),
    }))
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) return fallback;
  const primary = ranked[0];
  const secondary = ranked[1] ?? ranked[0];

  return {
    primary: toHex(primary.r, primary.g, primary.b),
    secondary: toHex(secondary.r, secondary.g, secondary.b),
    ink: "#111111",
    paper: "#f5f1e8",
  };
}

// -------------------------------------------------------------
// 3. Orientation
// -------------------------------------------------------------

/** Tight bounding box of the opaque pixels, so orientation ignores padding. */
function opaqueBounds(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const { data } = ctx.getImageData(0, 0, w, h);
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] < 24) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w, h };
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export function orientationFor(aspect: number): Orientation {
  if (aspect > 2) return "horizontal";
  if (aspect < 0.7) return "vertical";
  return "square";
}

// -------------------------------------------------------------
// Pipeline
// -------------------------------------------------------------

export interface AnalysisOutput extends BrandAnalysis {
  canvas: HTMLCanvasElement;
  blob: Blob;
}

/**
 * Full Screen 2 pipeline. Returns the processed logo as both a canvas (for
 * compositing) and a PNG blob (for upload), plus the derived brand facts.
 */
export async function analyseLogo(file: File): Promise<AnalysisOutput> {
  const canvas = await fileToCanvas(file);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  const backgroundRemoved = removeBackground(ctx, canvas.width, canvas.height);
  const palette = extractPalette(ctx, canvas.width, canvas.height);
  const bounds = opaqueBounds(ctx, canvas.width, canvas.height);

  // Trim to the mark itself. Every template positions the logo by its own box,
  // so uploaded padding would otherwise shrink the logo on every mockup.
  const trimmed = document.createElement("canvas");
  trimmed.width = bounds.w;
  trimmed.height = bounds.h;
  const tctx = trimmed.getContext("2d");
  if (!tctx) throw new Error("Canvas is unavailable in this browser.");
  tctx.drawImage(canvas, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, bounds.w, bounds.h);

  const aspect = bounds.w / bounds.h;
  const blob = await canvasToBlob(trimmed);

  return {
    canvas: trimmed,
    blob,
    processedUrl: URL.createObjectURL(blob),
    processedDataUrl: trimmed.toDataURL("image/png"),
    reverseDataUrl: knockout(trimmed).toDataURL("image/png"),
    palette,
    orientation: orientationFor(aspect),
    aspect,
    backgroundRemoved,
  };
}

/**
 * A white reverse (knockout) lockup of the mark.
 *
 * On a brand-colour ground — the back of the visiting card, the folder, the
 * Instagram tile — a full-colour logo loses whichever of its elements match the
 * ground, and a dark green wordmark on a dark green card simply disappears. A
 * single-colour reverse lockup is what a designer supplies for exactly this
 * case, so the mockups use one too.
 */
function knockout(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.drawImage(source, 0, 0);

  // Knock out by luminance rather than flattening the whole mark to a
  // silhouette. Only the parts that would disappear into a dark ground — the
  // dark ones — go white; a bright accent (a yellow tick inside a dark disc,
  // a gold rule under a wordmark) keeps its colour and its shape survives.
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const luminance = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    if (luminance < 0.55) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the image."))),
      type
    );
  });
}
