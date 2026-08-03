import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MAX_UPLOAD_BYTES } from "@/lib/brandlab/guards";
import { uploadObject, storageEnabled } from "@/lib/brandlab/storage";
import { TEMPLATES_BY_SLUG } from "@/lib/brandlab/templates";

// Artwork upload. A route handler rather than a server action because renders
// are several megabytes and the action body limit is measured in kilobytes.
//
// Nothing here trusts the client beyond the size and type checks below: the
// worst an abusive caller achieves is filling a bucket that the daily IP quota
// already caps and the 30-day purge already empties.

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml", "application/pdf"]);

export async function POST(request: Request) {
  if (!storageEnabled()) {
    // Not an error: Brand Lab is designed to work without storage configured.
    // The renders simply stay in the visitor's browser.
    return NextResponse.json({ ok: true, stored: false });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  const kind = String(form.get("kind") || "");
  const brandId = String(form.get("brandId") || "");
  const templateSlug = String(form.get("templateSlug") || "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file supplied." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "That file is too large." }, { status: 413 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
  }
  if (!["logo", "logo-processed", "render", "kit-pdf"].includes(kind)) {
    return NextResponse.json({ error: "Unknown asset kind." }, { status: 400 });
  }

  const brand = brandId
    ? await prisma.brand.findUnique({ where: { id: brandId }, select: { id: true } }).catch(() => null)
    : null;
  if (brandId && !brand) {
    return NextResponse.json({ error: "Unknown brand." }, { status: 404 });
  }

  const extension = extensionFor(file.type);
  const folder = brand?.id ?? "anonymous";
  const name = kind === "render" && templateSlug ? `${templateSlug}-${Date.now()}` : `${kind}-${Date.now()}`;
  const path = `${folder}/${name}.${extension}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const url = await uploadObject(path, bytes, file.type);
  if (!url) {
    return NextResponse.json({ ok: true, stored: false });
  }

  try {
    if (brand && kind === "logo-processed") {
      await prisma.brand.update({ where: { id: brand.id }, data: { logoProcessedUrl: url } });
    } else if (brand && kind === "logo") {
      await prisma.brand.update({ where: { id: brand.id }, data: { logoOriginalUrl: url } });
    } else if (brand && kind === "render" && templateSlug in TEMPLATES_BY_SLUG) {
      const template = await prisma.mockupTemplate.findUnique({
        where: { slug: templateSlug },
        select: { id: true },
      });
      if (template) {
        await prisma.brandRender.create({
          data: { brandId: brand.id, templateId: template.id, hiresUrl: url },
        });
      }
    }
  } catch (error) {
    console.error("Brand Lab asset record error:", error);
  }

  return NextResponse.json({ ok: true, stored: true, url });
}

function extensionFor(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/svg+xml":
      return "svg";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}
