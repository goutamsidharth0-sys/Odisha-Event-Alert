// The projective transform behind every Type B composite.
//
// A template stores a four-point quad marking the logo surface in the base
// photograph. Mapping the logo's own rectangle onto that quad is a homography.
// The browser will do it for free in two different places:
//
//   preview  — CSS `matrix3d`, which *is* a homography, GPU-composited
//   hi-res   — inverse mapping per pixel on an offscreen canvas
//
// No WebGL, no library, no server call.

import type { Point, Quad } from "./types";

/** Row-major 3x3. Maps source (x, y, 1) -> (X, Y, W); divide by W. */
export type Matrix3x3 = [number, number, number, number, number, number, number, number, number];

/**
 * Solve the homography taking the rectangle (0,0)-(w,h) onto `quad`
 * (TL, TR, BR, BL).
 *
 * Eight unknowns, eight equations, h33 fixed at 1 — a plain 8x8 solve.
 */
export function quadTransform(w: number, h: number, quad: Quad): Matrix3x3 {
  const src: Point[] = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];

  const a: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = quad[i];
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }

  const h8 = solve(a, b);
  return [h8[0], h8[1], h8[2], h8[3], h8[4], h8[5], h8[6], h8[7], 1];
}

/** Gaussian elimination with partial pivoting. */
function solve(a: number[][], b: number[]): number[] {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    }
    if (Math.abs(m[pivot][col]) < 1e-12) {
      throw new Error("Degenerate quad: the four corners must not be collinear.");
    }
    [m[col], m[pivot]] = [m[pivot], m[col]];

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = m[row][col] / m[col][col];
      if (factor === 0) continue;
      for (let k = col; k <= n; k++) m[row][k] -= factor * m[col][k];
    }
  }

  // Fully reduced: each row is now `m[i][i] * x_i = m[i][n]`.
  return m.map((row, i) => row[n] / row[i]);
}

/**
 * The same homography as a CSS `matrix3d` string.
 *
 * CSS takes a 4x4 in column-major order. Dropping z leaves the 3x3 mapped as
 * below — the element must be `w`x`h` with `transform-origin: 0 0`.
 */
export function toMatrix3d(m: Matrix3x3): string {
  const [a, b, c, d, e, f, g, h, i] = m;
  const values = [
    a, d, 0, g,
    b, e, 0, h,
    0, 0, 1, 0,
    c, f, 0, i,
  ];
  return `matrix3d(${values.map((v) => round(v)).join(", ")})`;
}

function round(v: number): number {
  return Math.abs(v) < 1e-10 ? 0 : Number(v.toFixed(10));
}

/** Invert a 3x3, for the per-pixel hi-res warp. */
export function invert(m: Matrix3x3): Matrix3x3 {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) throw new Error("Homography is not invertible.");
  const inv = 1 / det;
  return [
    A * inv,
    -(b * i - c * h) * inv,
    (b * f - c * e) * inv,
    B * inv,
    (a * i - c * g) * inv,
    -(a * f - c * d) * inv,
    C * inv,
    -(a * h - b * g) * inv,
    (a * e - b * d) * inv,
  ];
}

export function applyMatrix(m: Matrix3x3, x: number, y: number): Point {
  const w = m[6] * x + m[7] * y + m[8];
  return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w];
}

/** Axis-aligned bounds of a quad, used to limit the hi-res warp loop. */
export function quadBounds(quad: Quad) {
  const xs = quad.map((p) => p[0]);
  const ys = quad.map((p) => p[1]);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

/**
 * Fit a logo of the given aspect ratio inside a quad, centred, preserving
 * proportions.
 *
 * The quad is authored for a surface, not for a particular logo. Warping the
 * logo to fill the whole quad would stretch a horizontal wordmark into a square
 * signboard — the one distortion that reads as amateur instantly.
 */
export function fitQuad(quad: Quad, logoAspect: number): Quad {
  const [tl, tr, br, bl] = quad;
  const topLen = dist(tl, tr);
  const bottomLen = dist(bl, br);
  const leftLen = dist(tl, bl);
  const rightLen = dist(tr, br);
  const quadAspect = (topLen + bottomLen) / (leftLen + rightLen);

  let u0 = 0;
  let v0 = 0;
  if (logoAspect > quadAspect) {
    // Logo is wider than the surface: full width, inset vertically.
    v0 = (1 - quadAspect / logoAspect) / 2;
  } else {
    u0 = (1 - logoAspect / quadAspect) / 2;
  }
  const u1 = 1 - u0;
  const v1 = 1 - v0;

  // Inset in the surface's own unit space, then project back through the
  // quad's homography — so the inset follows the perspective rather than
  // being interpolated flat in image coordinates.
  const h = quadTransform(1, 1, quad);
  const at = (u: number, v: number) => applyMatrix(h, u, v);
  return [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];
}

function dist(p: Point, q: Point) {
  return Math.hypot(q[0] - p[0], q[1] - p[1]);
}
