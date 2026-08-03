"use client";

import React from "react";
import { ArrowRight, Clock } from "lucide-react";
import { TEMPLATES, specLine } from "@/lib/brandlab/templates";
import type { BusinessCategory, Intent } from "@/lib/brandlab/types";

// Screen 3 — Intent. Maximum three taps.
//
// Q3 only appears for "just a few items", so the common paths are two taps.

interface Props {
  onDone: (answers: {
    intent: Intent;
    businessCategory: BusinessCategory;
    selectedTemplates: string[];
  }) => void;
}

const INTENTS: Array<{ value: Intent; label: string; hint: string; soon?: boolean }> = [
  { value: "full_kit", label: "Full branding kit", hint: "Everything — stationery, signage, uniforms" },
  { value: "few_items", label: "Just a few items", hint: "Pick exactly what you need" },
  { value: "storefront", label: "Storefront / signage", hint: "Shopfront boards, shutters, glow signs" },
  { value: "interior", label: "Office & interior branding", hint: "Reception walls, glass, wayfinding", soon: true },
];

const CATEGORIES: Array<{ value: BusinessCategory; label: string }> = [
  { value: "retail", label: "Retail store" },
  { value: "office", label: "Office / corporate" },
  { value: "restaurant", label: "Restaurant / café" },
  { value: "clinic", label: "Clinic / hospital" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

export default function IntentScreen({ onDone }: Props) {
  const [intent, setIntent] = React.useState<Intent | null>(null);
  const [category, setCategory] = React.useState<BusinessCategory | null>(null);
  const [picked, setPicked] = React.useState<string[]>([]);

  const question = intent === null ? 1 : category === null ? 2 : 3;
  const needsItems = intent === "few_items";

  React.useEffect(() => {
    // Two-tap paths finish as soon as the category lands.
    if (intent && category && !needsItems) {
      onDone({ intent, businessCategory: category, selectedTemplates: [] });
    }
  }, [intent, category, needsItems, onDone]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="fp-eyebrow mb-3">Step 3 of 4 · {question === 3 ? "Your items" : "A couple of questions"}</p>

      {question === 1 && (
        <section>
          <h2 className="fp-display mb-6 text-2xl sm:text-3xl">What do you need?</h2>
          <div className="grid gap-3">
            {INTENTS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="fp-choice relative"
                onClick={() => {
                  if (option.soon) return;
                  setIntent(option.value);
                }}
                disabled={option.soon}
                style={option.soon ? { opacity: 0.6, cursor: "default" } : undefined}
              >
                <span className="flex items-center justify-between gap-3">
                  <span>
                    <span className="block font-semibold">{option.label}</span>
                    <span className="block text-sm text-[var(--fp-ink-soft)]">{option.hint}</span>
                  </span>
                  {option.soon ? (
                    <span className="fp-mono flex flex-none items-center gap-1 text-[0.62rem] uppercase tracking-wider">
                      <Clock className="h-3 w-3" /> Coming soon
                    </span>
                  ) : (
                    <ArrowRight className="h-4 w-4 flex-none" />
                  )}
                </span>
              </button>
            ))}
          </div>
          <p className="fp-mono mt-4 text-[0.68rem] text-[var(--fp-ink-soft)]">
            Interior branding launches next. Choose it and we will note your interest.
          </p>
          <button
            type="button"
            className="fp-btn fp-btn--ghost mt-3"
            onClick={() => setIntent("interior")}
          >
            Register interest in interior branding
          </button>
        </section>
      )}

      {question === 2 && (
        <section>
          <h2 className="fp-display mb-6 text-2xl sm:text-3xl">What kind of business?</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORIES.map((option) => (
              <button
                key={option.value}
                type="button"
                className="fp-choice text-center font-medium"
                onClick={() => setCategory(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {question === 3 && needsItems && category && (
        <section>
          <h2 className="fp-display mb-2 text-2xl sm:text-3xl">Which items?</h2>
          <p className="mb-6 text-[var(--fp-ink-soft)]">Pick as many as you like.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TEMPLATES.filter((t) => t.active).map((template) => {
              const selected = picked.includes(template.slug);
              return (
                <button
                  key={template.slug}
                  type="button"
                  data-selected={selected}
                  className="fp-choice relative"
                  onClick={() =>
                    setPicked((current) =>
                      current.includes(template.slug)
                        ? current.filter((s) => s !== template.slug)
                        : [...current, template.slug]
                    )
                  }
                >
                  <span className="block pr-4 font-medium">{template.name}</span>
                  <span className="fp-mono mt-1 block text-[0.62rem] leading-snug text-[var(--fp-ink-soft)]">
                    {template.printSpecs.material}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            className="fp-btn mt-6 w-full sm:w-auto"
            disabled={picked.length === 0}
            onClick={() =>
              onDone({ intent: "few_items", businessCategory: category, selectedTemplates: picked })
            }
          >
            Show my {picked.length || ""} item{picked.length === 1 ? "" : "s"}
          </button>
          <p className="sr-only">
            {picked.map((slug) => {
              const t = TEMPLATES.find((x) => x.slug === slug);
              return t ? specLine(t) : slug;
            }).join("; ")}
          </p>
        </section>
      )}
    </div>
  );
}
