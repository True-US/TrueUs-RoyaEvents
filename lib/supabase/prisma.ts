import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL,
  });
  return new PrismaClient({ adapter });
}

// In development, Next.js re-runs this module on every hot reload. Caching the
// client on globalThis reuses one connection pool instead of opening a new one
// per reload until Postgres runs out of connections.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

// For DB entities reads/writes
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
