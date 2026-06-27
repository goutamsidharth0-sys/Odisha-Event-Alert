import { z } from "zod";

// Validation schemas for the server-action boundaries. Public (unauthenticated)
// forms are the priority — these reject bad/malicious input before it reaches
// the database.

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message || "Please check the form and try again.";
}

// Loose phone: allows "+91 ", spaces and dashes but requires 10 digits.
const phoneLoose = z
  .string()
  .trim()
  .min(10, "Please enter a valid phone number.")
  .max(20)
  .refine((v) => (v.match(/\d/g) || []).length >= 10, "Please enter a valid phone number.");

// Strict Indian mobile for on-site registration.
const mobileStrict = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number.");

const optionalEmail = z
  .union([z.string().trim().email("Enter a valid email address."), z.literal("")])
  .optional();

export const eventSubmissionSchema = z.object({
  eventTitle: z.string().trim().min(3, "Event title is too short.").max(180),
  category: z.string().trim().min(1, "Please choose a category."),
  eventType: z.string().trim().min(1, "Please choose an event type."),
  organizerType: z.string().trim().optional(),
  description: z.string().trim().min(1, "Please add a description.").max(6000),
  startDate: z.string().trim().min(1, "Please choose a start date."),
  venueName: z.string().trim().min(1, "Please enter the venue."),
  city: z.string().trim().min(1, "Please enter the city."),
  organizerName: z.string().trim().min(1, "Please enter the organiser name."),
  phone: phoneLoose,
  email: optionalEmail,
});

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  phone: phoneLoose,
  email: z.string().trim().email("Enter a valid email address."),
  leadType: z.string().trim().min(1, "Please choose an inquiry type."),
  message: z.string().trim().min(1, "Please enter a short message.").max(3000),
  companyName: z.string().trim().max(160).optional(),
  sourcePage: z.string().trim().max(160).optional(),
});

export const registerInterestSchema = z.object({
  eventId: z.string().trim().min(1, "Missing event reference. Please reload the page."),
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  mobile: mobileStrict,
  email: optionalEmail,
  city: z.string().trim().max(120).optional(),
  attendeeCount: z.coerce.number().int().min(1).max(10).catch(1),
  notes: z.string().trim().max(1000).optional(),
});

export const subscribeSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

// Admin event create/update — required fields are validated; the action keeps
// reading the original object for its many optional fields.
export const adminEventSchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(200),
  slug: z.string().trim().min(2, "Slug is required.").max(200),
  description: z.string().trim().min(1, "Description is required.").max(8000),
  categoryId: z.string().trim().min(1, "Category is required."),
  cityId: z.string().trim().min(1, "City is required."),
  startDate: z.string().trim().min(1, "Start date is required."),
});
