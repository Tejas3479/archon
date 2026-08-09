// WHY: Exports unified Prisma client instance and generated types for monorepo consumers
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export * from "@prisma/client";
