// lib/db.ts
import { PrismaClient } from "@prisma/client";

// Keep a single Prisma instance during dev (avoids exhausting DB connections)
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: ["query", "error", "warn"], // <- uncomment if you want logs in dev
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
