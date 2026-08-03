import { z } from "zod";
import { TEMPLATES_BY_SLUG } from "./templates";

// Server-action boundary for Brand Lab. Everything below arrives from an
// unauthenticated visitor, so it is validated before it reaches the database.

const hexColour = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Invalid colour.")
  .catch("#111111");

export const paletteSchema = z.object({
  primary: hexColour,
  secondary: hexColour,
  ink: hexColour,
  paper: hexColour,
});

const templateSlug = z.string().trim().refine((slug) => slug in TEMPLATES_BY_SLUG, {
  message: "Unknown template.",
});

export const kitRequestSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Please enter your business name.")
    .max(120, "That business name is too long."),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?91[\s-]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  businessCategory: z.enum(["retail", "office", "restaurant", "clinic", "education", "other"]),
  intent: z.enum(["full_kit", "few_items", "storefront", "interior"]),
  orientation: z.enum(["horizontal", "square", "vertical"]),
  palette: paletteSchema,
  selectedTemplates: z.array(templateSlug).max(13, "Too many items selected."),
  contactName: z.string().trim().max(120).optional(),
  contactEmail: z.union([z.string().trim().email("Enter a valid email address."), z.literal("")]).optional(),
  captchaToken: z.string().trim().max(4000).optional(),
});

export type KitRequestInput = z.infer<typeof kitRequestSchema>;

export const kitAssetSchema = z.object({
  refCode: z.string().trim().regex(/^FP-[A-Z0-9]{4}$/, "Invalid reference code."),
  kind: z.enum(["logo", "render", "kit-pdf"]),
  templateSlug: templateSlug.optional(),
});

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message || "Please check the form and try again.";
}
