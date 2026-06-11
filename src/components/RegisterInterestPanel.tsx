"use client";

import React, { useActionState, useEffect, useState } from "react";
import { registerInterestAction } from "@/lib/actions";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";

interface Props {
  eventId: string;
  eventTitle: string;
  priceType: string;
  status: string;
  cities: { name: string; slug: string }[];
}

interface FormState {
  success?: boolean;
  error?: string;
  code?: string;
  message?: string;
}

const CONFETTI_COLORS = ["#F26B1D", "#FFC56B", "#2BB673", "#1B2A4A", "#FF8A3D"];

function Confetti() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const pieces: HTMLDivElement[] = [];
    for (let i = 0; i < 32; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.left = `${20 + ((i * 53) % 60)}%`;
      c.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      c.style.animationDelay = `${(i % 8) * 0.07}s`;
      c.style.animationDuration = `${1.2 + (i % 5) * 0.2}s`;
      document.body.appendChild(c);
      pieces.push(c);
    }
    const timer = setTimeout(() => pieces.forEach((p) => p.remove()), 2800);
    return () => {
      clearTimeout(timer);
      pieces.forEach((p) => p.remove());
    };
  }, []);
  return null;
}

export default function RegisterInterestPanel({ eventId, eventTitle, priceType, status, cities }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(registerInterestAction, {});
  const [copied, setCopied] = useState(false);

  const isWatchlist = status === "WATCHLIST";
  const ctaLabel = isWatchlist
    ? "Get Notified on OEA"
    : priceType === "FREE"
      ? "Register on OEA"
      : "Register Interest";

  const copyCode = async () => {
    if (!state.code) return;
    try {
      await navigator.clipboard.writeText(state.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (state.success && state.code) {
    return (
      <div className="text-center px-2 py-6" aria-live="polite">
        <Confetti />
        <div className="relative w-[88px] h-[88px] mx-auto mb-5">
          <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
            <circle className="success-ring-circle" cx="48" cy="48" r="42" />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <svg viewBox="0 0 24 24" className="w-9 h-9">
              <path className="success-tick" d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>
        <h3 className="font-display text-xl font-bold text-ink mb-2">
          {isWatchlist ? "You're on the alert list!" : "Interest registered!"}
        </h3>
        <p className="text-muted text-sm font-semibold mb-4 leading-relaxed">
          {state.message ||
            "We've saved your spot on the radar. You'll get a confirmation shortly, plus reminders and any change alerts for this event."}
        </p>
        <button
          onClick={copyCode}
          className="inline-flex items-center gap-2 font-mono text-sm text-brand-accent bg-brand-accent/10 rounded-lg px-4 py-2.5 hover:bg-brand-accent/15 transition-colors"
          title="Copy registration ID"
        >
          {state.code}
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <p className="text-[11px] text-muted font-semibold mt-3">
          Save this registration ID — quote it for any queries about “{eventTitle}”.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3.5">
      <input type="hidden" name="eventId" value={eventId} />

      <div>
        <h2 className="font-display text-lg font-semibold text-ink">
          {isWatchlist ? "Get Notified on OEA" : "Register Interest on OEA"}
        </h2>
        <p className="text-muted text-xs font-semibold mt-1 mb-4">
          {isWatchlist
            ? "Details are still being confirmed. Register to be alerted the moment this event goes live."
            : "Get confirmation, reminders, and instant alerts if anything changes."}
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold text-ink mb-1.5">
          Name <i className="text-brand-accent not-italic">*</i>
        </label>
        <input
          name="name"
          required
          minLength={2}
          placeholder="Your full name"
          className="w-full rounded-xl border text-sm py-2.5 px-3.5 text-ink placeholder:text-muted focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
          style={{ background: "var(--input)", borderColor: "var(--card-line)" }}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-ink mb-1.5">
          Mobile number <i className="text-brand-accent not-italic">*</i>
        </label>
        <input
          name="mobile"
          required
          inputMode="numeric"
          pattern="[6-9][0-9]{9}"
          maxLength={10}
          placeholder="10-digit mobile"
          title="Enter a valid 10-digit Indian mobile number"
          className="w-full rounded-xl border text-sm py-2.5 px-3.5 text-ink placeholder:text-muted focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
          style={{ background: "var(--input)", borderColor: "var(--card-line)" }}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-ink mb-1.5">
          Email <span className="text-muted font-semibold">(recommended)</span>
        </label>
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          className="w-full rounded-xl border text-sm py-2.5 px-3.5 text-ink placeholder:text-muted focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
          style={{ background: "var(--input)", borderColor: "var(--card-line)" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">City</label>
          <select
            name="city"
            defaultValue=""
            className="w-full rounded-xl border text-sm py-2.5 px-3 text-ink focus:outline-none focus:border-brand-accent"
            style={{ background: "var(--input)", borderColor: "var(--card-line)" }}
          >
            <option value="">Select…</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">People attending</label>
          <select
            name="attendeeCount"
            defaultValue="1"
            className="w-full rounded-xl border text-sm py-2.5 px-3 text-ink focus:outline-none focus:border-brand-accent"
            style={{ background: "var(--input)", borderColor: "var(--card-line)" }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-xs text-muted font-semibold cursor-pointer pt-1">
        <input type="checkbox" name="consentEventUpdates" required className="mt-0.5 w-4 h-4 accent-brand-accent shrink-0" />
        <span>
          I agree to receive updates about this event from OEA. <i className="text-brand-accent not-italic">*</i>
        </span>
      </label>
      <label className="flex items-start gap-2.5 text-xs text-muted font-semibold cursor-pointer">
        <input type="checkbox" name="consentSimilarAlerts" className="mt-0.5 w-4 h-4 accent-brand-accent shrink-0" />
        <span>Also alert me about similar events in Odisha (optional)</span>
      </label>

      {state.error && (
        <p className="text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2" aria-live="polite">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3.5 rounded-xl glow-btn text-sm font-bold font-display text-white flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        {pending ? "Registering…" : ctaLabel}
      </button>

      <p className="text-center text-[11px] text-muted font-semibold flex items-center justify-center gap-1.5">
        <CheckCircle2 className="w-3 h-3 text-ok" />
        Every listing is reviewed before it appears on OEA
      </p>
    </form>
  );
}
