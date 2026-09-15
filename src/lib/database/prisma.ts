import { PrismaClient } from "@prisma/client";

/**
 * Standard Next.js pattern: in dev, hot reload would otherwise create a
 * new PrismaClient (and a new connection pool) on every file save. Stash
 * one instance on `globalThis` and reuse it.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
