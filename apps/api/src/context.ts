import { PrismaClient } from '@prisma/client'

export interface Context {
  db: PrismaClient
}

export const context = {
  db: new PrismaClient(),
}
