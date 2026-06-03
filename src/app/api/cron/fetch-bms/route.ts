import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  // 1. Verify Vercel Cron Authentication (if deployed)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Starting BookMyShow hourly cron fetch...");
    
    // NOTE: Because the specific API repo link was not provided, 
    // we are using a mock response here to demonstrate the exact integration, mapping, and upsert logic.
    // Replace the mockData array with an actual fetch call:
    // const response = await fetch("YOUR_BMS_API_REPO_URL");
    // const mockData = await response.json();

    const mockData = [
      {
        bms_id: "BMS-1001",
        event_title: "Arijit Singh Live",
        event_description: "The biggest live concert in Odisha by Arijit Singh.",
        venue: "Barabati Stadium",
        city_name: "Cuttack",
        category: "Concerts",
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ticket_price: 1500,
        image_url: "https://images.unsplash.com/photo-1540039155732-d68a2f7c00e7?q=80&w=800&auto=format&fit=crop"
      },
      {
        bms_id: "BMS-1002",
        event_title: "Odisha Startup Summit 2026",
        event_description: "Annual gathering of startups, investors, and community leaders.",
        venue: "O-Hub, Infocity",
        city_name: "Bhubaneswar",
        category: "Business",
        start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        ticket_price: 0,
        image_url: "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=800&auto=format&fit=crop"
      }
    ];

    let processedCount = 0;

    for (const event of mockData) {
      // 1. Ensure city exists
      const citySlug = event.city_name.toLowerCase().replace(/\s+/g, '-');
      let city = await prisma.city.findUnique({ where: { slug: citySlug } });
      if (!city) {
        city = await prisma.city.create({
          data: { name: event.city_name, slug: citySlug, status: "ACTIVE" }
        });
      }

      // 2. Ensure category exists
      const categorySlug = event.category.toLowerCase().replace(/\s+/g, '-');
      let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (!category) {
        category = await prisma.category.create({
          data: { name: event.category, slug: categorySlug, status: "ACTIVE" }
        });
      }

      // 3. Upsert the event to avoid duplicates
      const eventSlug = `bms-${event.bms_id}-${event.event_title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      
      await prisma.event.upsert({
        where: { slug: eventSlug }, // Assuming slug is unique and derived from BMS ID
        update: {
          title: event.event_title,
          shortDescription: event.event_description,
          description: event.event_description,
          venueName: event.venue,
          minPrice: event.ticket_price,
          posterUrl: event.image_url,
          startDate: new Date(event.start_date),
        },
        create: {
          title: event.event_title,
          slug: eventSlug,
          shortDescription: event.event_description,
          description: event.event_description,
          venueName: event.venue,
          cityId: city.id,
          categoryId: category.id,
          startDate: new Date(event.start_date),
          priceType: event.ticket_price > 0 ? "PAID" : "FREE",
          minPrice: event.ticket_price,
          posterUrl: event.image_url,
          status: "PUBLISHED",
          isFeatured: false,
          isVerified: true, // Auto-verified if coming from BMS
          organizerType: "PRIVATE"
        }
      });
      processedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cron executed. Processed and upserted ${processedCount} events.`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Cron fetch-bms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
