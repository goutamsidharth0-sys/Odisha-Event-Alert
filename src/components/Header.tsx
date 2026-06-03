"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Search, MapPin, Menu, X, PlusCircle, Sparkles } from "lucide-react";

const CITIES = [
  { name: "All Odisha", slug: "" },
  { name: "Bhubaneswar", slug: "bhubaneswar" },
  { name: "Cuttack", slug: "cuttack" },
  { name: "Puri", slug: "puri" },
  { name: "Rourkela", slug: "rourkela" },
  { name: "Sambalpur", slug: "sambalpur" },
  { name: "Berhampur", slug: "berhampur" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedCity, setSelectedCity] = useState("All Odisha");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Explore Events", href: "/events" },
    { name: "Submit Event", href: "/submit-event" },
    { name: "Advertise", href: "/advertise" },
    { name: "About Us", href: "/about" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-slate-950/75 backdrop-blur-md border-b border-white/10 shadow-lg"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-accent to-brand-glow text-white shadow-md shadow-brand-accent/20 group-hover:scale-105 transition-transform duration-200">
                <Calendar className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-glow"></span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-glow bg-clip-text text-transparent">
                  Odisha Event Alert
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase flex items-center gap-0.5">
                  Your Event Radar <Sparkles className="w-2 h-2 text-brand-glow" />
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-semibold transition-all duration-200 hover:text-brand-glow ${
                    isActive ? "text-brand-accent font-bold" : "text-slate-300"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* City Selector */}
            <div className="relative">
              <button
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-slate-900/60 hover:bg-slate-900 text-xs font-bold text-slate-200 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-accent" />
                <span>{selectedCity}</span>
              </button>
              {cityDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-xl py-2 z-50">
                  {CITIES.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => {
                        setSelectedCity(city.name);
                        setCityDropdownOpen(false);
                        // Redirect to events with city filter
                        window.location.href = city.slug ? `/events?city=${city.slug}` : "/events";
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Event Button */}
            <Link
              href="/submit-event"
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-full glow-btn text-xs font-bold text-white uppercase tracking-wider"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Your Event</span>
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            <Link
              href="/submit-event"
              className="p-2 rounded-xl bg-gradient-to-tr from-brand-accent to-brand-glow text-white shadow"
            >
              <PlusCircle className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-white/10 bg-slate-900/60 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-white/10 px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-base font-semibold hover:bg-white/5 ${
                  isActive ? "bg-brand-accent/15 text-brand-glow border-l-4 border-brand-accent" : "text-slate-300"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <div className="border-t border-white/5 pt-4">
            <span className="block px-4 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select City
            </span>
            <div className="grid grid-cols-2 gap-2 px-2">
              {CITIES.map((city) => (
                <button
                  key={city.name}
                  onClick={() => {
                    setSelectedCity(city.name);
                    setMobileMenuOpen(false);
                    window.location.href = city.slug ? `/events?city=${city.slug}` : "/events";
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors ${
                    selectedCity === city.name ? "bg-brand-accent/20 text-brand-glow" : "bg-slate-900/60 text-slate-300"
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
