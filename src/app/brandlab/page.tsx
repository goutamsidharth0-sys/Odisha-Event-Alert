import type { Metadata } from "next";
import Link from "next/link";
import BrandLabApp from "@/components/brandlab/BrandLabApp";
import "./brandlab.css";

// Brand Lab lives at /brandlab as a section of the main site, not a separate
// brand or entity (§8).

export const metadata: Metadata = {
  title: "Brand Lab — see your logo on everything, before you order | First Page",
  description:
    "Upload your logo and see your branding on visiting cards, signage, uniforms, standees and vehicles in seconds. Manufactured, delivered and installed across Bhubaneswar, Cuttack and Puri.",
  alternates: { canonical: "/brandlab" },
  openGraph: {
    title: "Brand Lab — see your branding before you order",
    description:
      "Upload your logo. See it on 13 items your business actually needs — made and installed in Odisha.",
    url: "/brandlab",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function BrandLabPage() {
  return (
    <main className="brandlab">
      <header className="border-b" style={{ borderColor: "var(--fp-line)" }}>
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="fp-reg" aria-hidden />
            <span>
              <span className="fp-display block text-sm leading-tight">FIRST PAGE</span>
              <span className="fp-mono block text-[0.6rem] tracking-[0.18em] text-[var(--fp-ink-soft)]">
                BRAND LAB
              </span>
            </span>
          </div>
          <Link
            href="/"
            className="fp-mono text-[0.68rem] uppercase tracking-[0.18em] text-[var(--fp-ink-soft)] hover:text-[var(--fp-ink)]"
          >
            Back to site
          </Link>
        </div>
      </header>

      <BrandLabApp />

      <footer className="border-t" style={{ borderColor: "var(--fp-line)" }}>
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
          <p className="fp-mono text-[0.66rem] leading-relaxed text-[var(--fp-ink-soft)]">
            Every mockup shown corresponds to something our workshop can physically produce.
            Flex, ACP, laser-cut, neon and iron frame fabrication, delivered and installed
            across Bhubaneswar, Cuttack and Puri — usually within the same week.
          </p>
        </div>
      </footer>
    </main>
  );
}
