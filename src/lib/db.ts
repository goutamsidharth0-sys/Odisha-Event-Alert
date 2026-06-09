import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// In development, Next.js can hot-reload files causing multiple instances of PrismaClient.
// We attach PrismaClient to the global object to prevent this.
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ||
  (() => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Add the Supabase Postgres connection string to your environment."
      );
    }
    const adapter = new PrismaPg({
      connectionString,
      // Supabase pooler (Supavisor) terminates TLS with a cert that node-postgres
      // can't always verify; encryption is still enforced.
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
    return new PrismaClient({ adapter });
  })();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
