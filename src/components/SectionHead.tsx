import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  icon: React.ElementType;
  title: string;
  sub?: string;
  href?: string;
  linkText?: string;
}

export default function SectionHead({ icon: Icon, title, sub, href, linkText }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-card-line pb-4 mb-6">
      <div className="space-y-1">
        <h2 className="text-lg font-display font-bold text-ink tracking-tight flex items-center gap-2">
          <Icon className="w-5 h-5 text-brand-accent shrink-0" />
          <span>{title}</span>
        </h2>
        {sub && <p className="text-[11px] font-semibold text-muted">{sub}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="text-xs font-bold text-brand-accent hover:text-brand-glow flex items-center gap-1 shrink-0 group"
        >
          <span>{linkText || "View all"}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}
