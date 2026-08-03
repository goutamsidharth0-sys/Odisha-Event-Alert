import React from "react";
import { prisma } from "@/lib/db";
import BrandLabInboxClient from "./BrandLabInboxClient";
import { valueBand } from "@/lib/brandlab/format";
import { TEMPLATES_BY_SLUG } from "@/lib/brandlab/templates";

// The Brand Lab inbox, sorted by deal size by default.
//
// This is the whole point of `estimatedValue`: the team should call the
// Rs 80,000 signage lead before the Rs 1,200 visiting-card lead, and the inbox
// should make that ordering the path of least resistance.

export const dynamic = "force-dynamic";

export default async function BrandLabInboxPage() {
  const [requests, funnel] = await Promise.all([
    prisma.kitRequest.findMany({
      orderBy: [{ status: "asc" }, { estimatedValue: "desc" }],
      include: {
        brand: {
          select: {
            businessName: true,
            phone: true,
            category: true,
            orientation: true,
            palette: true,
            logoProcessedUrl: true,
            renders: { select: { hiresUrl: true }, take: 6 },
          },
        },
      },
      take: 300,
    }),
    countFunnel(),
  ]);

  const rows = requests.map((request) => ({
    id: request.id,
    refCode: request.refCode,
    intent: request.intent,
    status: request.status,
    estimatedValue: request.estimatedValue ?? 0,
    band: valueBand(request.estimatedValue ?? 0),
    items: request.selectedTemplates.map(
      (slug) => TEMPLATES_BY_SLUG[slug]?.name ?? slug
    ),
    contactName: request.contactName,
    contactEmail: request.contactEmail,
    adminNotes: request.adminNotes,
    whatsappOpenedAt: request.whatsappOpenedAt?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    businessName: request.brand.businessName,
    phone: request.brand.phone,
    category: request.brand.category,
    logoUrl: request.brand.logoProcessedUrl,
    renderUrls: request.brand.renders.map((r) => r.hiresUrl).filter((u): u is string => Boolean(u)),
  }));

  return <BrandLabInboxClient rows={rows} funnel={funnel} />;
}

/**
 * The Phase 2 gate metrics (§10), measured off the event log:
 * kit completion rate = gallery viewed / logo uploaded
 * lead conversion     = whatsapp opened / gallery viewed
 */
async function countFunnel() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const where = { createdAt: { gte: since } };

  const [uploaded, viewed, opened, qualified] = await Promise.all([
    prisma.brandEvent.count({ where: { ...where, name: "logo_uploaded" } }),
    prisma.brandEvent.count({ where: { ...where, name: "gallery_viewed" } }),
    prisma.brandEvent.count({ where: { ...where, name: "whatsapp_opened" } }),
    prisma.kitRequest.count({ where }),
  ]);

  return {
    uploaded,
    viewed,
    opened,
    qualified,
    completionRate: uploaded ? viewed / uploaded : 0,
    conversionRate: viewed ? opened / viewed : 0,
  };
}
