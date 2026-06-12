"use client";

import React, { useState } from "react";
import { submitEventAction } from "@/lib/actions";
import { Calendar, PlusCircle, CheckCircle2, AlertCircle, Info, Sparkles, MessageCircle } from "lucide-react";

export default function SubmitEventPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await submitEventAction(formData);
      if (res.success) {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(res.error || "Failed to submit event details.");
      }
    } catch (err: any) {
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-pulse">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Event Submitted Successfully!
          </h1>
          <p className="text-sm text-muted max-w-md mx-auto font-semibold leading-relaxed">
            Thank you for listing with Odisha Event Alert! Your submission has been sent to our admin review team. We will verify and publish your event within 4-12 hours.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 space-y-4 max-w-md mx-auto text-left text-xs font-semibold">
          <h4 className="text-white font-bold flex items-center space-x-1.5 border-b border-white/5 pb-2">
            <Sparkles className="w-4 h-4 text-brand-glow" />
            <span>What happens next?</span>
          </h4>
          <ol className="list-decimal pl-4 space-y-2 text-muted">
            <li>Our administrative team reviews the event details & poster layout.</li>
            <li>We cross-reference registration URLs or ticket links for security.</li>
            <li>Once approved, your event immediately goes live on our public discovery pages.</li>
            <li>If you chose any featured promotions, our marketing lead will contact you.</li>
          </ol>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-2.5 rounded-full bg-white text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
          >
            Submit Another Event
          </button>
          <a
            href="https://wa.me/917008181478?text=I%20just%20submitted%20my%20event%20on%20the%20website.%20Could%20you%20please%20verify%20it?"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-2.5 rounded-full border border-white/10 text-ink hover:text-brand-glow font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>WhatsApp Fast Track</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Title */}
      <div className="space-y-2 text-center sm:text-left">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-glow">
          For Event Creators
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
          <PlusCircle className="w-8 h-8 text-brand-accent shrink-0" />
          <span>Submit Your Event</span>
        </h1>
        <p className="text-xs text-muted font-semibold max-w-xl leading-relaxed">
          List your upcoming concerts, college fests, comedy shows, exhibitions, or offers completely free of charge. Grow your local reach across Odisha.
        </p>
      </div>

      {error && (
        <div className="flex items-start space-x-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 font-semibold leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: EVENT DETAILS */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-l-4 border-brand-accent pl-3 flex items-center justify-between">
            <span>1. Event Information</span>
            <span className="text-[10px] text-muted font-bold lowercase tracking-normal">
              * required fields
            </span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-bold text-muted">
            {/* Title */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Event Title *
              </label>
              <input
                type="text"
                name="eventTitle"
                required
                placeholder="e.g. DJ Night featuring DJ Lemon / Skill Bootcamp"
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Category *
              </label>
              <select
                name="category"
                required
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
              >
                <option value="Concerts">Concerts</option>
                <option value="DJ Nights">DJ Nights</option>
                <option value="Comedy">Comedy</option>
                <option value="Food Festivals">Food Festivals</option>
                <option value="College Fests">College Fests</option>
                <option value="Workshops">Workshops</option>
                <option value="Business Events">Business Events</option>
                <option value="Cultural Events">Cultural Events</option>
                <option value="Sports">Sports</option>
                <option value="Fitness & Yoga">Fitness & Yoga</option>
                <option value="Exhibitions">Exhibitions</option>
                <option value="Offers & Sales">Offers & Sales</option>
                <option value="Community & Startup">Community & Startup</option>
              </select>
            </div>

            {/* Classification */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Classification *
              </label>
              <select
                name="organizerType"
                required
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
              >
                <option value="PUBLIC">Public Festival / Expo / Open Event</option>
                <option value="PRIVATE">Private Gig / Concert / DJ Night / Club Party</option>
                <option value="GOVERNMENT">Government Initiative / Govt Supported Event</option>
                <option value="SOCIAL">Community Gathering / Social / Charity / Cleanup</option>
              </select>
            </div>

            {/* Event Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Event Type *
              </label>
              <select
                name="eventType"
                required
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
              >
                <option value="OFFLINE">Offline (In-Person)</option>
                <option value="ONLINE">Online (Webinar / Stream)</option>
                <option value="HYBRID">Hybrid (Both)</option>
              </select>
            </div>

            {/* Short Description */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Short Catchy Summary *
              </label>
              <input
                type="text"
                name="description"
                required
                placeholder="Give a 1-line catchy explanation of what makes this event unique."
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>

            {/* Full description */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Full Event Details & Entry Rules *
              </label>
              <textarea
                name="description_full"
                rows={5}
                placeholder="Enter complete event description: who is performing/speaking, schedule, rules, guidelines, clothing policy, parking, age limits..."
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
              ></textarea>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                required
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                End Date (Optional)
              </label>
              <input
                type="date"
                name="endDate"
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
              />
            </div>

            {/* Start Time */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Start Time *
              </label>
              <input
                type="text"
                name="startTime"
                required
                placeholder="e.g. 06:00 PM / 18:00"
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>

            {/* End Time */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                End Time (Optional)
              </label>
              <input
                type="text"
                name="endTime"
                placeholder="e.g. 10:00 PM"
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>

            {/* Venue Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Venue Name *
              </label>
              <input
                type="text"
                name="venueName"
                required
                placeholder="e.g. Janata Maidan / Utkal Mandap"
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Full Address
              </label>
              <input
                type="text"
                name="address"
                placeholder="e.g. Jayadev Vihar, Chandrasekharpur"
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                City *
              </label>
              <select
                name="city"
                required
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
              >
                <option value="Bhubaneswar">Bhubaneswar</option>
                <option value="Cuttack">Cuttack</option>
                <option value="Puri">Puri</option>
                <option value="Rourkela">Rourkela</option>
                <option value="Sambalpur">Sambalpur</option>
                <option value="Berhampur">Berhampur</option>
                <option value="Balasore">Balasore</option>
                <option value="Angul">Angul</option>
              </select>
            </div>

            {/* Google Maps link */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Google Maps Link
              </label>
              <input
                type="url"
                name="googleMapUrl"
                placeholder="https://maps.google.com/?q=..."
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>

            {/* Price Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Entry Tickets *
              </label>
              <select
                name="priceType"
                required
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
              >
                <option value="FREE">Free Entry</option>
                <option value="PAID">Paid Pass Required</option>
                <option value="REGISTRATION_REQUIRED">Free, but Registration Required</option>
                <option value="NOT_ANNOUNCED">Price TBA / Watchlist</option>
              </select>
            </div>

            {/* Ticket Price */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Ticket Price (INR)
              </label>
              <input
                type="text"
                name="ticketPrice"
                placeholder="e.g. 499 / 999"
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>

            {/* Registration/Booking URL */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Official Booking / Ticket Link
              </label>
              <input
                type="url"
                name="registrationUrl"
                placeholder="https://bookmyshow.com/... or https://townscript.com/..."
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>

            {/* Event Poster URL */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Poster Image Link (Optional)
              </label>
              <input
                type="url"
                name="posterUrl"
                placeholder="Paste an Unsplash or social media image link. A beautiful fallback will be used if left blank."
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: ORGANIZER DETAILS */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-l-4 border-brand-accent pl-3">
            2. Organizer Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-bold text-muted">
            {/* Organizer Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Organizer / Agency Name *
              </label>
              <input
                type="text"
                name="organizerName"
                required
                placeholder="e.g. Standup comedy Cuttack"
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>

            {/* Contact Person */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Contact Person Name
              </label>
              <input
                type="text"
                name="contactPerson"
                placeholder="e.g. Satyabrata Das"
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="e.g. +91 7008181478"
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>

            {/* Whatsapp */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                WhatsApp Number
              </label>
              <input
                type="tel"
                name="whatsapp"
                placeholder="For visitor support and ticket queries"
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="e.g. support@organizer.com"
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>

            {/* Instagram Handle */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-ink">
                Instagram Link / Handle
              </label>
              <input
                type="text"
                name="instagramUrl"
                placeholder="e.g. https://instagram.com/handle"
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: PROMOTION INTEREST */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-l-4 border-brand-accent pl-3">
            3. Promotional Interest (Optional)
          </h2>

          <div className="space-y-4 text-xs font-semibold text-muted">
            <p className="text-[11px] leading-relaxed">
              Would you like to fast-track your event visibility? Select the options you are interested in, and our branding team will get in touch with specialized pricing packages:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { name: "normal", label: "I want normal free event listing" },
                { name: "featured", label: "I want a Featured Placement (Homepage Banner / Top Slider)" },
                { name: "instagram", label: "I want an Instagram Story/Reel promotion package" },
                { name: "ad_banners", label: "I want Banner Ads (Category pages & Sidebar slots)" },
                { name: "full_package", label: "I want the Full Campaign Event Promotion package" },
              ].map((promo) => (
                <label
                  key={promo.name}
                  className="flex items-start space-x-2.5 p-3 rounded-2xl border border-white/5 hover:border-brand-accent/30 bg-slate-900/40 hover:bg-slate-900/80 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="promotionInterest"
                    value={promo.name}
                    className="mt-0.5 rounded accent-brand-accent border-white/15 bg-slate-800"
                  />
                  <span>{promo.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* DECLARATION AND SUBMISSION CTA */}
        <div className="flex flex-col items-center space-y-4 pt-4 text-center">
          <label className="flex items-start space-x-2.5 max-w-xl cursor-pointer text-xs font-semibold text-muted select-none">
            <input
              type="checkbox"
              required
              className="mt-0.5 rounded accent-brand-accent border-white/15 bg-slate-800"
            />
            <span>
              I confirm that the event details provided are accurate, verified, and I have the authority to publish and promote this event on behalf of the organizing agency.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-12 py-4 rounded-full glow-btn font-extrabold text-sm uppercase tracking-wider text-white"
          >
            {loading ? "Submitting Event Details..." : "Submit Event For Review"}
          </button>
        </div>
      </form>
    </div>
  );
}
