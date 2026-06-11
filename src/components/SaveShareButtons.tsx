"use client";

import React, { useEffect, useState } from "react";
import { Bookmark, Share2, Check } from "lucide-react";

interface Props {
  slug: string;
  title: string;
}

const STORAGE_KEY = "oea-saved-events";

export default function SaveShareButtons({ slug, title }: Props) {
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    // deferred so hydration completes before state sync from localStorage
    const timer = setTimeout(() => {
      try {
        const list: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        setSaved(list.includes(slug));
      } catch {
        /* ignore */
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [slug]);

  const toggleSave = () => {
    try {
      const list: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const next = list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaved(next.includes(slug));
    } catch {
      /* ignore */
    }
  };

  const share = async () => {
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: `${title} — Odisha Event Alert`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1500);
      }
    } catch {
      /* cancelled */
    }
  };

  const btnClass =
    "w-9 h-9 rounded-xl grid place-items-center backdrop-blur transition-colors text-white";

  return (
    <div className="flex gap-2">
      <button
        onClick={toggleSave}
        aria-label={saved ? "Remove saved event" : "Save event"}
        title={saved ? "Saved" : "Save event"}
        className={`${btnClass} ${saved ? "bg-brand-accent" : "bg-slate-950/55 hover:bg-brand-accent"}`}
      >
        <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
      </button>
      <button
        onClick={share}
        aria-label="Share event"
        title="Share event"
        className={`${btnClass} bg-slate-950/55 hover:bg-brand-accent`}
      >
        {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
