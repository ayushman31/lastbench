import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const adapter = new PrismaPg({connectionString : process.env.DATABASE_URL!})

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // accelerateUrl: process.env.ACCELERATE_URL ?? '',
  })
// to prevent hot reloading from creating new instances of PrismaClient.....read more in the last comment
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
// to fix the error that we were gettting we added "types": ["node"]  in the typescript-config/base.json file

export * from '../generated/prisma/client'


// read about above from the following link : https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#prevent-hot-reloading-from-creating-new-instances-of-prismaclient