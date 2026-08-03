import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// In development, Next.js can hot-reload files causing multiple instances of PrismaClient.
// We attach PrismaClient to the global object to prevent this.
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

/**
 * Whether a database is configured at all.
 *
 * The lazy proxy below already lets `next build` collect page data without a
 * database, but statically prerendered pages still run their queries during the
 * export step and take the whole build down with them. Preview deployments do
 * not carry DATABASE_URL, so pages that prerender should check this and render
 * their empty state instead of querying. ISR fills in real data on the first
 * request served by an environment that does have a database.
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

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
