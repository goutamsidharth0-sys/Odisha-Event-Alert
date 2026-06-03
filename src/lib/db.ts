import { PrismaClient } from "@prisma/client";


// In development, Next.js can hot-reload files causing multiple instances of PrismaClient.
// We attach PrismaClient to the global object to prevent this.
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
