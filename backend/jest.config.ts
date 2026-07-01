import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    // Mock prisma client to avoid actual DB connection
    '@prisma/client': '<rootDir>/src/__mocks__/prisma.ts',
  },
  // Reset mocks between each test
  clearMocks: true,
  restoreMocks: true,
};

export default config;
