# First Page — Brand Lab (Phase 1)

An AI-assisted branding visualiser at [`/brandlab`](../../src/app/brandlab). A
visitor uploads a logo, sees their own branding rendered across a 13-item kit,
and hands over a phone number **after** the renders are on screen.

Brand Lab is not a design SaaS. It is a lead-generation and quoting funnel for a
manufacturing business, and every decision below follows from that.

## The core technical principle

> **AI generates the scene. Code composites the asset.**

In Phase 1 there is no image generation at all. Every render is:

```
real photograph (base) + perspective-warped client logo + shading map (multiply)
```

The "smart object" technique, executed in browser canvas. Photoreal results at
zero marginal cost, with a pixel-perfect logo.

## The five screens

| Screen | What happens | Where |
| --- | --- | --- |
| 1. Upload | PNG/JPG/SVG/PDF, camera capture on mobile, business name pre-filled from the filename | `components/brandlab/UploadScreen.tsx` |
| 2. Auto-analysis | Background removal, k-means palette, orientation — all client-side, no server call | `lib/brandlab/analysis.ts` |
| 3. Intent | Max 3 taps: what you need, what kind of business, (optionally) which items | `components/brandlab/IntentScreen.tsx` |
| 4. The Kit | Full-bleed gallery, the client's logo and colours on every item. **No prices** | `components/brandlab/KitScreen.tsx` |
| 5. Convert | WhatsApp with a reference code, or the kit by email. Phone captured here | `components/brandlab/ConvertScreen.tsx` |

No price is shown on screen anywhere. A displayed price destroys the anchoring
sequence used on WhatsApp and invites competitor comparison before value is
established. Each item carries a spec line instead — "Glow signboard · ACP + LED
· 8ft × 3ft".

## Rendering

Two paths, both entirely in the browser.

**Type A — flat vector (7 items).** Pure SVG with a defined logo slot
(`lib/brandlab/flatArt.ts`). One generator serves three outputs: the gallery
preview, a 300 DPI raster, and a true-size PDF page. When the visitor uploads an
SVG, the logo is redrawn in the PDF as **actual vector paths** rather than a
raster placement.

**Type B — photoreal composite (6 items).** A DOM layer over the base
photograph, positioned with a CSS `matrix3d` derived from the template quad,
with the shading map overlaid using `mix-blend-mode: multiply`. CSS `matrix3d`
*is* a projective transform, so the preview costs nothing — no WebGL, no
library, no server call. The high-resolution export redoes the same composition
on an offscreen canvas with an exact inverse-mapped warp
(`lib/brandlab/render.ts`).

Deliberately not server-side: `sharp` cannot do perspective distortion, and
pulling ImageMagick or a native canvas binding onto Vercel adds cost, cold
starts and a class of bugs with no offsetting benefit at this stage.

> **The six photo templates currently ship with illustrative stand-in artwork.**
> See [ASSET-SHOOT.md](./ASSET-SHOOT.md) — the real photographs drop in with no
> code changes, and the shoot is the critical path.

## Internal lead scoring

`KitRequest.estimatedValue` is computed from the selected templates × their unit
rates so the team can sort the inbox by deal size and call the ₹80,000 signage
lead before the ₹1,200 visiting-card lead.

It never reaches the browser. Two mechanisms enforce that:

- the server action returns only `{ refCode, brandId, whatsappUrl }`;
- the rate card lives in `lib/brandlab/rates.ts`, which is **server-only** and
  throws if it is ever pulled into a browser bundle. `templates.ts` is imported
  by client components, so it carries only the client-safe spec line fields.

The admin inbox is at `/admin/dashboard/brandlab`, sorted by value, with the
Phase 2 gate metrics across the top.

## Abuse and cost controls

Zero AI cost in Phase 1, but storage and bandwidth are real.

- 5 kits per IP per day (the IP is stored only as a salted hash), 3 per phone number
- EXIF stripped — every upload is re-encoded through a canvas before it leaves the device
- Uploads capped at 8 MB and downscaled to 1400px on the client
- hCaptcha on the phone-capture step only (skipped when the keys are unset)
- Unconverted renders purged after 30 days by `/api/cron/brandlab-purge`

## Configuration

Everything is optional. With nothing configured, Brand Lab still runs end to
end — renders live in the browser and the lead still reaches the inbox; it just
cannot keep a copy of the artwork.

| Variable | Effect when unset |
| --- | --- |
| `NEXT_PUBLIC_BRANDLAB_WHATSAPP` | The WhatsApp handoff opens `wa.me` with no recipient |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | Renders and the kit PDF are not stored; the visitor still gets their download |
| `NEXT_PUBLIC_HCAPTCHA_SITEKEY`, `HCAPTCHA_SECRET` | The captcha step is skipped entirely |
| `BRANDLAB_IP_SALT` | The per-IP quota still works, with weaker anonymity |

After a deploy that changes the template library, run:

```bash
npm run db:seed:brandlab
```

## The Phase 2 gate

Storefront reimagining does not get built until Phase 1 clears (spec §10):

- kit completion rate (upload → gallery viewed) ≥ 60%
- lead conversion (gallery viewed → WhatsApp opened) ≥ 20%
- ≥ 40 qualified leads in the first 30 days
- ≥ ₹1,50,000 closed revenue attributable to Brand Lab in the first 60 days

The first three are instrumented off `BrandEvent` and shown live at the top of
the admin inbox. The fourth is a finance number and stays manual.

If Phase 1 does not convert with zero AI cost, Phase 2 will not convert with AI
cost added.

## Deliberately out of scope

User accounts, payments, design editing tools, AI image generation, and anything
serving customers outside Odisha. Each turns a focused lead funnel into a
product with a support burden.
