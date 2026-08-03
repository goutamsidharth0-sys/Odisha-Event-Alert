"use client";

/* eslint-disable @next/next/no-img-element -- The logo and artwork are blob:
   and data: URLs generated in this browser session. next/image cannot optimise
   them, and routing them through the image endpoint would upload artwork the
   visitor has not yet consented to share. */

import React from "react";
import { UploadCloud, Camera, AlertTriangle } from "lucide-react";
import { MAX_LOGO_EDGE } from "@/lib/brandlab/analysis";

// Screen 1 — Upload. One drop zone, camera capture on mobile, and a business
// name pre-filled from the filename.

const ACCEPT = "image/png,image/jpeg,image/svg+xml,application/pdf";
const MAX_BYTES = 8 * 1024 * 1024;

interface Props {
  onSubmit: (file: File, businessName: string) => void;
}

/** "kalinga-motors_logo FINAL v2.png" -> "Kalinga Motors" */
export function nameFromFilename(filename: string): string {
  return filename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(logo|final|copy|new|latest|v\d+|\d+x\d+|hi ?res|png|jpe?g|vector)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => (word.length > 2 ? word[0].toUpperCase() + word.slice(1) : word.toUpperCase()))
    .join(" ")
    .slice(0, 60);
}

export default function UploadScreen({ onSubmit }: Props) {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [businessName, setBusinessName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const cameraRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const accept = (incoming: File | undefined | null) => {
    if (!incoming) return;
    setError(null);

    if (incoming.size > MAX_BYTES) {
      setError("That file is over 8 MB. Please upload a smaller version.");
      return;
    }
    if (!ACCEPT.split(",").includes(incoming.type)) {
      setError("Please upload a PNG, JPG, SVG or PDF.");
      return;
    }

    setFile(incoming);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return incoming.type === "application/pdf" ? null : URL.createObjectURL(incoming);
    });
    if (!businessName) setBusinessName(nameFromFilename(incoming.name));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Please choose your logo file first.");
      return;
    }
    if (businessName.trim().length < 2) {
      setError("Please enter your business name.");
      return;
    }
    onSubmit(file, businessName.trim());
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-2xl">
      <p className="fp-eyebrow mb-3">Step 1 of 4 · Upload</p>
      <h1 className="fp-display text-3xl sm:text-4xl mb-3">
        See your brand on everything you actually need.
      </h1>
      <p className="text-[var(--fp-ink-soft)] mb-8 max-w-xl">
        Upload your logo. We will put it on visiting cards, signage, uniforms and more —
        all of it manufactured, delivered and installed by our own workshop in Odisha.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        className="fp-crop border border-dashed p-8 sm:p-12 text-center transition-colors bg-white"
        style={{ borderColor: dragging ? "var(--fp-ink)" : "var(--fp-line)" }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Your logo"
            className="mx-auto max-h-40 object-contain"
          />
        ) : (
          <UploadCloud className="mx-auto h-10 w-10 text-[var(--fp-ink-soft)]" strokeWidth={1.4} />
        )}

        <p className="mt-5 font-medium">
          {file ? file.name : "Drop your logo here"}
        </p>
        <p className="fp-mono mt-1 text-xs text-[var(--fp-ink-soft)]">
          PNG · JPG · SVG · PDF — up to 8 MB
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button type="button" className="fp-btn fp-btn--ghost" onClick={() => inputRef.current?.click()}>
            Choose file
          </button>
          <button
            type="button"
            className="fp-btn fp-btn--ghost sm:hidden"
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="h-4 w-4" /> Use camera
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0])}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0])}
        />
      </div>

      <label className="mt-6 block">
        <span className="fp-eyebrow">Business name</span>
        <input
          className="fp-field mt-2"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g. Kalinga Motors"
          maxLength={120}
        />
      </label>

      {error && (
        <p className="mt-4 flex items-start gap-2 text-sm text-[#b3261e]">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          {error}
        </p>
      )}

      <button type="submit" className="fp-btn mt-6 w-full sm:w-auto" disabled={!file}>
        Build my kit
      </button>

      <p className="fp-mono mt-6 text-[0.68rem] leading-relaxed text-[var(--fp-ink-soft)]">
        Your logo is processed in your browser — it is downscaled to {MAX_LOGO_EDGE}px and stripped of
        camera metadata before anything leaves your device. No account needed.
      </p>
    </form>
  );
}
