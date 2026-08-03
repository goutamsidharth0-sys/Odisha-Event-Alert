"use client";

/* eslint-disable @next/next/no-img-element -- The logo and artwork are blob:
   and data: URLs generated in this browser session. next/image cannot optimise
   them, and routing them through the image endpoint would upload artwork the
   visitor has not yet consented to share. */

import React from "react";
import { fitQuad, quadTransform, toMatrix3d } from "@/lib/brandlab/homography";
import { renderFlat, svgToDataUrl, type BrandArt } from "@/lib/brandlab/flatArt";
import type { PhotoTemplate, Template } from "@/lib/brandlab/types";

// The preview half of the render pipeline (§6).
//
// Type A: the print-ready SVG, inlined.
// Type B: a DOM layer over the base photograph, positioned with a CSS matrix3d
//         derived from the template quad, with the shading map multiplied over
//         the top.
//
// CSS matrix3d gives a true projective transform for free. No WebGL, no
// library, no server call — and the logo stays a real image element, so it is
// pixel-perfect at any zoom.

interface Props {
  template: Template;
  art: BrandArt;
  className?: string;
}

export default function Mockup({ template, art, className }: Props) {
  if (template.type === "flat") {
    return <FlatMockup template={template} art={art} className={className} />;
  }
  return <PhotoMockup template={template} art={art} className={className} />;
}

function FlatMockup({
  template,
  art,
  className,
}: Props & { template: Extract<Template, { type: "flat" }> }) {
  const boards = React.useMemo(() => renderFlat(template.slug, art), [template.slug, art]);

  return (
    <div className={`flex h-full w-full items-center justify-center gap-2 p-3 ${className ?? ""}`}>
      {boards.map((board) => (
        // Each artboard gets an equal, shrinkable share of the row. Without the
        // wrapper the images size to their own intrinsic width and a two- or
        // three-board template (visiting card, Instagram set) overflows the tile.
        <div key={board.label} className="flex h-full min-w-0 flex-1 items-center justify-center">
          <img
            src={svgToDataUrl(board.svg)}
            alt={`${template.name} — ${board.label}`}
            className="max-h-full max-w-full object-contain shadow-[0_10px_30px_rgba(20,20,20,0.16)]"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

function PhotoMockup({
  template,
  art,
  className,
}: Props & { template: PhotoTemplate }) {
  const { baseSize } = template;

  // The logo layer is laid out at its own natural size in base-image
  // coordinates, then mapped onto the surface quad. Fitting first keeps the
  // proportions: a wide wordmark must not be stretched square to fill a board.
  const layer = React.useMemo(() => {
    const fitted = fitQuad(template.quad, art.logoAspect);
    // Work at a fixed layer height and let the homography do the scaling, so
    // the same numbers drive preview and export.
    const h = 512;
    const w = h * art.logoAspect;
    return { w, h, matrix: toMatrix3d(quadTransform(w, h, fitted)) };
  }, [template.quad, art.logoAspect]);

  return (
    <div
      className={`fp-composite h-full w-full ${className ?? ""}`}
      style={{ aspectRatio: `${baseSize.w} / ${baseSize.h}` }}
    >
      {/* A nested box in base-image coordinates: everything inside is positioned
          in the same pixel space the template quad was authored in. */}
      <div
        className="absolute inset-0"
        style={{
          width: baseSize.w,
          height: baseSize.h,
          transform: "scale(var(--fp-scale, 1))",
          transformOrigin: "0 0",
        }}
        ref={useAutoScale(baseSize)}
      >
        <img
          src={template.baseImageUrl}
          alt=""
          className="fp-composite__base"
          style={{ width: baseSize.w, height: baseSize.h, position: "absolute", inset: 0 }}
          aria-hidden
        />
        <div
          className="fp-composite__logo"
          style={{ width: layer.w, height: layer.h, transform: layer.matrix }}
        >
          <img src={art.logoUrl} alt={`${art.businessName} logo on ${template.name}`} />
        </div>
        <img
          src={template.shadingMapUrl}
          alt=""
          className="fp-composite__shading"
          style={{ width: baseSize.w, height: baseSize.h, position: "absolute", inset: 0 }}
          aria-hidden
        />
      </div>
    </div>
  );
}

/**
 * Scale the base-coordinate box down to whatever width the tile actually has.
 *
 * Done with a CSS variable on a ResizeObserver rather than by recomputing the
 * matrix: the quad stays authored in image pixels, which is the coordinate
 * space the asset shoot produces and the hi-res export consumes.
 */
function useAutoScale(baseSize: { w: number; h: number }) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const node = ref.current;
    const parent = node?.parentElement;
    if (!node || !parent) return;

    const apply = () => {
      const scale = parent.clientWidth / baseSize.w;
      node.style.setProperty("--fp-scale", String(scale));
    };
    apply();

    const observer = new ResizeObserver(apply);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [baseSize.w]);

  return ref;
}
