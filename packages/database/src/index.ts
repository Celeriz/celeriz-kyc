export { PrismaClient } from '@prisma/client';
export type { Prisma } from '@prisma/client';

export { prisma } from './client'; // exports instance of prisma
export * from '../generated/prisma'; // exports generated types from prisma

export * from './errors';
export * from './types';
