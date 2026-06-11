"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "odisha-event-alert-super-secret-key-2026";
const SESSION_COOKIE_NAME = "admin_session";

// -------------------------------------------------------------
// Authentication Actions
// -------------------------------------------------------------

export async function adminLoginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Please enter both email and password." };
  }

  try {
    // Find admin user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.status !== "ACTIVE") {
      return { success: false, error: "Invalid email credentials or inactive account." };
    }

    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Incorrect password. Please try again." };
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Save to HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return { success: true };
  } catch (error: any) {
    console.error("Admin login error:", error);
    return { success: false, error: "An unexpected error occurred during login." };
  }
}

export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return { success: true };
}

export async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      name: string;
      email: string;
      role: string;
    };
    return decoded;
  } catch (error) {
    return null;
  }
}

// -------------------------------------------------------------
// Public Forms Actions
// -------------------------------------------------------------

export async function submitEventAction(formData: FormData) {
  try {
    const eventTitle = formData.get("eventTitle") as string;
    const category = formData.get("category") as string;
    const eventType = formData.get("eventType") as string;
    const organizerType = formData.get("organizerType") as string || "PUBLIC";
    const description = formData.get("description") as string;
    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const venueName = formData.get("venueName") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const district = formData.get("district") as string;
    const googleMapUrl = formData.get("googleMapUrl") as string;
    const priceType = formData.get("priceType") as string;
    const ticketPrice = formData.get("ticketPrice") as string;
    const registrationUrl = formData.get("registrationUrl") as string;
    const posterUrl = formData.get("posterUrl") as string;

    const organizerName = formData.get("organizerName") as string;
    const contactPerson = formData.get("contactPerson") as string;
    const phone = formData.get("phone") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const email = formData.get("email") as string;
    const instagramUrl = formData.get("instagramUrl") as string;

    const promoInterests = formData.getAll("promotionInterest") as string[];

    if (!eventTitle || !description || !startDateStr || !venueName || !city || !organizerName || !phone) {
      return { success: false, error: "Please fill in all required fields marked with *." };
    }

    await prisma.eventSubmission.create({
      data: {
        eventTitle,
        category,
        eventType,
        organizerType,
        description,
        startDate: new Date(startDateStr),
        endDate: endDateStr ? new Date(endDateStr) : null,
        startTime,
        endTime,
        venueName,
        address,
        city,
        district,
        googleMapUrl,
        priceType,
        ticketPrice,
        registrationUrl,
        posterUrl: posterUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop",
        organizerName,
        contactPerson,
        phone,
        whatsapp,
        email,
        instagramUrl,
        promotionInterest: promoInterests.join(","),
        status: "PENDING",
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Event submission error:", error);
    return { success: false, error: "Error submitting event: " + error.message };
  }
}

export async function submitLeadAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const companyName = formData.get("companyName") as string;
    const leadType = formData.get("leadType") as string;
    const message = formData.get("message") as string;
    const sourcePage = formData.get("sourcePage") as string;

    if (!name || !phone || !email || !leadType || !message) {
      return { success: false, error: "Please fill in all required fields." };
    }

    await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        companyName,
        leadType,
        message,
        sourcePage,
        status: "NEW",
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Lead submission error:", error);
    return { success: false, error: "Error submitting inquiry: " + error.message };
  }
}

export async function subscribeAction(email: string, name?: string, phone?: string, city?: string, interests?: string) {
  try {
    if (!email) {
      return { success: false, error: "Email is required." };
    }

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return { success: true, message: "You are already subscribed!" };
      } else {
        await prisma.subscriber.update({
          where: { email },
          data: { status: "ACTIVE" },
        });
        return { success: true, message: "Welcome back! Re-subscribed successfully." };
      }
    }

    await prisma.subscriber.create({
      data: {
        email,
        name: name || null,
        phone: phone || null,
        city: city || null,
        interests: interests || null,
        source: "footer",
        status: "ACTIVE",
      },
    });

    return { success: true, message: "Thank you for subscribing!" };
  } catch (error: any) {
    console.error("Newsletter signup error:", error);
    return { success: false, error: "Error subscribing: " + error.message };
  }
}

