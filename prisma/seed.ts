import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

// Instantiate the Prisma Client with the SQLite adapter for the seed script
const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db"
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Clear existing data
  await prisma.eventImage.deleteMany();
  await prisma.event.deleteMany();
  await prisma.organizer.deleteMany();
  await prisma.city.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.subscriber.deleteMany();

  console.log("🧹 Cleaned existing database records.");

  // 2. Create Admin User
  const passwordHash = bcrypt.hashSync("admin", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Odisha Event Admin",
      email: "admin@odishaeventalert.com",
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`👤 Created Admin User: ${admin.email}`);

  // 3. Create Categories (13 total)
  const categoriesData = [
    { name: "Concerts", slug: "concerts", description: "Live music shows, music festivals, and bands", icon: "Music" },
    { name: "DJ Nights", slug: "dj-nights", description: "Club nights, EDM parties, and pub events", icon: "Disc" },
    { name: "Comedy", slug: "comedy", description: "Stand-up comedy specials, open mics, and improv", icon: "Smile" },
    { name: "Food Festivals", slug: "food-festivals", description: "Food trucks, culinary workshops, and flea markets", icon: "Utensils" },
    { name: "College Fests", slug: "college-fests", description: "Annual cultural, technical, and sports fests", icon: "GraduationCap" },
    { name: "Workshops", slug: "workshops", description: "Skill development, art and craft, and creative bootcamps", icon: "Compass" },
    { name: "Business Events", slug: "business", description: "Startup meets, seminars, summits, and exhibitions", icon: "Briefcase" },
    { name: "Cultural Events", slug: "cultural", description: "Traditional dance, classical music, art heritage fests", icon: "Sparkles" },
    { name: "Sports", slug: "sports", description: "Marathons, tournaments, football, cricket matches", icon: "Trophy" },
    { name: "Fitness & Yoga", slug: "fitness", description: "Yoga classes, aerobic bootcamps, and health seminars", icon: "Heart" },
    { name: "Exhibitions", slug: "exhibitions", description: "Book fairs, handicraft expos, trade fairs", icon: "Layers" },
    { name: "Offers & Sales", slug: "offers", description: "Mall offers, festive sales, food deals, discounts", icon: "Percent" },
    { name: "Community & Startup", slug: "community", description: "Startup networking, local cleanups, social meets", icon: "Users" },
  ];

  const categoriesMap: { [slug: string]: any } = {};
  for (const cat of categoriesData) {
    const dbCat = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        status: "ACTIVE",
        sortOrder: Object.keys(categoriesMap).length,
      },
    });
    categoriesMap[cat.slug] = dbCat;
  }
  console.log(`📂 Created ${Object.keys(categoriesMap).length} Categories.`);

  // 4. Create Cities (10 total)
  const citiesData = [
    { name: "Bhubaneswar", slug: "bhubaneswar", district: "Khordha", description: "The Temple City of India and capital of Odisha." },
    { name: "Cuttack", slug: "cuttack", district: "Cuttack", description: "The Silver City, heritage hub, and second largest city." },
    { name: "Puri", slug: "puri", district: "Puri", description: "The Holy City of Lord Jagannath on the Bay of Bengal coast." },
    { name: "Rourkela", slug: "rourkela", district: "Sundargarh", description: "The Steel City, modern educational and hockey center." },
    { name: "Sambalpur", slug: "sambalpur", district: "Sambalpur", description: "The cultural heart of Western Odisha on Hirakud Dam." },
    { name: "Berhampur", slug: "berhampur", district: "Ganjam", description: "The Silk City, commercial center of southern Odisha." },
    { name: "Balasore", slug: "balasore", district: "Balasore", description: "North-Eastern coastal town famous for its beaches and defense base." },
    { name: "Angul", slug: "angul", district: "Angul", description: "Industrial center with large metal refineries and power plants." },
    { name: "Keonjhar", slug: "keonjhar", district: "Kendujhar", description: "Picturesque hilly town surrounded by forests and iron ore deposits." },
    { name: "Jajpur", slug: "jajpur", district: "Jajpur", description: "Historical and religious center with ancient temples." },
  ];

  const citiesMap: { [slug: string]: any } = {};
  for (const city of citiesData) {
    const dbCity = await prisma.city.create({
      data: {
        name: city.name,
        slug: city.slug,
        district: city.district,
        state: "Odisha",
        description: city.description,
        status: "ACTIVE",
      },
    });
    citiesMap[city.slug] = dbCity;
  }
  console.log(`📍 Created ${Object.keys(citiesMap).length} Cities.`);

  // 5. Create Organizers (5 total)
  const organizersData = [
    { name: "Odisha Tourism", contactPerson: "Director Tourism", phone: "+91 674 2432107", whatsapp: "+91 9437000000", email: "info@odishatourism.gov.in", websiteUrl: "https://odishatourism.gov.in", status: "VERIFIED" },
    { name: "Bhubaneswar Clubbing Agency", contactPerson: "Rohan Mohanty", phone: "+91 9090123456", whatsapp: "+91 9090123456", email: "info@bbsrclubs.com", websiteUrl: "https://bbsrclubs.com", status: "ACTIVE" },
    { name: "StandUp Odisha", contactPerson: "Satyabrata Das", phone: "+91 9876543210", whatsapp: "+91 9876543210", email: "comedy@standupodisha.in", instagramUrl: "https://instagram.com/standupodisha", status: "VERIFIED" },
    { name: "KIIT Student Activity Center", contactPerson: "Student Convenor", phone: "+91 674 2725113", email: "ksac@kiit.ac.in", websiteUrl: "https://kiit.ac.in", status: "VERIFIED" },
    { name: "Odisha Startup Hub", contactPerson: "Niranjan Patnaik", phone: "+91 9999888877", whatsapp: "+91 9999888877", email: "admin@odishastartups.org", websiteUrl: "https://odishastartups.org", status: "VERIFIED" },
  ];

  const organizers: any[] = [];
  for (const org of organizersData) {
    const dbOrg = await prisma.organizer.create({
      data: org,
    });
    organizers.push(dbOrg);
  }
  console.log(`🏢 Created ${organizers.length} Organizers.`);

  // 6. Premium Hand-Crafted Events (12 total: 10 Featured, 2 Watchlist)
  const premiumEvents: any[] = [
    {
      title: "Arijit Singh Live In Concert Bhubaneswar 2026",
      slug: "arijit-singh-live-in-concert-bhubaneswar-2026",
      shortDescription: "Experience the magic of Arijit Singh performing live in the capital city of Odisha. A night full of soulful melodies!",
      description: "Join us for the most anticipated musical event of 2026 in Odisha! Arijit Singh, the voice of a generation, returns to Bhubaneswar with a massive live-in-concert performance. Expect an evening filled with his blockbuster romantic hits, high-energy pop anthems, and custom acoustic renditions. The concert features a state-of-the-art stage design, immersive visuals, and a 40-piece live orchestra. Do not miss this once-in-a-lifetime experience!",
      categorySlug: "concerts",
      citySlug: "bhubaneswar",
      organizerIndex: 1,
      eventType: "OFFLINE",
      status: "PUBLISHED",
      isFeatured: true,
      isTrending: true,
      isVerified: true,
      startDate: new Date("2026-06-25"),
      startTime: "18:00",
      venueName: "Janata Maidan",
      address: "Janata Maidan, Jayadev Vihar, Chandrasekharpur",
      district: "Khordha",
      googleMapUrl: "https://maps.google.com/?q=Janata+Maidan+Bhubaneswar",
      priceType: "PAID",
      minPrice: 999,
      maxPrice: 9999,
      registrationUrl: "https://bookmyshow.com/example-arijit-bbsr",
      ticketingUrl: "https://bookmyshow.com/example-arijit-bbsr",
      posterUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1080&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1920&auto=format&fit=crop",
      sourceName: "BookMyShow",
      sourceUrl: "https://bookmyshow.com",
    },
    {
      title: "Bhubaneswar Grand Food Festival 2026",
      slug: "bhubaneswar-grand-food-festival-2026",
      shortDescription: "Savour the finest local, national, and international cuisines. Over 100+ stalls, live music, and celebrity chefs!",
      description: "Odisha Tourism presents the 5th edition of the Bhubaneswar Grand Food Festival! A 3-day gastronomic celebration featuring iconic Odia street foods like Dahibara Aloodum, regional delicacies from all 30 districts of Odisha, along with modern international cuisines. Enjoy live cooking demonstrations by Michelin-starred and MasterChef India celebrity chefs, family workshops, and evening musical concerts featuring top Odia bands.",
      categorySlug: "food-festivals",
      citySlug: "bhubaneswar",
      organizerIndex: 0,
      eventType: "OFFLINE",
      status: "PUBLISHED",
      isFeatured: true,
      isTrending: true,
      isVerified: true,
      startDate: new Date("2026-06-05"),
      endDate: new Date("2026-06-07"),
      startTime: "12:00",
      endTime: "22:00",
      venueName: "Exhibition Ground",
      address: "Unit 3, Exhibition Ground, Near Ram Mandir",
      district: "Khordha",
      googleMapUrl: "https://maps.google.com/?q=Exhibition+Ground+Bhubaneswar",
      priceType: "FREE",
      minPrice: 0,
      posterUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1080&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1920&auto=format&fit=crop",
      sourceName: "Odisha Tourism Board",
      sourceUrl: "https://odishatourism.gov.in",
    },
    {
      title: "Anubhav Singh Bassi Live in Cuttack",
      slug: "anubhav-singh-bassi-live-in-cuttack-2026",
      shortDescription: "Anubhav Singh Bassi is back with his brand new stand-up comedy special! Get ready for two hours of non-stop laughter.",
      description: "StandUp Odisha is thrilled to bring India's most loved storyteller-comedian, Anubhav Singh Bassi, to the historic Silver City of Cuttack. Bassi will be performing his brand new solo show, featuring all-new jokes, hilarious anecdotes about his life, career, and university stories. The auditorium has limited seating, so grab your tickets before they run out!",
      categorySlug: "comedy",
      citySlug: "cuttack",
      organizerIndex: 2,
      eventType: "OFFLINE",
      status: "PUBLISHED",
      isFeatured: true,
      isTrending: true,
      isVerified: true,
      startDate: new Date("2026-06-18"),
      startTime: "19:30",
      venueName: "Kala Vikash Kendra",
      address: "KVK Road, Tulsipur, Cuttack",
      district: "Cuttack",
      googleMapUrl: "https://maps.google.com/?q=Kala+Vikash+Kendra+Cuttack",
      priceType: "PAID",
      minPrice: 499,
      maxPrice: 1999,
      registrationUrl: "https://bookmyshow.com/example-bassi-cuttack",
      ticketingUrl: "https://bookmyshow.com/example-bassi-cuttack",
      posterUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?q=80&w=1080&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1585699324551-f6c309eeddea?q=80&w=1920&auto=format&fit=crop",
      sourceName: "StandUp Odisha IG",
      sourceUrl: "https://instagram.com/standupodisha",
    },
    {
      title: "Konark Sun Beach Yoga Festival 2026",
      slug: "konark-sun-beach-yoga-festival-2026",
      shortDescription: "Rejuvenate your body and mind on the pristine beaches of Puri-Konark Marine Drive. Sunrise sessions and meditation.",
      description: "Experience absolute peace and spiritual elevation at the Konark Sun Beach Yoga Festival. Located on the serene sands near the Chandrabhaga Beach along the Puri-Konark Marine Drive, this 2-day wellness festival brings together renowned Yoga Acharyas, spiritual gurus, and meditation coaches. Sessions include Sunrise Hatha Yoga, Vedic Meditation, Sound Healing therapy, and organic Odia Sattvik culinary talks.",
      categorySlug: "fitness",
      citySlug: "puri",
      organizerIndex: 0,
      eventType: "OFFLINE",
      status: "PUBLISHED",
      isFeatured: true,
      isVerified: true,
      startDate: new Date("2026-06-21"),
      endDate: new Date("2026-06-22"),
      startTime: "05:00",
      endTime: "10:30",
      venueName: "Chandrabhaga Eco Retreat",
      address: "Chandrabhaga Beach, Puri-Konark Marine Drive",
      district: "Puri",
      googleMapUrl: "https://maps.google.com/?q=Chandrabhaga+Beach+Konark",
      priceType: "REGISTRATION_REQUIRED",
      minPrice: 0,
      registrationUrl: "https://odishatourism.gov.in/yoga-fest",
      posterUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1080&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1920&auto=format&fit=crop",
      sourceName: "Odisha Tourism",
    },
    {
      title: "All Odisha Startup Conclave 2026",
      slug: "all-odisha-startup-conclave-2026",
      shortDescription: "Odisha's biggest startup summit with 50+ VCs, 200+ founders, pitch competitions, and angel investment rounds.",
      description: "Hosted by the Odisha Startup Hub, the All Odisha Startup Conclave 2026 aims to catalyze the entrepreneurial ecosystem in the state. The event features panel discussions on deep-tech, Agritech, fintech, and local handicraft e-commerce scaling. Early-stage startups get a chance to pitch in the 'Odia Pitch Tank' for direct angel and venture funding rounds of up to ₹1 Crore. Free networking lunch included for all registered attendees.",
      categorySlug: "business",
      citySlug: "bhubaneswar",
      organizerIndex: 4,
      eventType: "OFFLINE",
      status: "PUBLISHED",
      isFeatured: true,
      isVerified: true,
      startDate: new Date("2026-07-10"),
      startTime: "09:00",
      endTime: "18:00",
      venueName: "O-Hub (Startup Odisha)",
      address: "IDCO Info City Industrial Area, Patia, Bhubaneswar",
      district: "Khordha",
      googleMapUrl: "https://maps.google.com/?q=O-Hub+Bhubaneswar",
      priceType: "REGISTRATION_REQUIRED",
      minPrice: 299,
      registrationUrl: "https://odishastartups.org/conclave",
      posterUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1080&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1920&auto=format&fit=crop",
      sourceName: "Startup Odisha Website",
    },
    {
      title: "National Handloom & Handicrafts Expo 2026",
      slug: "national-handloom-handicrafts-expo-2026",
      shortDescription: "Shop authentic Sambalpuri sarees, Pipili appliqué work, Pattachitra paintings directly from national artisans.",
      description: "Odisha's largest handicraft and textile showcase is back. Organizers from the Handloom Department have gathered weavers and artisans from Sambalpur, Bargarh, Pipili, Raghurajpur, and other states like West Bengal and Rajasthan. Find gorgeous hand-woven textiles, wooden crafts, metal statues, tribal arts, and modern home decor items. Excellent festive discounts up to 30% direct from the artisans.",
      categorySlug: "exhibitions",
      citySlug: "sambalpur",
      eventType: "OFFLINE",
      status: "PUBLISHED",
      isFeatured: true,
      startDate: new Date("2026-06-12"),
      endDate: new Date("2026-06-25"),
      startTime: "14:00",
      endTime: "21:30",
      venueName: "PHD Ground",
      address: "PHD Ground, Near Kacheri Road, Sambalpur",
      district: "Sambalpur",
      googleMapUrl: "https://maps.google.com/?q=PHD+Ground+Sambalpur",
      priceType: "FREE",
      posterUrl: "https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?q=80&w=1080&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?q=80&w=1920&auto=format&fit=crop",
      sourceName: "District Administration",
    },
    {
      title: "KIIT Kalinga Fest 2026 (Kriti & Kritansh)",
      slug: "kiit-kalinga-fest-2026",
      shortDescription: "Odisha's largest student-led university fest returns with Bollywood DJ Nights, technical hackathons, and global talent hunts.",
      description: "KIIT Student Activity Center invites university students nationwide to Kalinga Fest 2026. This 4-day annual mega-celebration combines 'Kriitansh' (technical hackathons, robotics, coding arenas) with 'Kriti' (dramatics, group dances, fashion showcases, and street plays). The highlight of the fest includes the Star Night featuring a live performance by a Bollywood icon and a global EDM DJ! Inter-college competition winners get cash prizes worth ₹15 Lakhs.",
      categorySlug: "college-fests",
      citySlug: "bhubaneswar",
      organizerIndex: 3,
      eventType: "OFFLINE",
      status: "PUBLISHED",
      isFeatured: true,
      isTrending: true,
      isVerified: true,
      startDate: new Date("2026-05-28"),
      endDate: new Date("2026-05-31"),
      startTime: "09:00",
      endTime: "23:00",
      venueName: "Kalinga Stadium & KIIT Campus 3",
      address: "KIIT University, Patia, Bhubaneswar",
      district: "Khordha",
      googleMapUrl: "https://maps.google.com/?q=KIIT+University+Bhubaneswar",
      priceType: "REGISTRATION_REQUIRED",
      minPrice: 500,
      registrationUrl: "https://ksac.kiit.ac.in/kfest",
      posterUrl: "https://images.unsplash.com/photo-1523580494863-6f30312245d5?q=80&w=1080&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1920&auto=format&fit=crop",
      sourceName: "KIIT Student Affairs Board",
    },
    {
      title: "Steel City Rourkela Hockey Cup 2026",
      slug: "steel-city-rourkela-hockey-cup-2026",
      shortDescription: "Catch the local sports adrenaline! Top 16 district hockey clubs of Odisha battle it out at the world-class stadium.",
      description: "Rourkela, the hockey nursery of India, is hosting the prestigious Steel City District Cup. Featuring 16 premium local clubs, the tournament is played entirely under floodlights at India's largest hockey venue, the Birsa Munda International Stadium. Come support the future stars of Indian Hockey! Free spectator entry across all league stages. Grand Finale tickets are limited.",
      categorySlug: "sports",
      citySlug: "rourkela",
      eventType: "OFFLINE",
      status: "PUBLISHED",
      isFeatured: true,
      isVerified: true,
      startDate: new Date("2026-06-10"),
      endDate: new Date("2026-06-15"),
      startTime: "16:00",
      endTime: "21:00",
      venueName: "Birsa Munda Hockey Stadium",
      address: "BPUT Campus, Rourkela",
      district: "Sundargarh",
      googleMapUrl: "https://maps.google.com/?q=Birsa+Munda+Hockey+Stadium+Rourkela",
      priceType: "FREE",
      posterUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1080&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=1920&auto=format&fit=crop",
      sourceName: "Rourkela Sports Cell",
    },
    {
      title: "Gopalpur Beach DJ & Music Night 2026",
      slug: "gopalpur-beach-dj-music-night-2026",
      shortDescription: "Dance under the stars to India's top club DJs. Beach bonfire, sea breeze, and dynamic neon light shows.",
      description: "Get ready to experience the biggest coastal party of the year! StandUp Odisha presents Gopalpur Beach DJ & Music Night. Celebrate the upcoming summer with neon paint showers, custom beach bonfires, premium food stalls, and non-stop EDM and Commercial Bollywood tunes spun by celebrity DJs from Mumbai and Goa. Perfect getaway for the weekend with friends!",
      categorySlug: "dj-nights",
      citySlug: "berhampur",
      organizerIndex: 2,
      eventType: "OFFLINE",
      status: "PUBLISHED",
      isFeatured: true,
      startDate: new Date("2026-06-20"),
      startTime: "17:30",
      endTime: "23:30",
      venueName: "Gopalpur Sea Beach",
      address: "Main Promenade, Gopalpur-on-Sea",
      district: "Ganjam",
      googleMapUrl: "https://maps.google.com/?q=Gopalpur+Beach",
      priceType: "PAID",
      minPrice: 399,
      maxPrice: 999,
      registrationUrl: "https://allevents.in/gopalpur-dj-night",
      posterUrl: "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?q=80&w=1080&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1920&auto=format&fit=crop",
      sourceName: "Gopalpur Club Promoters",
    },
    {
      title: "Clay Pottery & Terracotta Art Workshop",
      slug: "clay-pottery-terracotta-art-workshop-2026",
      shortDescription: "Learn traditional terracotta pottery from award-winning master craftsmen. Bring home your own pottery!",
      description: "Join us for a relaxing, hands-on 3-hour art workshop exploring traditional Odishan pottery and clay modelling techniques. Taught by national-award-winning artisans from the village of Keonjhar, this workshop covers clay processing, potter's wheel centering, shaping, sculpting, and terracotta painting. No experience required. All raw materials, tools, and evening high tea are provided.",
      categorySlug: "workshops",
      citySlug: "keonjhar",
      eventType: "OFFLINE",
      status: "PUBLISHED",
      isFeatured: true,
      startDate: new Date("2026-06-14"),
      startTime: "15:00",
      endTime: "18:00",
      venueName: "Keonjhar Town Hall Community Center",
      address: "Judicial Colony, Keonjhar Town",
      district: "Kendujhar",
      googleMapUrl: "https://maps.google.com/?q=Town+Hall+Keonjhar",
      priceType: "PAID",
      minPrice: 199,
      registrationUrl: "https://townscript.com/clay-pottery-keonjhar",
      posterUrl: "https://images.unsplash.com/photo-1534531173927-aeb928d54385?q=80&w=1080&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1565192647048-f997ded879ab?q=80&w=1920&auto=format&fit=crop",
      sourceName: "District Art Council",
    },
    {
      title: "Sunburn Arena Odisha (Rumoured Concert)",
      slug: "sunburn-arena-odisha-2026",
      shortDescription: "Rumours are spreading! Sunburn Arena is reportedly planning a massive electronic dance music show in Bhubaneswar.",
      description: "Highly trusted sources in the music booking industry suggest that India's biggest electronic dance music brand, Sunburn Arena, is actively scouting open-ground venues in Bhubaneswar to bring a world-renowned Top-100 DJ this monsoon season. The date is expected to be in late July 2026. Watch this space for official registrations, ticket prices, artist announcements, and early bird tickets!",
      categorySlug: "dj-nights",
      citySlug: "bhubaneswar",
      eventType: "OFFLINE",
      status: "WATCHLIST", // WATCHLIST event
      startDate: new Date("2026-07-25"),
      venueName: "TBD Open Ground",
      city: "Bhubaneswar",
      priceType: "NOT_ANNOUNCED",
      posterUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1080&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1920&auto=format&fit=crop",
    },
    {
      title: "Cuttack Durga Puja Mega Carnival 2026",
      slug: "cuttack-durga-puja-mega-carnival-2026",
      shortDescription: "Dates announced! Prepare for Cuttack's spectacular grand silver chandi-medha pandal trails and light shows.",
      description: "The official dates for the iconic Cuttack Durga Puja Pandal trails and massive cultural showcase have been teased by the coordination committee. Prepare to explore Cuttack's legendary silver and gold backdrops (Chandi Medha), massive decorative light gates stretching for miles, cultural folk music stages across various mandaps, and food strips. Exact pandal trial map and night guide to be uploaded soon!",
      categorySlug: "cultural",
      citySlug: "cuttack",
      eventType: "OFFLINE",
      status: "WATCHLIST", // WATCHLIST event
      startDate: new Date("2026-10-15"),
      endDate: new Date("2026-10-20"),
      venueName: "Multiple Historic Pandals",
      priceType: "FREE",
      posterUrl: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=1080&auto=format&fit=crop",
      bannerUrl: "https://images.unsplash.com/photo-1590076275572-ac603b1d12a3?q=80&w=1920&auto=format&fit=crop",
    },
  ];

  for (const ev of premiumEvents) {
    const category = categoriesMap[ev.categorySlug];
    const city = citiesMap[ev.citySlug];
    const organizer = ev.organizerIndex !== undefined ? organizers[ev.organizerIndex] : null;

    // Determine organizerType dynamically based on slug
    let organizerType = "PUBLIC";
    if (ev.slug.includes("arijit") || ev.slug.includes("bassi") || ev.slug.includes("gopalpur") || ev.slug.includes("sunburn")) {
      organizerType = "PRIVATE";
    } else if (ev.slug.includes("yoga") || ev.slug.includes("conclave") || ev.slug.includes("handloom")) {
      organizerType = "GOVERNMENT";
    } else if (ev.slug.includes("pottery")) {
      organizerType = "SOCIAL";
    }

    await prisma.event.create({
      data: {
        title: ev.title,
        slug: ev.slug,
        shortDescription: ev.shortDescription,
        description: ev.description,
        categoryId: category.id,
        cityId: city.id,
        organizerId: organizer ? organizer.id : null,
        organizerType,
        eventType: ev.eventType,
        status: ev.status,
        isFeatured: ev.isFeatured ?? false,
        isTrending: ev.isTrending ?? false,
        isVerified: ev.isVerified ?? false,
        startDate: ev.startDate,
        endDate: ev.endDate ?? null,
        startTime: ev.startTime ?? null,
        endTime: ev.endTime ?? null,
        venueName: ev.venueName,
        address: ev.address ?? null,
        district: ev.district ?? null,
        googleMapUrl: ev.googleMapUrl ?? null,
        priceType: ev.priceType,
        minPrice: ev.minPrice ?? null,
        maxPrice: ev.maxPrice ?? null,
        registrationUrl: ev.registrationUrl ?? null,
        ticketingUrl: ev.ticketingUrl ?? null,
        officialUrl: ev.officialUrl ?? null,
        instagramUrl: ev.instagramUrl ?? null,
        posterUrl: ev.posterUrl ?? null,
        bannerUrl: ev.bannerUrl ?? null,
        sourceName: ev.sourceName ?? null,
        sourceUrl: ev.sourceUrl ?? null,
        viewsCount: Math.floor(Math.random() * 500) + 50,
        shareCount: Math.floor(Math.random() * 100) + 10,
        seoTitle: `${ev.title} | Odisha Event Alert`,
        seoDescription: ev.shortDescription,
        publishedAt: ev.status === "PUBLISHED" ? new Date() : null,
      },
    });
  }
  console.log("🌟 Created 12 Premium Base Events (including Featured and Watchlist).");

  // 7. Auto-Generate 40+ More Events to reach the 50-100 target!
  const additionalEventTitles = [
    { title: "Sufi & Ghazal Night with Harshdeep Kaur", cat: "concerts", desc: "Soulful Sufi melodies and classical Ghazals live in Bhubaneswar.", venue: "Rabindra Mandap", price: 599 },
    { title: "Rock Band Showdown: Battle of Bands", cat: "concerts", desc: "Rock bands from colleges across East India battle it out for supremacy.", venue: "Utkal Mandap", price: 199 },
    { title: "Bhubaneswar Electronic Sound Society DJ Night", cat: "dj-nights", desc: "Premium underground techno and house music showcase in BBSR.", venue: "The Cellar Lounge", price: 499 },
    { title: "Retro Bollywood Disco Party", cat: "dj-nights", desc: "Dust off your bell bottoms and dance to the best 70s-90s hits.", venue: "Club Underground", price: 300 },
    { title: "Standup Open Mic Bhubaneswar", cat: "comedy", desc: "Catch the freshest local comedy talent trying out new material.", venue: "The Big Cup Cafe", price: 100 },
    { title: "Odia Comedy Club Weekly Special", cat: "comedy", desc: "Odia standby comedians presenting hilarious observational comedy.", venue: "Kala Bhoomi Amphitheatre", price: 150 },
    { title: "Traditional Odia Street Food Carnival", cat: "food-festivals", desc: "All the Dahibara Aloodum, Gupchup, and Chenapoda stalls in one place.", venue: "Balijatra Ground Cuttack", price: 0 },
    { title: "Puri Seafood Flea Market", cat: "food-festivals", desc: "Enjoy fresh fish, prawns, and crab dishes cooked in traditional beach styles.", venue: "Light House Beach Puri", price: 0 },
    { title: "IIIT Technical Fest: TechBazaar 2026", cat: "college-fests", desc: "Hackathons, Web3 developer coding sprints, and robotics championships.", venue: "IIIT campus", price: 200 },
    { title: "NIFT Annual Fashion Showcase: Runway 2026", cat: "college-fests", desc: "Graduating students present their modern Odisha ikat and handloom collections.", venue: "NIFT Amphitheatre", price: 300 },
    { title: "Creative Acrylic Painting Masterclass", cat: "workshops", desc: "Learn stroke techniques, color mixing, and layout design in 3 hours.", venue: "JD Institute of Fashion", price: 500 },
    { title: "Financial Literacy & Mutual Fund Seminar", cat: "workshops", desc: "Understand tax savings, stock market basics, and smart investing.", venue: "Bhubaneswar Hotel", price: 0 },
    { title: "Odisha Digital Marketing Summit 2026", cat: "business", desc: "Top agency experts discuss AI SEO, content scaling, and ad retargeting.", venue: "Fortune Tower", price: 799 },
    { title: "Real Estate & Housing Expo 2026", cat: "business", desc: "Discover premium apartment, villa, and plots projects across Bhubaneswar.", venue: "Janata Maidan", price: 0 },
    { title: "Gotipua Traditional Dance Recital", cat: "cultural", desc: "Enjoy the mesmerizing acrobatic folk dances of Gotipua by young boys.", venue: "Raghurajpur Heritage Village", price: 0 },
    { title: "Odissi Classical Dance Evening", cat: "cultural", desc: "National artists performing gorgeous mudras of classical Odissi dance.", venue: "Bhanja Kala Mandap", price: 100 },
    { title: "All Odisha Corporate Cricket Tournament", cat: "sports", desc: "Top 24 IT and corporate companies compete in a fast-paced T10 tournament.", venue: "Barabati Stadium Outer Ground", price: 0 },
    { title: "Bhubaneswar Mini Marathon 2026", cat: "sports", desc: "Run for green Odisha! 5K and 10K tracks around the beautiful smart city.", venue: "Patia Square Starting Line", price: 100 },
    { title: "Mindfulness & Zen Meditation Camp", cat: "fitness", desc: "Reset your anxiety and stress with custom guided zen breathing classes.", venue: "Puri Beach Sand", price: 0 },
    { title: "High-Intensity Interval Training (HIIT) Beach Camp", cat: "fitness", desc: "Burn 500 calories with high intensity sand aerobics and kettlebell reps.", venue: "Gopalpur beach", price: 199 },
    { title: "Handicrafts & Pattachitra Trade Fair", cat: "exhibitions", desc: "Pattachitra scrolls, palm leaf carvings, and stone work direct sales.", venue: "Ekamra Haat", price: 0 },
    { title: "Odisha National Book Fair 2026", cat: "exhibitions", desc: "Over 200+ global publishers presenting Odia, English, Hindi literature.", venue: "Exhibition Ground", price: 0 },
    { title: "Festive Summer Sale: Esplanade One Mall", cat: "offers", desc: "Flat 50% discount on global brands like Zara, H&M, and Allen Solly.", venue: "Esplanade One Mall", price: 0 },
    { title: "Decathlon Sports Gear Sale", cat: "offers", desc: "Get up to 40% off on premium trekking, cycling, running, and swimming gears.", venue: "Decathlon Phulnakhara", price: 0 },
    { title: "Bhubaneswar Startup Meetup: Founders & Beer", cat: "community", desc: "Casual evening networking for founders, freelancers, and angel investors.", venue: "The Ocean Lounge", price: 299 },
    { title: "Green Environment Tree Plantation Drive", cat: "community", desc: "Let's plant 500 saplings around Patia and Chandrasekharpur streets.", venue: "Damana Square", price: 0 },
  ];

  const citySlugs = Object.keys(citiesMap);
  const categoriesList = Object.values(categoriesMap);
  let count = 0;

  // Let's loop twice to create 52 more events (26 * 2)
  for (let loop = 0; loop < 2; loop++) {
    for (const data of additionalEventTitles) {
      const citySlug = citySlugs[(count + loop) % citySlugs.length];
      const city = citiesMap[citySlug];
      const category = categoriesMap[data.cat] || categoriesList[count % categoriesList.length];
      
      // Calculate a randomized future date (1 to 60 days ahead)
      const daysAhead = Math.floor(Math.random() * 60) + 2;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + daysAhead);

      const isWatchlist = count % 7 === 0; // Create some watchlist events!
      const status = isWatchlist ? "WATCHLIST" : "PUBLISHED";
      const priceType = data.price > 0 ? "PAID" : "FREE";

      const posterImages = [
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1531058020387-3be344559be6?q=80&w=800&auto=format&fit=crop"
      ];

      const slugSuffix = loop > 0 ? `-version-${loop + 1}` : "";
      const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${city.name.toLowerCase()}${slugSuffix}`;

      // Assign class types dynamically
      let organizerType = "PUBLIC";
      if (category.slug === "concerts" || category.slug === "dj-nights" || category.slug === "comedy" || category.slug === "offers") {
        organizerType = "PRIVATE";
      } else if (category.slug === "cultural" || category.slug === "business" || category.slug === "sports") {
        organizerType = count % 2 === 0 ? "GOVERNMENT" : "PUBLIC";
      } else if (category.slug === "community" || category.slug === "fitness" || category.slug === "workshops") {
        organizerType = "SOCIAL";
      }

      await prisma.event.create({
        data: {
          title: `${data.title} (${city.name})`,
          slug,
          shortDescription: `${data.desc} Hosted in the lovely city of ${city.name}, Odisha. Join us!`,
          description: `${data.desc} This highly anticipated gathering features expert panel leads, dedicated networking hours, custom showcases, and local hospitality. Organized in collaboration with local communities, it provides a safe, welcoming, and high-energy environment for all attendees. Make sure to reserve your spots today!`,
          categoryId: category.id,
          cityId: city.id,
          organizerType,
          eventType: Math.random() > 0.85 ? (Math.random() > 0.5 ? "ONLINE" : "HYBRID") : "OFFLINE",
          status,
          startDate,
          startTime: "17:00",
          venueName: `${data.venue}, ${city.name}`,
          address: `${data.venue}, Near Main Road, ${city.name}, Odisha`,
          district: city.district || "Odisha",
          priceType,
          minPrice: data.price || null,
          maxPrice: data.price ? data.price * 2 : null,
          registrationUrl: priceType === "PAID" ? "https://townscript.com" : null,
          posterUrl: posterImages[count % posterImages.length],
          bannerUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1920&auto=format&fit=crop",
          isFeatured: false,
          isTrending: count % 10 === 0,
          isVerified: count % 5 === 0,
          viewsCount: Math.floor(Math.random() * 200) + 10,
          shareCount: Math.floor(Math.random() * 40) + 2,
          seoTitle: `${data.title} in ${city.name} | Odisha Event Alert`,
          seoDescription: data.desc,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
        },
      });
      count++;
    }
  }

  // 8. Create some dummy leads and subscribers
  const sampleLeads = [
    { name: "Aman Sharma", phone: "9876543210", email: "aman@mayfair.com", companyName: "Mayfair Resorts", leadType: "ADVERTISING", message: "We want to advertise our weekend summer buffet on the homepage banner.", status: "NEW" },
    { name: "Prerna Das", phone: "9090123123", email: "prerna@chocolates.in", companyName: "The Chocolate Box", leadType: "EVENT_LISTING", message: "I want to list our chocolate baking workshop. Can you make it featured?", status: "CONTACTED" },
  ];
  for (const lead of sampleLeads) {
    await prisma.lead.create({ data: lead });
  }

  const sampleSubscribers = [
    { name: "Manas Ranjan", email: "manas@outlook.com", city: "Bhubaneswar", interests: "concerts,comedy", source: "homepage_footer" },
    { name: "Smita Patra", email: "smita@gmail.com", city: "Cuttack", interests: "workshops,cultural", source: "pop_up" },
  ];
  for (const sub of sampleSubscribers) {
    await prisma.subscriber.create({ data: sub });
  }

  console.log(`🚀 Successfully Seeded Database:`);
  console.log(`   - Users: 1 (admin@odishaeventalert.com / admin)`);
  console.log(`   - Categories: 13`);
  console.log(`   - Cities: 10`);
  console.log(`   - Organizers: 5`);
  console.log(`   - Events: ${await prisma.event.count()} (with featured, trending, and watchlist events)`);
  console.log(`   - Leads: 2`);
  console.log(`   - Subscribers: 2`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
