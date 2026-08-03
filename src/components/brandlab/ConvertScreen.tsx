"use client";

import React from "react";
import { MessageCircle, Download, AlertTriangle, Loader2 } from "lucide-react";
import HCaptcha from "./HCaptcha";
import { createKitRequestAction, markWhatsappOpenedAction, trackEventAction } from "@/lib/brandlab/actions";
import type { BrandArt } from "@/lib/brandlab/flatArt";
import type { BusinessCategory, Intent, Orientation, Template } from "@/lib/brandlab/types";

// Screen 5 — Convert.
//
// The phone number is captured here, after the renders are visible, never
// before. Two actions: an exact quote on WhatsApp (primary), or the kit by
// email (secondary).

interface Props {
  art: BrandArt;
  templates: Template[];
  intent: Intent;
  businessCategory: BusinessCategory;
  orientation: Orientation;
  logoCanvas: HTMLCanvasElement;
  svgSource?: string;
  onConverted: (result: { refCode: string; brandId: string }) => void;
}

type Mode = "whatsapp" | "email";

export default function ConvertScreen(props: Props) {
  const { art, templates, intent, businessCategory, orientation } = props;

  const [mode, setMode] = React.useState<Mode>("whatsapp");
  const [phone, setPhone] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [captchaToken, setCaptchaToken] = React.useState<string | undefined>();
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<{ refCode: string; pdfUrl?: string } | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const result = await createKitRequestAction({
        businessName: art.businessName,
        phone,
        businessCategory,
        intent,
        orientation,
        palette: art.palette,
        selectedTemplates: templates.map((t) => t.slug),
        contactName: mode === "email" ? name : undefined,
        contactEmail: mode === "email" ? email : undefined,
        captchaToken,
      });

      if (!result.ok || !result.refCode || !result.brandId) {
        setError(result.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }

      props.onConverted({ refCode: result.refCode, brandId: result.brandId });

      // Renders and the PDF are produced now — after the lead is safely
      // recorded. A slow phone must never cost the lead itself.
      const pdfUrl = await produceArtefacts(props, result.brandId, result.refCode, setProgress);

      setDone({ refCode: result.refCode, pdfUrl });
      setProgress(null);
      setBusy(false);

      if (mode === "whatsapp" && result.whatsappUrl) {
        void markWhatsappOpenedAction(result.refCode);
        void trackEventAction("whatsapp_opened", { intent }, result.brandId);
        window.open(result.whatsappUrl, "_blank", "noopener");
      } else {
        void trackEventAction("kit_emailed", { intent }, result.brandId);
      }
    } catch (caught) {
      console.error(caught);
      setError("Something went wrong. Please try again, or message us on WhatsApp.");
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto w-full max-w-lg text-center">
        <p className="fp-eyebrow mb-3">All set</p>
        <h2 className="fp-display mb-3 text-2xl sm:text-3xl">Your reference is {done.refCode}</h2>
        <p className="mb-8 text-[var(--fp-ink-soft)]">
          Quote the reference on WhatsApp or on the phone and we will pull up exactly
          the kit you just saw. We usually reply the same working day.
        </p>
        {done.pdfUrl && (
          <a className="fp-btn fp-btn--signal" href={done.pdfUrl} download={`${done.refCode}-brand-kit.pdf`}>
            <Download className="h-4 w-4" /> Download your kit PDF
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-lg">
      <p className="fp-eyebrow mb-3">Last step</p>
      <h2 className="fp-display mb-3 text-2xl sm:text-3xl">Get your exact quote</h2>
      <p className="mb-7 text-[var(--fp-ink-soft)]">
        We price from your real sizes and quantities, so the number you get is the number you pay.
      </p>

      <div className="mb-6 flex border" style={{ borderColor: "var(--fp-line)" }}>
        {(
          [
            ["whatsapp", "On WhatsApp"],
            ["email", "By email"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className="flex-1 px-4 py-2.5 text-sm font-medium transition-colors"
            style={{
              background: mode === value ? "var(--fp-ink)" : "transparent",
              color: mode === value ? "var(--fp-paper)" : "var(--fp-ink)",
            }}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="fp-eyebrow">Mobile number</span>
        <input
          className="fp-field mt-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          placeholder="98XXXXXXXX"
          required
        />
      </label>

      {mode === "email" && (
        <>
          <label className="mt-4 block">
            <span className="fp-eyebrow">Your name</span>
            <input
              className="fp-field mt-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </label>
          <label className="mt-4 block">
            <span className="fp-eyebrow">Email</span>
            <input
              className="fp-field mt-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
        </>
      )}

      <HCaptcha onToken={setCaptchaToken} className="mt-5" />

      {error && (
        <p className="mt-4 flex items-start gap-2 text-sm text-[#b3261e]">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          {error}
        </p>
      )}

      <button type="submit" className="fp-btn fp-btn--signal mt-6 w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
        {busy ? progress ?? "Working…" : mode === "whatsapp" ? "Get exact quote on WhatsApp" : "Email me the kit"}
      </button>

      <p className="fp-mono mt-5 text-[0.66rem] leading-relaxed text-[var(--fp-ink-soft)]">
        We use your number to send the quote and nothing else. Indicative visualisation —
        final design and dimensions are confirmed before production.
      </p>
    </form>
  );
}

/**
 * Produce the high-resolution renders and the kit PDF, then hand them to
 * storage.
 *
 * Loaded lazily: pdf-lib and the warp engine are a meaningful chunk of
 * JavaScript, and no visitor needs them before this button is pressed.
 */
async function produceArtefacts(
  props: Props,
  brandId: string,
  refCode: string,
  setProgress: (value: string | null) => void
): Promise<string | undefined> {
  try {
    const [{ renderHiRes }, { buildKitPdf }, { canvasToBlob }] = await Promise.all([
      import("@/lib/brandlab/render"),
      import("@/lib/brandlab/pdf"),
      import("@/lib/brandlab/analysis"),
    ]);

    setProgress("Rendering your artwork…");
    const items: Array<{ template: Template; label: string; png: Uint8Array }> = [];

    for (const template of props.templates) {
      const rendered = await renderHiRes(template, props.art, props.logoCanvas);
      for (const item of rendered) {
        const blob = await canvasToBlob(item.canvas, "image/png");
        items.push({
          template,
          label: item.label,
          png: new Uint8Array(await blob.arrayBuffer()),
        });
        void upload(blob, "render", brandId, template.slug);
      }
    }

    setProgress("Building your PDF…");
    const pdfBytes = await buildKitPdf({
      art: props.art,
      refCode,
      items,
      svgSource: props.svgSource,
    });

    const pdfBlob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    void upload(pdfBlob, "kit-pdf", brandId);
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    // The lead is already saved. Losing the PDF is a downgrade, not a failure.
    console.error("Brand Lab artefact generation failed:", error);
    return undefined;
  }
}

async function upload(blob: Blob, kind: string, brandId: string, templateSlug?: string) {
  try {
    const form = new FormData();
    form.append("file", blob, `${kind}.${blob.type === "application/pdf" ? "pdf" : "png"}`);
    form.append("kind", kind);
    form.append("brandId", brandId);
    if (templateSlug) form.append("templateSlug", templateSlug);
    await fetch("/api/brandlab/asset", { method: "POST", body: form });
  } catch (error) {
    console.error("Brand Lab upload failed:", error);
  }
}
