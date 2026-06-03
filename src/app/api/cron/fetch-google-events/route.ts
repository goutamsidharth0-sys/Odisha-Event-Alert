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

  const SERPAPI_KEY = process.env.SERPAPI_KEY;

  if (!SERPAPI_KEY) {
    console.error("Missing SERPAPI_KEY environment variable");
    return NextResponse.json({ 
      success: false, 
      message: "SERPAPI_KEY is not configured in the environment. Please add it to your Vercel project." 
    }, { status: 500 });
  }

  try {
    console.log("Starting Google Events hourly cron fetch via SerpApi...");
    
    // 2. Fetch data from SerpApi (Google Events API)
    const query = encodeURIComponent("Events in Odisha");
    const serpApiUrl = `https://serpapi.com/search.json?engine=google_events&q=${query}&hl=en&gl=in&api_key=${SERPAPI_KEY}`;
    
    const response = await fetch(serpApiUrl);
    
    if (!response.ok) {
      throw new Error(`SerpApi request failed with status: ${response.status}`);
    }

    const data = await response.json();
    const eventsResults = data.events_results || [];

    if (eventsResults.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Cron executed. No events found in SerpApi response.",
        timestamp: new Date().toISOString()
      });
    }

    let processedCount = 0;

    // 3. Process and map the data
    for (const event of eventsResults) {
      if (!event.title) continue;

      // Extract details
      const title = event.title;
      const description = event.description || event.title;
      const venueName = event.address?.[0] || "Various Venues";
      const cityName = event.address?.[1]?.split(",")?.[0]?.trim() || "Odisha";
      const ticketLink = event.ticket_info?.[0]?.link || event.link || "";
      const posterUrl = event.thumbnail || "https://images.unsplash.com/photo-1540039155732-d68a2f7c00e7?q=80&w=800&auto=format&fit=crop";
      
      // Attempt to parse start date
      let startDate = new Date();
      if (event.date?.when) {
        // Fallback robust date parsing could be added here. We'll use a rough estimate if it's missing.
        try {
          startDate = new Date(event.date.start_date || event.date.when);
          if (isNaN(startDate.getTime())) {
            startDate = new Date(); // default to today if unparseable
          }
        } catch (e) {
          startDate = new Date();
        }
      }

      // Determine Category based on keywords
      let categoryName = "Other Events";
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("comedy") || lowerTitle.includes("standup")) categoryName = "Comedy Shows";
      else if (lowerTitle.includes("concert") || lowerTitle.includes("music") || lowerTitle.includes("live")) categoryName = "Concerts";
      else if (lowerTitle.includes("workshop") || lowerTitle.includes("masterclass")) categoryName = "Workshops";
      else if (lowerTitle.includes("fest") || lowerTitle.includes("festival")) categoryName = "Cultural Fests";
      else if (lowerTitle.includes("dj") || lowerTitle.includes("party") || lowerTitle.includes("night")) categoryName = "Nightlife";

      // 1. Ensure city exists
      const citySlug = cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let city = await prisma.city.findUnique({ where: { slug: citySlug } });
      if (!city) {
        city = await prisma.city.create({
          data: { name: cityName, slug: citySlug, status: "ACTIVE" }
        });
      }

      // 2. Ensure category exists
      const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (!category) {
        category = await prisma.category.create({
          data: { name: categoryName, slug: categorySlug, status: "ACTIVE" }
        });
      }

      // 3. Upsert the event
      // Create a unique slug based on title and date to prevent duplicates
      const eventSlug = `google-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${startDate.getTime()}`.substring(0, 100);
      
      await prisma.event.upsert({
        where: { slug: eventSlug },
        update: {
          title: title,
          shortDescription: description.substring(0, 200),
          description: description,
          venueName: venueName,
          posterUrl: posterUrl,
          startDate: startDate,
          ticketingUrl: ticketLink
        },
        create: {
          title: title,
          slug: eventSlug,
          shortDescription: description.substring(0, 200),
          description: description,
          venueName: venueName,
          cityId: city.id,
          categoryId: category.id,
          startDate: startDate,
          priceType: "NOT_ANNOUNCED",
          posterUrl: posterUrl,
          ticketingUrl: ticketLink,
          status: "PUBLISHED",
          isFeatured: false,
          isVerified: true, 
          organizerType: "PUBLIC",
          sourceName: "Google Events"
        }
      });
      processedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Google Events Cron executed. Processed and upserted ${processedCount} events.`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Cron fetch-google-events error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
