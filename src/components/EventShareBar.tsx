"use client";

import React, { useState } from "react";
import { MessageCircle, Link2, Check, Download, Loader2 } from "lucide-react";

// lucide-react (v1.x) has no Instagram glyph, so use an inline SVG.
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

interface Props {
  title: string;
  posterUrl: string;
}

// Quick-share actions for an event: WhatsApp, Copy Link, Instagram Story,
// Download Poster. Built to degrade gracefully when Web Share / file share
// isn't available (desktop browsers).
export default function EventShareBar({ title, posterUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [igBusy, setIgBusy] = useState(false);
  const [dlBusy, setDlBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const pageUrl = () => (typeof window !== "undefined" ? window.location.href.split("?")[0] : "");

  const flash = (msg: string) => {
    setNote(msg);
    setTimeout(() => setNote(null), 2500);
  };

  const shareWhatsApp = () => {
    const text = `${title}\n${pageUrl()}\n\nvia Odisha Event Alert`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      flash("Couldn't copy — long-press the address bar to copy the link.");
    }
  };

  // Fetch the poster as a File (for Web Share) — returns null if blocked by CORS.
  const fetchPosterFile = async (): Promise<File | null> => {
    try {
      const res = await fetch(posterUrl, { mode: "cors" });
      if (!res.ok) return null;
      const blob = await res.blob();
      const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      return new File([blob], `odisha-event-alert-poster.${ext}`, { type: blob.type || "image/jpeg" });
    } catch {
      return null;
    }
  };

  const shareInstagramStory = async () => {
    setIgBusy(true);
    try {
      const file = await fetchPosterFile();
      // Best path: native share sheet with the poster image — the user picks
      // "Instagram → Story". Only available on supporting (mobile) browsers.
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (file && nav.canShare && nav.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title, text: `${title} — Odisha Event Alert` });
        return;
      }
      // Fallback: download the poster, then open Instagram so the user can post it.
      if (file) {
        triggerDownload(URL.createObjectURL(file), file.name);
        flash("Poster downloaded — opening Instagram. Add it to your story!");
      } else {
        flash("Poster downloaded — open Instagram and add it to your story.");
      }
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    } catch {
      /* user cancelled the share sheet */
    } finally {
      setIgBusy(false);
    }
  };

  const triggerDownload = (href: string, filename: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadPoster = async () => {
    setDlBusy(true);
    try {
      const file = await fetchPosterFile();
      if (file) {
        const objUrl = URL.createObjectURL(file);
        triggerDownload(objUrl, file.name);
        setTimeout(() => URL.revokeObjectURL(objUrl), 4000);
      } else {
        // CORS-blocked: open in a new tab so the user can long-press / save.
        window.open(posterUrl, "_blank", "noopener,noreferrer");
        flash("Opened the poster in a new tab — long-press or right-click to save.");
      }
    } finally {
      setDlBusy(false);
    }
  };

  const btn =
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-display border transition-all";

  return (
    <div className="space-y-2.5">
      <h2 className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase text-brand-accent">
        Share this event
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={shareWhatsApp}
          className={`${btn} border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white`}
        >
          <MessageCircle className="w-4 h-4 shrink-0" /> WhatsApp
        </button>
        <button
          onClick={copyLink}
          className={`${btn} border-card-line bg-chip text-ink hover:border-brand-accent hover:text-brand-accent`}
        >
          {copied ? <Check className="w-4 h-4 shrink-0 text-ok" /> : <Link2 className="w-4 h-4 shrink-0" />}
          {copied ? "Copied!" : "Copy Link"}
        </button>
        <button
          onClick={shareInstagramStory}
          disabled={igBusy}
          className={`${btn} border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-300 hover:bg-pink-500 hover:text-white disabled:opacity-60`}
        >
          {igBusy ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <InstagramIcon className="w-4 h-4 shrink-0" />}
          Story
        </button>
        <button
          onClick={downloadPoster}
          disabled={dlBusy}
          className={`${btn} border-card-line bg-chip text-ink hover:border-brand-accent hover:text-brand-accent disabled:opacity-60`}
        >
          {dlBusy ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <Download className="w-4 h-4 shrink-0" />}
          Poster
        </button>
      </div>
      {note && <p className="text-[11px] font-semibold text-muted">{note}</p>}
    </div>
  );
}
