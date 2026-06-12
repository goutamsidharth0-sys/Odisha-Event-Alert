import React from "react";
import Link from "next/link";
import { Sparkles, Calendar, Heart, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* Title */}
      <div className="space-y-2 text-center">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-glow">
          Our Mission
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          About Odisha Event Alert
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-muted max-w-xl mx-auto leading-relaxed">
          We are building the ultimate local event discovery network, connecting event organizers and brands directly with active local communities.
        </p>
      </div>

      {/* Main Copy */}
      <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6 text-sm font-semibold text-ink leading-relaxed">
        <h3 className="text-white font-bold text-base flex items-center gap-1.5 border-b border-white/5 pb-2">
          <Calendar className="w-5 h-5 text-brand-accent" />
          <span>Odisha’s Dedicated Event Radar</span>
        </h3>
        <p>
          Founded in 2026, <strong>Odisha Event Alert</strong> was born out of a simple problem: finding upcoming weekend plans, cultural fests, workshops, or exhibitions across cities like Bhubaneswar, Cuttack, Puri, and Rourkela was scattered and difficult. Most events were hidden in social media feeds, local flyers, or niche group chats.
        </p>
        <p>
          We consolidated everything into one fast, mobile-first, and premium discovery portal. Whether you are searching for weekend stand-up comedy shows, massive live concerts at Janata Maidan, regional startup conclaves, traditional Odissi dance recitals, or local sales & mall offers, we track them down and alert you instantly!
        </p>
        <p>
          Our platform does not just list events; we also support organizers, creators, and venues by providing secure listing verification, targeted social promotions, and home-screen ad banners to reach thousands of young, active demographics every day.
        </p>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { icon: Heart, t: "Community First", desc: "Consolidated, highly localized, and easy to use for all age groups." },
          { icon: ShieldCheck, t: "Verified Listings", desc: "Every ticket link, registration source, and date is checked by hand." },
          { icon: Sparkles, t: "Premium Design", desc: "Mobile-first, super-fast loading, zero clunky pop-ups or spammy ads." },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.t} className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 text-brand-glow flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-white leading-tight">{item.t}</h4>
              <p className="text-[11px] font-semibold text-muted leading-normal">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Contact Section */}
      <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
        <h3 className="text-white font-bold text-base border-b border-white/5 pb-2">
          Contact Our Team
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-semibold text-ink">
          <div className="flex items-center space-x-2.5">
            <Mail className="w-4 h-4 text-brand-accent shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-muted tracking-wider">Email Us</span>
              <span>goutamsidharth0@gmail.com</span>
            </div>
          </div>
          <div className="flex items-center space-x-2.5">
            <Phone className="w-4 h-4 text-brand-accent shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-muted tracking-wider">WhatsApp Support</span>
              <span>+91 7008181478</span>
            </div>
          </div>
          <div className="flex items-center space-x-2.5">
            <MapPin className="w-4 h-4 text-brand-accent shrink-0" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-muted tracking-wider">Office Location</span>
              <span>Patia Infocity Square, Bhubaneswar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
