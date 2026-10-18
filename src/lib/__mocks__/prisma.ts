import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';
import { vi, beforeEach } from 'vitest';
import prisma from '../prisma';

// We need to mock the prisma singleton
vi.mock('../prisma', () => ({
  default: mockDeep<PrismaClient>(),
}));

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});

export default prismaMock;
