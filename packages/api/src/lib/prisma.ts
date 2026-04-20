import { PrismaClient } from '@prisma/client'

/**
 * Prisma client singleton.
 *
 * In development, Next.js/tsx hot reloading creates new module instances
 * on every file change, which would create a new PrismaClient connection
 * each time and exhaust the connection pool quickly.
 *
 * This pattern stores the client on the global object in development
 * so it survives hot reloads. In production a fresh client is fine
 * because the process doesn't reload.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}