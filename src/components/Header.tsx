"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, MapPin, Menu, X, PlusCircle } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Explore Events", href: "/events" },
    { name: "Advertise", href: "/advertise" },
    { name: "About", href: "/about" },
  ];

  const goToCity = (slug: string) => {
    setMobileMenuOpen(false);
    router.push(slug ? `/events?city=${slug}` : "/events");
  };

  return (
    <header
      className="sticky top-0 z-50 w-full transition-all duration-300 border-b"
      style={{
        background: scrolled ? "var(--nav-bg)" : "transparent",
        borderColor: scrolled ? "var(--card-line)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : undefined,
        WebkitBackdropFilter: scrolled ? "blur(16px)" : undefined,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-icon.png"
              alt="Odisha Event Alert logo"
              width={48}
              height={40}
              className="h-9 w-auto group-hover:scale-105 transition-transform"
            />
            <span className="flex flex-col">
              <span className="font-display font-bold text-lg leading-none tracking-tight text-ink">
                Odisha <b className="text-brand-accent">Event</b> Alert
              </span>
              <span className="text-[9px] text-muted font-mono tracking-[0.18em] uppercase mt-0.5 hidden sm:block">
                Your Odisha Event Radar
              </span>
            </span>
          </Link>

          {/* Inline search (desktop) */}
          <form action="/events" className="hidden lg:block flex-1 max-w-sm relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              name="search"
              placeholder="Search events, venues…"
              autoComplete="off"
              className="w-full rounded-xl border text-sm py-2.5 pl-10 pr-4 text-ink placeholder:text-muted focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
              style={{ background: "var(--chip)", borderColor: "var(--card-line)" }}
            />
          </form>

          <div className="flex-1 lg:hidden" />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors hover:text-brand-accent ${
                    isActive ? "text-brand-accent font-bold" : "text-ink"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* City Selector */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-accent pointer-events-none" />
              <select
                aria-label="Select city"
                defaultValue=""
                onChange={(e) => goToCity(e.target.value)}
                className="appearance-none rounded-full border text-xs font-bold py-2 pl-8 pr-4 text-ink cursor-pointer focus:outline-none focus:border-brand-accent"
                style={{ background: "var(--chip)", borderColor: "var(--card-line)" }}
              >
                {CITIES.map((city) => (
                  <option key={city.name} value={city.slug}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            <Link
              href="/submit-event"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full glow-btn text-xs font-bold text-white uppercase tracking-wider font-display"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Your Event</span>
            </Link>

            <ThemeToggle />
          </nav>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2.5">
            <Link
              href="/submit-event"
              aria-label="Submit your event"
              className="p-2 rounded-xl glow-btn text-white"
            >
              <PlusCircle className="w-5 h-5" />
            </Link>
            <ThemeToggle />
            <button
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border text-ink"
              style={{ background: "var(--chip)", borderColor: "var(--card-line)" }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-b px-4 pt-3 pb-6 space-y-3 backdrop-blur-xl"
          style={{ background: "var(--nav-bg)", borderColor: "var(--card-line)" }}
        >
          <form action="/events" className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              name="search"
              placeholder="Search events, venues…"
              autoComplete="off"
              className="w-full rounded-xl border text-sm py-2.5 pl-10 pr-4 text-ink placeholder:text-muted focus:outline-none focus:border-brand-accent"
              style={{ background: "var(--chip)", borderColor: "var(--card-line)" }}
            />
          </form>

          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                  isActive
                    ? "bg-brand-accent/15 text-brand-accent border-l-4 border-brand-accent"
                    : "text-ink hover:bg-brand-accent/5"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <div className="pt-3 border-t" style={{ borderColor: "var(--card-line)" }}>
            <span className="block px-4 text-xs font-mono font-bold uppercase tracking-[0.18em] text-muted mb-2">
              Select City
            </span>
            <div className="grid grid-cols-2 gap-2 px-2">
              {CITIES.map((city) => (
                <button
                  key={city.name}
                  onClick={() => goToCity(city.slug)}
                  className="px-3 py-2 text-xs font-semibold rounded-lg text-left text-ink transition-colors hover:bg-brand-accent/10"
                  style={{ background: "var(--chip)" }}
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
