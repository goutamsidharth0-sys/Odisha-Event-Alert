"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { generateRefCode } from "./refcode";
import { estimateValue } from "./pricing";
import { kitRequestSchema, firstError } from "./validation";
import {
  checkPhoneQuota,
  consumeIpQuota,
  normalisePhone,
  verifyCaptcha,
} from "./guards";
import { templatesForIntent } from "./templates";

// Every response below is deliberately narrow. `estimatedValue` is computed
// here and written to the database, and never appears in a return value — the
// browser must not be able to read what the team thinks the deal is worth.

export interface KitRequestResult {
  ok: boolean;
  error?: string;
  refCode?: string;
  brandId?: string;
  whatsappUrl?: string;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_BRANDLAB_WHATSAPP || "";

function whatsappUrl(refCode: string, businessName: string, itemCount: number): string {
  const message = [
    `Hi First Page, I made a branding kit on Brand Lab.`,
    ``,
    `Business: ${businessName}`,
    `Items: ${itemCount}`,
    `Reference: ${refCode}`,
    ``,
    `Please send me the exact quote.`,
  ].join("\n");

  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}

/**
 * Screen 5. The phone number is captured here — after the renders are visible,
 * never before.
 */
export async function createKitRequestAction(
  raw: unknown
): Promise<KitRequestResult> {
  const parsed = kitRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }
  const input = parsed.data;

  const captcha = await verifyCaptcha(input.captchaToken);
  if (!captcha.allowed) return { ok: false, error: captcha.reason };

  const phone = normalisePhone(input.phone);
  const phoneQuota = await checkPhoneQuota(phone);
  if (!phoneQuota.allowed) return { ok: false, error: phoneQuota.reason };

  const ipQuota = await consumeIpQuota();
  if (!ipQuota.allowed) return { ok: false, error: ipQuota.reason };

  // Recompute the item list server-side. The client sends what it rendered, but
  // the estimate must not be steerable by an edited payload.
  const eligible = new Set(
    templatesForIntent(input.intent, input.businessCategory, input.selectedTemplates).map(
      (t) => t.slug
    )
  );
  const selected = input.selectedTemplates.filter((slug) => eligible.has(slug));
  const estimatedValue = estimateValue(input.intent, selected);

  try {
    const brand = await prisma.brand.create({
      data: {
        businessName: input.businessName,
        phone,
        category: input.businessCategory,
        palette: input.palette,
        orientation: input.orientation,
      },
    });

    // Ref codes are short enough to collide. Retry rather than widen them: they
    // get read aloud on the phone and written on a job card.
    let refCode = generateRefCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await prisma.kitRequest.findUnique({ where: { refCode } });
      if (!clash) break;
      refCode = generateRefCode();
    }

    await prisma.kitRequest.create({
      data: {
        brandId: brand.id,
        refCode,
        intent: input.intent,
        selectedTemplates: selected,
        estimatedValue,
        contactName: input.contactName || null,
        contactEmail: input.contactEmail || null,
      },
    });

    // Renders made before the visitor converted now belong to a real lead, so
    // the 30-day purge should leave them alone.
    await prisma.brandRender.updateMany({
      where: { brandId: brand.id, convertedAt: null },
      data: { convertedAt: new Date() },
    });

    await track("kit_requested", brand.id, {
      intent: input.intent,
      items: selected.length,
      category: input.businessCategory,
    });

    revalidatePath("/admin/dashboard/brandlab");

    return {
      ok: true,
      refCode,
      brandId: brand.id,
      whatsappUrl: whatsappUrl(refCode, input.businessName, selected.length),
    };
  } catch (error) {
    console.error("Brand Lab kit request error:", error);
    return {
      ok: false,
      error: "We could not save your kit just now. Please try again, or message us on WhatsApp.",
    };
  }
}

/** Records the moment the visitor actually opened WhatsApp — the §10 gate metric. */
export async function markWhatsappOpenedAction(refCode: string): Promise<void> {
  try {
    await prisma.kitRequest.updateMany({
      where: { refCode, whatsappOpenedAt: null },
      data: { whatsappOpenedAt: new Date() },
    });
  } catch (error) {
    console.error("Brand Lab whatsapp mark error:", error);
  }
}

/**
 * Funnel instrumentation for the Phase 2 gate (§10): kit completion rate and
 * lead conversion are measured off these rows.
 */
export async function trackEventAction(
  name: string,
  payload?: Record<string, unknown>,
  brandId?: string
): Promise<void> {
  const allowed = new Set([
    "logo_uploaded",
    "analysis_complete",
    "intent_answered",
    "gallery_viewed",
    "item_enlarged",
    "whatsapp_opened",
    "kit_emailed",
  ]);
  if (!allowed.has(name)) return;
  await track(name, brandId, payload);
}

async function track(name: string, brandId?: string, payload?: Record<string, unknown>) {
  try {
    await prisma.brandEvent.create({
      data: {
        name,
        brandId: brandId || null,
        payload: (payload ?? {}) as object,
      },
    });
  } catch (error) {
    console.error("Brand Lab event error:", error);
  }
}
