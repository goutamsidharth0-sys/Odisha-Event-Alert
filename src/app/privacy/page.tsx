import React from "react";
import { Shield, Lock, Eye } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Title */}
      <div className="space-y-2 text-center sm:text-left">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-glow">
          Legal Policy
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
          <Shield className="w-7 h-7 text-brand-accent shrink-0" />
          <span>Privacy Policy</span>
        </h1>
        <p className="text-xs text-muted font-semibold">
          Last Updated: May 23, 2026. Review how Odisha Event Alert protects visitor and organizer data.
        </p>
      </div>

      {/* Content */}
      <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6 text-xs sm:text-sm font-semibold text-ink leading-relaxed">
        <h3 className="text-white font-bold text-base flex items-center gap-1.5 border-b border-white/5 pb-2">
          <Lock className="w-5 h-5 text-brand-glow" />
          <span>1. Information We Collect</span>
        </h3>
        <p>
          At Odisha Event Alert, we value your privacy. We collect very limited personal information required to facilitate platform services:
        </p>
        <ul className="list-disc pl-4 space-y-2 text-muted">
          <li><strong>For General Visitors:</strong> We track anonymous metrics (homepage visits, event views, link clicks) using tools like Google Analytics and Microsoft Clarity to optimize speeds. We do not track absolute geographical locations.</li>
          <li><strong>For Newsletter Subscribers:</strong> We collect your email address, city, and category interests solely to broadcast upcoming event alerts.</li>
          <li><strong>For Event Submissions:</strong> We collect organizer contact names, phone numbers, email addresses, and social handles required to verify details and list support resources on event pages.</li>
          <li><strong>For Branding Leads:</strong> We collect company details, email, and requirements to generate custom sponsorship media proposals.</li>
        </ul>

        <h3 className="text-white font-bold text-base flex items-center gap-1.5 border-b border-white/5 pb-2 pt-4">
          <Eye className="w-5 h-5 text-brand-glow" />
          <span>2. How We Protect & Share Data</span>
        </h3>
        <p>
          Your information is stored inside secure, local database servers equipped with prepared queries to prevent SQL injections.
        </p>
        <ul className="list-disc pl-4 space-y-2 text-muted">
          <li>We <strong>NEVER</strong> sell or rent subscriber databases or organizer numbers to third-party data brokers or marketing agencies.</li>
          <li>Event information (venues, timings, posters) is displayed publicly for community discoverability. Any organizer phone number supplied for 'Visitor Inquiries' will be made public on the event detail page.</li>
          <li>Cookies are used strictly to maintain secure, HTTP-only administrator panel sessions and basic Google Analytics analytics tracking.</li>
        </ul>

        <h3 className="text-white font-bold text-base border-b border-white/5 pb-2 pt-4">
          <span>3. User Rights & Contact</span>
        </h3>
        <p>
          Under local privacy regulations, you have full authority to request data extraction or absolute erasure:
        </p>
        <p>
          If you wish to unsubscribe from our newsletter, remove your organizer details from a listed page, or report unauthorized event listings, please contact our privacy lead immediately at <strong>privacy@odishaeventalert.com</strong>.
        </p>
      </div>
    </div>
  );
}