// -------------------------------------------------------------
// Admin CRUD Operations: Events
// -------------------------------------------------------------

export async function createEventAction(data: any) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    const event = await prisma.event.create({
      data: {
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: data.description,
        categoryId: data.categoryId,
        cityId: data.cityId,
        organizerId: data.organizerId || null,
        organizerType: data.organizerType || "PUBLIC",
        eventType: data.eventType || "OFFLINE",
        status: data.status || "DRAFT",
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        venueName: data.venueName,
        address: data.address || null,
        district: data.district || null,
        googleMapUrl: data.googleMapUrl || null,
        priceType: data.priceType || "FREE",
        minPrice: data.minPrice !== undefined ? parseFloat(data.minPrice) : null,
        maxPrice: data.maxPrice !== undefined ? parseFloat(data.maxPrice) : null,
        registrationUrl: data.registrationUrl || null,
        ticketingUrl: data.ticketingUrl || null,
        officialUrl: data.officialUrl || null,
        instagramUrl: data.instagramUrl || null,
        posterUrl: data.posterUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop",
        bannerUrl: data.bannerUrl || null,
        sourceName: data.sourceName || null,
        sourceUrl: data.sourceUrl || null,
        isFeatured: !!data.isFeatured,
        isTrending: !!data.isTrending,
        isVerified: !!data.isVerified,
        seoTitle: data.seoTitle || `${data.title} | Odisha Event Alert`,
        seoDescription: data.seoDescription || data.shortDescription,
        createdBy: session.userId,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      },
    });

    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath(`/events/${data.slug}`);
    return { success: true, event };
  } catch (error: any) {
    console.error("Create event error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateEventAction(id: string, data: any) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Event not found." };

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: data.description,
        categoryId: data.categoryId,
        cityId: data.cityId,
        organizerId: data.organizerId || null,
        organizerType: data.organizerType || "PUBLIC",
        eventType: data.eventType || "OFFLINE",
        status: data.status || "DRAFT",
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        venueName: data.venueName,
        address: data.address || null,
        district: data.district || null,
        googleMapUrl: data.googleMapUrl || null,
        priceType: data.priceType || "FREE",
        minPrice: data.minPrice !== undefined && data.minPrice !== "" ? parseFloat(data.minPrice) : null,
        maxPrice: data.maxPrice !== undefined && data.maxPrice !== "" ? parseFloat(data.maxPrice) : null,
        registrationUrl: data.registrationUrl || null,
        ticketingUrl: data.ticketingUrl || null,
        officialUrl: data.officialUrl || null,
        instagramUrl: data.instagramUrl || null,
        posterUrl: data.posterUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop",
        bannerUrl: data.bannerUrl || null,
        sourceName: data.sourceName || null,
        sourceUrl: data.sourceUrl || null,
        isFeatured: !!data.isFeatured,
        isTrending: !!data.isTrending,
        isVerified: !!data.isVerified,
        seoTitle: data.seoTitle || `${data.title} | Odisha Event Alert`,
        seoDescription: data.seoDescription || data.shortDescription,
        publishedAt: data.status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt,
      },
    });

    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath(`/events/${data.slug}`);
    return { success: true, event };
  } catch (error: any) {
    console.error("Update event error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteEventAction(id: string) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.event.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/events");
    return { success: true };
  } catch (error: any) {
    console.error("Delete event error:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleFeaturedAction(id: string, isFeatured: boolean) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.event.update({
      where: { id },
      data: { isFeatured },
    });
    revalidatePath("/");
    revalidatePath("/events");
    return { success: true };
  } catch (error: any) {
    console.error("Toggle featured error:", error);
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// Public: Register Interest on OEA (blueprint §9)
// -------------------------------------------------------------

function generateRegistrationCode(): string {
  const year = new Date().getFullYear();
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32])
    .join("");
  return `OEA-REG-${year}-${rand}`;
}

