// Abuse and cost controls (§9).
//
// Phase 1 has zero AI cost, but storage and bandwidth are real, and a lead
// funnel with an open phone-capture endpoint is worth spamming.

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export const KITS_PER_IP_PER_DAY = 5;
export const KITS_PER_PHONE = 3;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

// -------------------------------------------------------------
// Caller identity
// -------------------------------------------------------------

export async function callerIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") || "unknown";
}

/**
 * Salted hash of the IP. Enough to count kits per address, not enough to
 * identify the visitor from the table. Falls back to a build-stable salt so a
 * missing env var degrades to weaker anonymity, never to a broken rate limit.
 */
function hashIp(ip: string): string {
  const salt = process.env.BRANDLAB_IP_SALT || "brandlab-quota";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** Quota days roll over at IST midnight — the audience is entirely in India. */
export function istDay(now = new Date()): string {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

// -------------------------------------------------------------
// Rate limits
// -------------------------------------------------------------

export interface QuotaResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Count this request against the per-IP daily quota.
 *
 * The increment happens before the work, so a request that later fails still
 * consumes quota. That is the right trade for an abuse control: retrying a
 * genuine failure is rare, hammering the endpoint is not.
 */
export async function consumeIpQuota(): Promise<QuotaResult> {
  const key = hashIp(await callerIp());
  const day = istDay();

  try {
    const quota = await prisma.brandLabQuota.upsert({
      where: { key_day: { key, day } },
      create: { key, day, count: 1 },
      update: { count: { increment: 1 } },
    });
    if (quota.count > KITS_PER_IP_PER_DAY) {
      return {
        allowed: false,
        reason: "You have created the maximum number of kits for today. Please try again tomorrow, or message us on WhatsApp.",
      };
    }
    return { allowed: true };
  } catch (error) {
    // Fail OPEN. This gate protects storage cost, not data integrity — a
    // database hiccup must not stop a real buyer from reaching the workshop.
    console.error("Brand Lab IP quota error:", error);
    return { allowed: true };
  }
}

/** 3 kits per phone number, all time. */
export async function checkPhoneQuota(phone: string): Promise<QuotaResult> {
  const normalised = normalisePhone(phone);
  try {
    const used = await prisma.kitRequest.count({
      where: { brand: { phone: normalised } },
    });
    if (used >= KITS_PER_PHONE) {
      return {
        allowed: false,
        reason: "This number already has the maximum number of kits. Message us on WhatsApp and we will pick up from there.",
      };
    }
    return { allowed: true };
  } catch (error) {
    console.error("Brand Lab phone quota error:", error);
    return { allowed: true };
  }
}

/** Store one canonical form so the quota cannot be sidestepped by formatting. */
export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

// -------------------------------------------------------------
// hCaptcha — phone-capture step only (§9)
// -------------------------------------------------------------

export function captchaEnabled(): boolean {
  return Boolean(process.env.HCAPTCHA_SECRET && process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY);
}

/**
 * Verify an hCaptcha token. Skipped entirely when the keys are unset, so the
 * flow runs in development and on a fresh deploy without extra setup.
 */
export async function verifyCaptcha(token: string | undefined): Promise<QuotaResult> {
  const secret = process.env.HCAPTCHA_SECRET;
  if (!secret) return { allowed: true };
  if (!token) return { allowed: false, reason: "Please complete the verification check." };

  try {
    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success
      ? { allowed: true }
      : { allowed: false, reason: "Verification failed. Please try again." };
  } catch (error) {
    // Fail CLOSED: an unreachable captcha service is exactly when abuse is
    // cheapest, and the visitor can retry in a moment.
    console.error("Brand Lab captcha error:", error);
    return { allowed: false, reason: "Verification is unavailable right now. Please try again shortly." };
  }
}
