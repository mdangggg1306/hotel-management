/**
 * Mock PrismaClient dùng jest-mock-extended
 * Toàn bộ test backend sẽ dùng mock này thay vì kết nối database thật.
 * Không cần database, không cần .env để chạy test.
 */
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Export mock instance để dùng trong test files
export const prisma = mockDeep<PrismaClient>();

// Reset tất cả mock giữa mỗi test
beforeEach(() => {
  mockReset(prisma);
});

export default prisma;

// Re-export toàn bộ types từ Prisma để test có thể dùng
export * from '@prisma/client';