export async function registerInterestAction(prevState: any, formData: FormData) {
  try {
    const eventId = (formData.get("eventId") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const mobile = (formData.get("mobile") as string)?.trim();
    const email = (formData.get("email") as string)?.trim() || null;
    const city = (formData.get("city") as string)?.trim() || null;
    const attendeeCount = Math.min(Math.max(parseInt(formData.get("attendeeCount") as string) || 1, 1), 10);
    const consentEventUpdates = formData.get("consentEventUpdates") === "on";
    const consentSimilarAlerts = formData.get("consentSimilarAlerts") === "on";
    const notes = (formData.get("notes") as string)?.trim() || null;

    if (!eventId) return { success: false, error: "Missing event reference. Please reload the page." };
    if (!name || name.length < 2) return { success: false, error: "Please enter your name." };
    if (!/^[6-9]\d{9}$/.test(mobile || "")) return { success: false, error: "Enter a valid 10-digit mobile number." };
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: "Enter a valid email address." };
    if (!consentEventUpdates) return { success: false, error: "Please agree to receive updates for this event." };

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, status: true },
    });
    if (!event || !["PUBLISHED", "WATCHLIST"].includes(event.status)) {
      return { success: false, error: "Registrations are not open for this event." };
    }

    // Already registered with this mobile? Return the existing code.
    const existing = await prisma.registration.findFirst({
      where: { eventId, mobile },
      select: { code: true },
    });
    if (existing) {
      return {
        success: true,
        code: existing.code,
        message: "You're already registered for this event. Here is your registration ID.",
      };
    }

    let code = generateRegistrationCode();
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await prisma.registration.create({
          data: {
            code,
            eventId,
            name,
            mobile,
            email,
            city,
            attendeeCount,
            status: event.status === "WATCHLIST" ? "PENDING" : "REGISTERED",
            consentEventUpdates,
            consentSimilarAlerts,
            notes,
          },
        });
        break;
      } catch (err: any) {
        if (err?.code === "P2002" && attempt < 2) {
          code = generateRegistrationCode();
          continue;
        }
        throw err;
      }
    }

    return { success: true, code };
  } catch (error: any) {
    console.error("Register interest error:", error);
    return { success: false, error: "Something went wrong while registering. Please try again." };
  }
}

// -------------------------------------------------------------
// Admin: Registrations
// -------------------------------------------------------------

