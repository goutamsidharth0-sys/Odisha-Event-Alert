"use client";

import React, { useState } from "react";
import { saveOrganizerEventAction } from "@/lib/actions";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

interface EventValues {
  id?: string;
  title?: string;
  description?: string;
  categoryId?: string;
  cityId?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  venueName?: string;
  address?: string;
  googleMapUrl?: string;
  priceType?: string;
  registrationUrl?: string;
  officialUrl?: string;
  instagramUrl?: string;
  posterUrl?: string;
}

const inputCls =
  "w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 px-3.5 text-white focus:outline-none focus:border-brand-accent/50 font-semibold text-xs";
const labelCls = "text-[10px] uppercase tracking-wider text-slate-300 font-bold";

export default function OrganizerEventForm({
  categories,
  cities,
  event,
}: {
  categories: Option[];
  cities: Option[];
  event?: EventValues;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await saveOrganizerEventAction(null, formData);
      if (res.success) {
        setNotice(res.message || "Saved.");
        if (!event?.id) window.location.href = "/organizer/dashboard";
      } else {
        setError(res.error || "Failed to save.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      {event?.id && <input type="hidden" name="id" value={event.id} />}

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className={labelCls}>Event Title *</label>
        <input name="title" required defaultValue={event?.title} className={inputCls} placeholder="Open Mic Night at ..." />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Description * (60+ characters helps your event publish instantly)</label>
        <textarea name="description" required rows={5} defaultValue={event?.description} className={inputCls} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelCls}>Category *</label>
          <select name="categoryId" required defaultValue={event?.categoryId || ""} className={inputCls}>
            <option value="" disabled>
              Select category
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>City *</label>
          <select name="cityId" required defaultValue={event?.cityId || ""} className={inputCls}>
            <option value="" disabled>
              Select city
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className={labelCls}>Start Date *</label>
          <input type="date" name="startDate" required defaultValue={event?.startDate} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>End Date</label>
          <input type="date" name="endDate" defaultValue={event?.endDate} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Start Time</label>
          <input type="time" name="startTime" defaultValue={event?.startTime} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>End Time</label>
          <input type="time" name="endTime" defaultValue={event?.endTime} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelCls}>Venue Name *</label>
          <input name="venueName" required defaultValue={event?.venueName} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Address</label>
          <input name="address" defaultValue={event?.address} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelCls}>Google Maps Link</label>
          <input name="googleMapUrl" type="url" defaultValue={event?.googleMapUrl} className={inputCls} placeholder="https://maps.google.com/..." />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Entry</label>
          <select name="priceType" defaultValue={event?.priceType || "FREE"} className={inputCls}>
            <option value="FREE">Free</option>
            <option value="PAID">Paid</option>
            <option value="REGISTRATION_REQUIRED">Registration required</option>
            <option value="NOT_ANNOUNCED">Not announced</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className={labelCls}>Registration Link</label>
          <input name="registrationUrl" type="url" defaultValue={event?.registrationUrl} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Website Link</label>
          <input name="officialUrl" type="url" defaultValue={event?.officialUrl} className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Instagram Link</label>
          <input name="instagramUrl" type="url" defaultValue={event?.instagramUrl} className={inputCls} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Poster Image URL (a real poster helps your event publish instantly)</label>
        <input name="posterUrl" type="url" defaultValue={event?.posterUrl} className={inputCls} placeholder="https://..." />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 rounded-xl glow-btn font-extrabold text-xs uppercase tracking-wider text-white"
      >
        {loading ? "Saving..." : event?.id ? "Save Changes" : "Create Event"}
      </button>
    </form>
  );
}
