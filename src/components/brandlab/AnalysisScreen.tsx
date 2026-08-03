"use client";

/* eslint-disable @next/next/no-img-element -- The logo and artwork are blob:
   and data: URLs generated in this browser session. next/image cannot optimise
   them, and routing them through the image endpoint would upload artwork the
   visitor has not yet consented to share. */

import React from "react";
import { Check } from "lucide-react";
import type { BrandAnalysis } from "@/lib/brandlab/types";

// Screen 2 — Auto-analysis.
//
// The work is already done by the time this renders; the 2-3 seconds are spent
// showing it. "We found your brand colours" plus a swatch strip does more for
// perceived intelligence than any AI feature, and it costs nothing.

const STEPS = [
  "Reading your logo",
  "Removing the background",
  "Extracting your brand colours",
  "Matching your kit templates",
];

interface Props {
  analysis: BrandAnalysis | null;
  error: string | null;
  onDone: () => void;
  onRetry: () => void;
}

export default function AnalysisScreen({ analysis, error, onDone, onRetry }: Props) {
  const [step, setStep] = React.useState(0);

  // Derived, not stored: the swatches are visible exactly when the checklist has
  // finished and the analysis landed.
  const revealed = !error && analysis !== null && step >= STEPS.length;

  React.useEffect(() => {
    if (error) return;
    const timer = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length));
    }, 620);
    return () => window.clearInterval(timer);
  }, [error]);

  React.useEffect(() => {
    if (!revealed) return;
    // Hold the reveal for a beat before moving on — this moment is doing more
    // for perceived intelligence than the rest of the flow combined.
    const timer = window.setTimeout(onDone, 1500);
    return () => window.clearTimeout(timer);
  }, [revealed, onDone]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-lg text-center">
        <h2 className="fp-display mb-3 text-2xl">That file did not open</h2>
        <p className="mb-6 text-[var(--fp-ink-soft)]">{error}</p>
        <button className="fp-btn" onClick={onRetry}>
          Try another file
        </button>
      </div>
    );
  }

  const palette = analysis?.palette;

  return (
    <div className="mx-auto w-full max-w-lg text-center">
      <p className="fp-eyebrow mb-3">Step 2 of 4 · Analysis</p>

      <div className="fp-crop fp-scan mx-auto mb-8 flex h-52 w-52 items-center justify-center border bg-white p-6"
        style={{ borderColor: "var(--fp-line)" }}
      >
        {analysis && (
          <img src={analysis.processedUrl} alt="Your logo" className="max-h-full max-w-full object-contain" />
        )}
      </div>

      <ul className="mx-auto mb-8 max-w-xs space-y-2 text-left">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className="flex items-center gap-2.5 text-sm transition-opacity"
            style={{ opacity: i <= step ? 1 : 0.32 }}
          >
            <span
              className="flex h-4 w-4 flex-none items-center justify-center border"
              style={{
                borderColor: i < step ? "var(--fp-ink)" : "var(--fp-line)",
                background: i < step ? "var(--fp-signal)" : "transparent",
              }}
            >
              {i < step && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            {label}
          </li>
        ))}
      </ul>

      {revealed && palette && (
        <div>
          <h2 className="fp-display mb-4 text-2xl">We found your brand colours</h2>
          <div className="mx-auto grid max-w-xs grid-cols-4 gap-2">
            {(
              [
                ["Primary", palette.primary],
                ["Secondary", palette.secondary],
                ["Ink", palette.ink],
                ["Paper", palette.paper],
              ] as const
            ).map(([label, colour], i) => (
              <div key={label}>
                <div
                  className="fp-swatch"
                  style={{ background: colour, animationDelay: `${i * 90}ms` }}
                />
                <p className="fp-mono mt-1.5 text-[0.6rem] uppercase tracking-wider text-[var(--fp-ink-soft)]">
                  {label}
                </p>
              </div>
            ))}
          </div>
          {analysis?.backgroundRemoved && (
            <p className="fp-mono mt-5 text-[0.68rem] text-[var(--fp-ink-soft)]">
              Background removed automatically
            </p>
          )}
        </div>
      )}
    </div>
  );
}
