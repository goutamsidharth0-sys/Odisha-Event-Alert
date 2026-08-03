# Brand Lab — Type B asset shoot

> **Status: not yet shot.** The six photo templates currently ship with
> illustrative stand-in artwork (`assetStatus: "illustrative"` in
> `src/lib/brandlab/templates.ts`). The composite engine, quads, shading maps
> and print specs are real — only the photographs are placeholders.

The build spec is blunt about this, and it is right: **the critical path is the
asset shoot, not the code.** Everything in the photo-composite half of the
gallery is blocked until these files exist. Book the photography first.

A canopy photographed at a real Bhubaneswar event and a shopfront on Janpath
will out-convert generic global stock mockups by a wide margin, and a competitor
cannot copy them without doing the same work. That is the moat — not the
software.

## What each template needs

Every Type B template is four files plus two numbers:

| Artefact | Notes |
| --- | --- |
| **Base photograph** | The product with its logo surface **blank**. Shoot the surface clean — white, grey or the real material with no branding on it. |
| **Grayscale shading map** | White everywhere *except* the logo surface, where it carries the folds, gloss and shadow of that surface. Multiplied over the composite. |
| **Four-point quad** | The logo surface corners in image pixel coordinates, ordered **TL, TR, BR, BL**. |
| **Safe-area polygon** | Optional. The region inside the quad that must stay clear of trim or curvature. |
| **Print spec** | Material, default size, and the internal unit rate (the rate lives in `src/lib/brandlab/rates.ts`, server-side only). |

The shading map is the piece people get wrong. It is **not** a copy of the
photograph in grayscale — that would darken the scene twice, because the base
photograph already carries its own lighting. It is a white image with lighting
information painted **only inside the logo surface**. Multiply blend then
applies that lighting to the blank surface and to the client's logo together,
which is what makes the logo look printed on rather than pasted over.

## Shot list

Six surfaces, controlled lighting, blank logo areas.

| Template | Slug | Shot |
| --- | --- | --- |
| Umbrella | `umbrella` | 42in 8-panel umbrella, open, front-on. One gore centred and unobstructed. |
| Canopy / gazebo | `canopy` | 10ft x 10ft gazebo, straight-on, full valance band visible edge to edge. |
| Flex standee | `flex-standee` | 3ft x 6ft roll-up, straight-on, slight three-quarter is fine. Whole banner in frame. |
| Glow signboard | `glow-signboard` | Real Bhubaneswar shopfront at dusk, board blank. Shoot from across the road. |
| Staff uniform | `staff-uniform` | Plain t-shirt flat-lay or on a form, left chest area clean and evenly lit. |
| Delivery vehicle | `vehicle-sticker` | Van or tempo, side-on, full load panel visible and unbranded. |

Shoot at **1600 x 1200 or larger**, 4:3. The gallery tiles are 4:3 and the
templates declare `baseSize` in this ratio; a different aspect works but the
quad and `baseSize` must be updated together.

## Producing the quad

The quad is in the base image's own pixel coordinates, so it is independent of
how the tile is sized on screen. To read it off a photograph:

1. Open the base image at 100% in any editor with a pixel readout.
2. Note the four corners of the logo surface in **TL, TR, BR, BL** order.
3. Paste them into the template's `quad` field.

The engine fits the client's logo inside that quad preserving aspect ratio
(`fitQuad` in `src/lib/brandlab/homography.ts`), so the quad should describe the
**whole usable surface**, not a logo-shaped box inside it.

## Dropping the real photographs in

No code changes. For each template in `src/lib/brandlab/templates.ts`:

1. Put the files in `public/brandlab/templates/` — e.g. `umbrella-base.jpg` and
   `umbrella-shading.png`.
2. Update `baseImageUrl` and `shadingMapUrl`.
3. Update `baseSize` to the photograph's real pixel size.
4. Update `quad` from the new photograph.
5. Change `assetStatus` from `"illustrative"` to `"photograph"`.
6. Run `npm run db:seed:brandlab` to sync the `MockupTemplate` rows.

Verify by loading `/brandlab`, uploading a wide logo and a tall logo, and
checking both sit correctly on the surface. A logo that looks stretched means
the quad corners are out of order; a logo that floats off the surface means the
quad is in the wrong coordinate space.

## Why the logo is never generated

Phase 1 does no image generation at all, and Phase 2 will generate the scene but
still composite the logo in code. Image models cannot reproduce a mark or a
company name accurately, and a mangled logo on screen kills the sale at the exact
moment of highest intent. Every render here is:

```
real photograph (base) + perspective-warped client logo + shading map (multiply)
```

Pixel-perfect logo, photoreal result, zero marginal cost.
