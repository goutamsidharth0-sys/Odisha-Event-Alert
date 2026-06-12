"use client";

import React, { useState } from "react";
import { submitLeadAction } from "@/lib/actions";
import { Sparkles, MessageCircle, BarChart3, Users, Send, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

export default function AdvertisePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("sourcePage", "advertise_page");

    try {
      const res = await submitLeadAction(formData);
      if (res.success) {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(res.error || "Failed to submit lead details.");
      }
    } catch (err: any) {
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const adProducts = [
    {
      title: "Featured Event Listing",
      description: "Get placed in the high-impact 'Featured Highlights' section right below the homepage hero. Includes glowing borders and priority grid positioning.",
      metric: "5x more details clicks",
    },
    {
      title: "Homepage Hero Banner",
      description: "Huge billboard-style placement at the very top of the homepage. Ideal for major music festivals, celebrity concerts, or product launches.",
      metric: "Top visual real-estate",
    },
    {
      title: "Instagram Promotional Packages",
      description: "Tap into our active social media audiences with custom-crafted Instagram story integrations, collaborative posts, reels, and giveaways.",
      metric: "Direct social engagement",
    },
    {
      title: "WhatsApp Broadcast Campaigns",
      description: "Broadcast your event details, ticket purchase links, and exclusive early-bird promo codes directly to active localized subscriber lists.",
      metric: "Immediate inbox delivery",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* HERO SECTION */}
      <section className="relative text-center py-10 max-w-4xl mx-auto space-y-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-accent/5 filter blur-[80px] -z-10 animate-pulse"></div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-glow">
          Odisha Event Alert Branding
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Promote Your Event & Brand <br />
          Across <span className="bg-gradient-to-r from-brand-accent to-brand-glow bg-clip-text text-transparent glow-text">Odisha</span>
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-muted max-w-xl mx-auto leading-relaxed">
          Connect directly with young, active, and outgoing local demographics in Bhubaneswar, Cuttack, Puri, and other major cities. Generate high-intent bookings and brand inquiries.
        </p>
        <div className="flex justify-center pt-2">
          <a
            href="https://wa.me/917008181478?text=Hello!%20I%20want%20to%20inquire%20about%20sponsorship%20packages%20and%20homepage%20banner%20advertisements%20on%20Odisha%20Event%20Alert."
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-full glow-btn text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-1.5 shadow"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>Chat Branding Lead on WhatsApp</span>
          </a>
        </div>
      </section>

      {/* METRICS & AUDIENCE */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Users, label: "Active Monthly Visitors", val: "50,000+" },
          { icon: BarChart3, label: "Average Detail Page Views", val: "120,000+" },
          { icon: ShieldCheck, label: "Sponsor Conversion Rate", val: "8.4%" },
        ].map((met) => {
          const Icon = met.icon;
          return (
            <div key={met.label} className="glass-panel p-6 rounded-3xl border border-white/5 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/5 text-brand-glow flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">{met.val}</span>
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
                  {met.label}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start pt-4">
        {/* ADVERTISING PACKAGES */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-l-4 border-brand-accent pl-3">
            Our Advertising Products
          </h2>

          <div className="space-y-4">
            {adProducts.map((prod) => (
              <div
                key={prod.title}
                className="p-5 rounded-2xl border border-white/5 bg-slate-900/40 space-y-2 hover:border-brand-accent/20 transition-all shadow"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white">{prod.title}</h4>
                  <span className="bg-brand-accent/10 border border-brand-accent/20 text-brand-glow text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                    {prod.metric}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-muted leading-relaxed">
                  {prod.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* LEAD CAPTURE FORM */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-l-4 border-brand-accent pl-3">
            Request Media Kit & Quotes
          </h2>

          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Inquiry Received Successfully!</h3>
                <p className="text-xs text-muted max-w-sm mx-auto font-semibold leading-relaxed">
                  Thank you! Our advertising lead will analyze your query and email you our complete Media Kit and Pricing Packages within 2 hours.
                </p>
              </div>
              <button
                onClick={() => setSuccess(false)}
                className="px-6 py-2 rounded-full bg-white text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-muted">
              {error && (
                <div className="flex items-start space-x-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 font-semibold leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-ink">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Satyabrata Das"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-ink">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="e.g. support@organizer.com"
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
                  />
                </div>
              </div>

              {/* Company name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-ink">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  placeholder="e.g. Mayfair Hotels / KIIT SAC"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
                />
              </div>

              {/* Lead Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-ink">
                  Inquiry Type *
                </label>
                <select
                  name="leadType"
                  required
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
                >
                  <option value="ADVERTISING">Homepage Banner Advertising</option>
                  <option value="SPONSORSHIP">Event Sponsorship Packages</option>
                  <option value="EVENT_LISTING">Featured Event Listing Fast-Track</option>
                  <option value="PARTNERSHIP">Strategic Media Partnership</option>
                  <option value="GENERAL">General Inquiries</option>
                </select>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-ink">
                  Briefly explain your branding goal *
                </label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="e.g., We have a stand-up comedy show in Bhubaneswar next month and want to run a 2-week Instagram collaboration campaign and get featured on your homepage..."
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
                ></textarea>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full glow-btn font-extrabold text-xs uppercase tracking-wider text-white flex items-center justify-center space-x-1.5 shadow"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4 shrink-0" />
                    <span>Send Inquiry Request</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
