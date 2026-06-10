import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// In development, Next.js can hot-reload files causing multiple instances of PrismaClient.
// We attach PrismaClient to the global object to prevent this.
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

function createClient(): PrismaClient {
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
}

let client: PrismaClient | undefined = globalForPrisma.prisma;

// Lazy proxy: the client (and the DATABASE_URL check) is only created on first
// query, so `next build` can collect page data without a database configured.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!client) {
      client = createClient();
      if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
    }
    const value = Reflect.get(client, prop) as unknown;
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
});
