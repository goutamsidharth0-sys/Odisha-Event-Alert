"use client";

import React from "react";
import { X, Maximize2 } from "lucide-react";
import Mockup from "./Mockup";
import { specLine } from "@/lib/brandlab/templates";
import type { BrandArt } from "@/lib/brandlab/flatArt";
import type { Template } from "@/lib/brandlab/types";

// Screen 4 — The Kit.
//
// Full-bleed gallery of the visitor's own logo and colours on every item.
//
// No price is shown anywhere on this screen. A displayed price destroys the
// anchoring sequence used on WhatsApp and invites competitor comparison before
// value is established. Each item carries a spec line instead.

interface Props {
  templates: Template[];
  art: BrandArt;
  onContinue: () => void;
  onEnlarge?: (slug: string) => void;
}

export default function KitScreen({ templates, art, onContinue, onEnlarge }: Props) {
  const [enlarged, setEnlarged] = React.useState<Template | null>(null);

  return (
    <div className="w-full">
      <div className="mx-auto mb-8 w-full max-w-6xl">
        <p className="fp-eyebrow mb-3">Step 4 of 4 · Your kit</p>
        <h2 className="fp-display text-2xl sm:text-3xl">
          {art.businessName}, on {templates.length} things you can order this week.
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--fp-ink-soft)]">
          Every item here is made in our own workshop and delivered across Bhubaneswar,
          Cuttack and Puri. Tap any item to see it larger.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <figure key={template.slug} className="fp-crop border bg-white" style={{ borderColor: "var(--fp-line)" }}>
            <button
              type="button"
              className="group relative block w-full overflow-hidden"
              style={{ aspectRatio: "4 / 3" }}
              onClick={() => {
                setEnlarged(template);
                onEnlarge?.(template.slug);
              }}
              aria-label={`Enlarge ${template.name}`}
            >
              <Mockup template={template} art={art} />
              <span className="pointer-events-none absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-[var(--fp-ink)] text-[var(--fp-paper)] opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-4 w-4" />
              </span>
            </button>
            <figcaption className="border-t px-4 py-3" style={{ borderColor: "var(--fp-line)" }}>
              <p className="font-semibold">{template.name}</p>
              <p className="fp-mono mt-0.5 text-[0.66rem] leading-snug text-[var(--fp-ink-soft)]">
                {template.printSpecs.material} · {template.printSpecs.defaultSize}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-6xl flex-col items-start gap-3">
        <button className="fp-btn fp-btn--signal w-full sm:w-auto" onClick={onContinue}>
          Get my exact quote
        </button>
        <p className="fp-mono text-[0.68rem] leading-relaxed text-[var(--fp-ink-soft)]">
          Indicative visualisation. Final artwork and dimensions are confirmed before production.
        </p>
      </div>

      {enlarged && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,20,0.88)] p-4"
          role="dialog"
          aria-modal="true"
          aria-label={enlarged.name}
          onClick={() => setEnlarged(null)}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white" style={{ aspectRatio: "4 / 3" }}>
              <Mockup template={enlarged} art={art} />
            </div>
            <div className="mt-3 flex items-start justify-between gap-4 text-[var(--fp-paper)]">
              <div>
                <p className="font-semibold">{enlarged.name}</p>
                <p className="fp-mono mt-0.5 text-[0.68rem] opacity-80">{specLine(enlarged)}</p>
              </div>
              <button
                className="flex h-9 w-9 flex-none items-center justify-center border border-white/40"
                onClick={() => setEnlarged(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
