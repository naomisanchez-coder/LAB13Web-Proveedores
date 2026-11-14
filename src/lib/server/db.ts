import "server-only";
import { PrismaClient } from "@prisma/client";

const globalDb = globalThis as unknown as { lab13Prisma?: PrismaClient };

export class DatabaseUnavailableError extends Error {
  constructor() { super("Servicio de cuentas temporalmente no disponible."); }
}

export function getDb(): PrismaClient {
  if (!process.env.DATABASE_URL?.trim()) throw new DatabaseUnavailableError();
  // Una instancia por proceso; en serverless debe usarse una URL con pooling.
  if (!globalDb.lab13Prisma) globalDb.lab13Prisma = new PrismaClient({ log: [] });
  return globalDb.lab13Prisma;
}
