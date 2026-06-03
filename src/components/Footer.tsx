"use client";

import React, { useState } from "react";
import Link from "next/link";
import { subscribeAction } from "@/lib/actions";
import { Calendar, Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await subscribeAction(email);
      if (res.success) {
        setStatus({ type: "success", message: res.message || "Subscribed successfully!" });
        setEmail("");
      } else {
        setStatus({ type: "error", message: res.error || "Subscription failed." });
      }
    } catch (err) {
      setStatus({ type: "error", message: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: "Concerts", href: "/events?category=concerts" },
    { name: "DJ Nights", href: "/events?category=dj-nights" },
    { name: "Comedy Shows", href: "/events?category=comedy" },
    { name: "Food Festivals", href: "/events?category=food-festivals" },
    { name: "Workshops", href: "/events?category=workshops" },
  ];

  const cities = [
    { name: "Bhubaneswar", href: "/events?city=bhubaneswar" },
    { name: "Cuttack", href: "/events?city=cuttack" },
    { name: "Puri", href: "/events?city=puri" },
    { name: "Rourkela", href: "/events?city=rourkela" },
    { name: "Sambalpur", href: "/events?city=sambalpur" },
  ];

  const quickLinks = [
    { name: "Submit Your Event", href: "/submit-event" },
    { name: "Advertise With Us", href: "/advertise" },
    { name: "About Us", href: "/about" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
  ];

  return (
    <footer className="relative z-10 bg-slate-950 border-t border-white/10 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-accent to-brand-glow text-white shadow shadow-brand-accent/20">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Odisha Event Alert
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Odisha’s dedicated event radar for concerts, workshops, expos, college fests, comedy shows, cultural events, food festivals, sports activities, and everything happening around you.
            </p>
            <div className="flex space-x-3 pt-2">
              <a
                href="https://instagram.com/odishaeventalert"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-brand-glow hover:border-brand-accent/40 bg-slate-900/60 transition-colors"
              >
                <svg className="w-4 h-4 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://facebook.com/odishaeventalert"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-brand-glow hover:border-brand-accent/40 bg-slate-900/60 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                </svg>
              </a>
              <a
                href="mailto:contact@odishaeventalert.com"
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-brand-glow hover:border-brand-accent/40 bg-slate-900/60 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-4 border-l-2 border-brand-accent pl-2">
              Quick Links
            </h3>
            <ul className="space-y-2 text-xs font-semibold text-slate-400">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-4 border-l-2 border-brand-accent pl-2">
              Explore Odisha
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
                  Categories
                </span>
                <ul className="space-y-2 text-xs font-semibold text-slate-400">
                  {categories.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="hover:text-white transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
                  Cities
                </span>
                <ul className="space-y-2 text-xs font-semibold text-slate-400">
                  {cities.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="hover:text-white transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-4 border-l-2 border-brand-accent pl-2">
              Stay Alerted
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold mb-4">
              Subscribe to get immediate alerts for the coolest upcoming fests, concerts, and offers in your city!
            </p>
            <form onSubmit={handleSubscribe} className="relative flex items-center">
              <input
                type="email"
                placeholder="Enter your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-full px-4 py-2.5 pr-12 text-xs text-white focus:outline-none focus:border-brand-accent/50 transition-colors font-semibold"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-1 w-9 h-9 rounded-full bg-gradient-to-tr from-brand-accent to-brand-glow text-white flex items-center justify-center hover:scale-105 transition-transform duration-200"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </form>

            {status && (
              <div
                className={`mt-3 flex items-start space-x-2 text-[11px] font-semibold ${
                  status.type === "success" ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {status.type === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <span>{status.message}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-semibold text-slate-500">
          <p>© {new Date().getFullYear()} Odisha Event Alert. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">
              Terms
            </Link>
            <Link href="/admin/login" className="hover:text-slate-400 transition-colors border-l border-white/10 pl-4">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
