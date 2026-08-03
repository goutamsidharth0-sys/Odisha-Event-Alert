import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TEMPLATES } from "../src/lib/brandlab/templates";
import { RATE_CARD } from "../src/lib/brandlab/rates";

// Mirror the code-defined template library into `MockupTemplate`.
//
// `src/lib/brandlab/templates.ts` stays the source of truth — the quads and
// print specs belong next to the artwork they describe. The table exists so the
// team can deactivate or re-order an item without a deploy, and so renders can
// reference a template row.
//
// Idempotent: run it after every deploy that touches the library.

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString, ssl: { rejectUnauthorized: false }, max: 5 }),
});

export async function seedBrandLabTemplates(client: PrismaClient = prisma) {
  for (const template of TEMPLATES) {
    const shared = {
      name: template.name,
      category: template.category,
      type: template.type,
      // The DB row carries the rate card alongside the public spec: the table is
      // only ever read server-side, and having the rates there lets the team
      // adjust pricing without a deploy.
      printSpecs: { ...template.printSpecs, ...(RATE_CARD[template.slug] ?? {}) } as object,
      variantFor: template.variantFor,
      sortOrder: template.sortOrder,
      active: template.active,
      baseImageUrl: template.type === "photo" ? template.baseImageUrl : null,
      shadingMapUrl: template.type === "photo" ? template.shadingMapUrl : null,
      quad: template.type === "photo" ? (template.quad as object) : undefined,
      safeArea: template.type === "photo" && template.safeArea ? (template.safeArea as object) : undefined,
    };

    await client.mockupTemplate.upsert({
      where: { slug: template.slug },
      create: { slug: template.slug, ...shared },
      // `active` is deliberately not overwritten on update: a template the team
      // switched off in the admin must stay off across deploys.
      update: { ...shared, active: undefined },
    });
  }
  return TEMPLATES.length;
}

async function main() {
  const count = await seedBrandLabTemplates();
  console.log(`🎨 Brand Lab: ${count} mockup templates synced.`);
}

if (process.argv[1]?.includes("seedBrandLab")) {
  main()
    .catch((error) => {
      console.error("❌ Brand Lab template seed failed:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
