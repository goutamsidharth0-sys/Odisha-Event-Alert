import React from "react";
import { FileText, HelpCircle, AlertTriangle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Title */}
      <div className="space-y-2 text-center sm:text-left">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-glow">
          Usage Guidelines
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
          <FileText className="w-7 h-7 text-brand-accent shrink-0" />
          <span>Terms & Conditions</span>
        </h1>
        <p className="text-xs text-muted font-semibold">
          Last Updated: May 23, 2026. Review rules for general visitors, organizers, and third-party links.
        </p>
      </div>

      {/* Content */}
      <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6 text-xs sm:text-sm font-semibold text-ink leading-relaxed">
        <h3 className="text-white font-bold text-base flex items-center gap-1.5 border-b border-white/5 pb-2">
          <HelpCircle className="w-5 h-5 text-brand-glow" />
          <span>1. Platform Purpose & Discoverability</span>
        </h3>
        <p>
          <strong>Odisha Event Alert</strong> acts solely as a localized event discovery and listing directory. We are not an event organizing agency, and we do not host or operate the third-party events listed on our platform.
        </p>
        <p>
          General visitors are welcome to browse listings, search and filter occurrences, use direct WhatsApp links to contact organizers, and follow external redirection links to purchase entry tickets.
        </p>

        <h3 className="text-white font-bold text-base flex items-center gap-1.5 border-b border-white/5 pb-2 pt-4">
          <AlertTriangle className="w-5 h-5 text-brand-glow" />
          <span>2. Ticket Purchases & External Links</span>
        </h3>
        <p>
          Any ticketing link, booking button, or registration gateway redirected from our pages (e.g. to BookMyShow, Townscript, or an external website) is operated entirely by third-party services:
        </p>
        <ul className="list-disc pl-4 space-y-2 text-muted">
          <li>Odisha Event Alert has <strong>NO</strong> role in transaction execution, payment processing, invoice generation, or ticket inventory management.</li>
          <li>We are not liable for transaction failures, booking errors, overcharging, refunds, or financial disputes. All such support requests must be directed to the third-party platform or official event organizer.</li>
        </ul>

        <h3 className="text-white font-bold text-base border-b border-white/5 pb-2 pt-4">
          <span>3. Organizer Responsibilities & Content Removal</span>
        </h3>
        <p>
          When submitting an event on our `/submit-event` page, organizers represent that:
        </p>
        <ul className="list-disc pl-4 space-y-2 text-muted">
          <li>All event details (timings, artists, pricing, guidelines) are 100% accurate and legal.</li>
          <li>They possess the required government clearances, security permissions, and licensing to host the event.</li>
          <li>They will immediately notify our administrative team if the event gets cancelled, rescheduled, or postponed.</li>
        </ul>
        <p>
          We reserve absolute authority to approve, edit, reject, delete, or mark any submitted event as a "Watchlist/Expected" teaser based on internal safety guidelines, duplicate detection, and visual quality.
        </p>
      </div>
    </div>
  );
}
