"use client";

import React from "react";
import { priceLabel } from "./badges";

interface Props {
  priceType: string;
  minPrice: number | null;
  status: string;
}

// Sticky bottom CTA on mobile (blueprint §7.2): scrolls to the register panel.
export default function MobileRegisterBar({ priceType, minPrice, status }: Props) {
  const label =
    status === "WATCHLIST"
      ? "Get Notified on OEA"
      : priceType === "FREE"
        ? "Register on OEA — Free"
        : "Register Interest on OEA";

  const scrollToPanel = () => {
    document.getElementById("register-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-4 py-3 border-t backdrop-blur-xl flex items-center gap-3"
      style={{
        background: "var(--nav-bg)",
        borderColor: "var(--card-line)",
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
      }}
    >
      <span className="font-display font-semibold text-sm text-ink shrink-0">
        {priceLabel(priceType, minPrice)}
      </span>
      <button
        onClick={scrollToPanel}
        className="flex-1 py-3 rounded-xl glow-btn text-xs font-bold font-display text-white uppercase tracking-wider"
      >
        {label}
      </button>
    </div>
  );
}