export async function updateRegistrationStatusAction(id: string, status: string) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.registration.update({
      where: { id },
      data: { status },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Update registration status error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteRegistrationAction(id: string) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.registration.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error("Delete registration error:", error);
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// Admin: Auto-Scan Engine
// -------------------------------------------------------------

export async function runScanNowAction() {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    const { runAutoScan } = await import("@/lib/scanner");
    const summary = await runAutoScan("MANUAL");
    revalidatePath("/");
    revalidatePath("/events");
    revalidatePath("/admin/dashboard/autoscan");
    return { success: true, summary };
  } catch (error: any) {
    console.error("Manual scan error:", error);
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// Admin: Event Submissions
// -------------------------------------------------------------

export async function approveSubmissionAction(id: string, adminNotes?: string) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    const sub = await prisma.eventSubmission.findUnique({ where: { id } });
    if (!sub) return { success: false, error: "Submission not found." };

    // 1. Resolve or Create Category
    let category = await prisma.category.findFirst({
      where: { name: { equals: sub.category } },
    });
    if (!category) {
      // Find fallback category or take first
      category = await prisma.category.findFirst({
        where: { slug: "concerts" },
      });
      if (!category) {
        category = await prisma.category.create({
          data: { name: sub.category, slug: sub.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
        });
      }
    }

    // 2. Resolve or Create City
    let city = await prisma.city.findFirst({
      where: { name: { equals: sub.city } },
    });
    if (!city) {
      city = await prisma.city.findFirst({
        where: { slug: "bhubaneswar" },
      });
      if (!city) {
        city = await prisma.city.create({
          data: { name: sub.city, slug: sub.city.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
        });
      }
    }

    // 3. Create Organizer if needed
    let organizer = await prisma.organizer.findFirst({
      where: { name: { equals: sub.organizerName } },
    });
    if (!organizer) {
      organizer = await prisma.organizer.create({
        data: {
          name: sub.organizerName,
          contactPerson: sub.contactPerson,
          phone: sub.phone,
          whatsapp: sub.whatsapp,
          email: sub.email,
          instagramUrl: sub.instagramUrl,
          status: "UNVERIFIED",
        },
      });
    }

    // 4. Create Published Event
    const baseSlug = sub.eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const ticketPriceNum = sub.ticketPrice ? parseFloat(sub.ticketPrice) : null;

    const event = await prisma.event.create({
      data: {
        title: sub.eventTitle,
        slug: uniqueSlug,
        shortDescription: sub.description.substring(0, 160) + "...",
        description: sub.description,
        categoryId: category.id,
        cityId: city.id,
        organizerId: organizer.id,
        organizerType: sub.organizerType,
        eventType: sub.eventType,
        status: "PUBLISHED", // Immediately goes live
        startDate: sub.startDate,
        endDate: sub.endDate,
        startTime: sub.startTime,
        endTime: sub.endTime,
        venueName: sub.venueName,
        address: sub.address,
        district: sub.district || city.name,
        priceType: sub.priceType,
        minPrice: ticketPriceNum,
        maxPrice: ticketPriceNum,
        registrationUrl: sub.registrationUrl,
        posterUrl: sub.posterUrl,
        isVerified: true,
        approvedBy: session.userId,
        publishedAt: new Date(),
      },
    });

    // 5. Update submission status
    await prisma.eventSubmission.update({
      where: { id },
      data: {
        status: "APPROVED",
        adminNotes: adminNotes || sub.adminNotes,
      },
    });

    revalidatePath("/");
    revalidatePath("/events");
    return { success: true, event };
  } catch (error: any) {
    console.error("Approve submission error:", error);
    return { success: false, error: error.message };
  }
}

export async function rejectSubmissionAction(id: string, adminNotes: string) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.eventSubmission.update({
      where: { id },
      data: {
        status: "REJECTED",
        adminNotes,
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Reject submission error:", error);
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// Admin: Leads & Subscribers
// -------------------------------------------------------------

export async function updateLeadStatusAction(id: string, status: string) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.lead.update({
      where: { id },
      data: { status },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Update lead status error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteLeadAction(id: string) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.lead.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error("Delete lead error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteSubscriberAction(id: string) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.subscriber.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error("Delete subscriber error:", error);
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// Admin: Categories & Cities
// -------------------------------------------------------------

export async function createCategoryAction(data: any) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        icon: data.icon || "Music",
        imageUrl: data.imageUrl || null,
        status: data.status || "ACTIVE",
        sortOrder: parseInt(data.sortOrder) || 0,
      },
    });
    revalidatePath("/");
    revalidatePath("/events");
    return { success: true, category };
  } catch (error: any) {
    console.error("Create category error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCategoryAction(id: string, data: any) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        icon: data.icon || "Music",
        imageUrl: data.imageUrl || null,
        status: data.status || "ACTIVE",
        sortOrder: parseInt(data.sortOrder) || 0,
      },
    });
    revalidatePath("/");
    revalidatePath("/events");
    return { success: true, category };
  } catch (error: any) {
    console.error("Update category error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCategoryAction(id: string) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/events");
    return { success: true };
  } catch (error: any) {
    console.error("Delete category error:", error);
    return { success: false, error: error.message };
  }
}

export async function createCityAction(data: any) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    const city = await prisma.city.create({
      data: {
        name: data.name,
        slug: data.slug,
        district: data.district || null,
        state: data.state || "Odisha",
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        status: data.status || "ACTIVE",
      },
    });
    revalidatePath("/");
    revalidatePath("/events");
    return { success: true, city };
  } catch (error: any) {
    console.error("Create city error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCityAction(id: string, data: any) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    const city = await prisma.city.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        district: data.district || null,
        state: data.state || "Odisha",
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        status: data.status || "ACTIVE",
      },
    });
    revalidatePath("/");
    revalidatePath("/events");
    return { success: true, city };
  } catch (error: any) {
    console.error("Update city error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCityAction(id: string) {
  const session = await verifyAdminSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.city.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/events");
    return { success: true };
  } catch (error: any) {
    console.error("Delete city error:", error);
    return { success: false, error: error.message };
  }
}
