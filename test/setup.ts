import { beforeAll, afterAll, beforeEach, vi } from 'vitest'

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://topline:topline_dev@localhost:5432/topline_test'
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only'
process.env.NODE_ENV = 'test'

// Global test setup
beforeAll(async () => {
  // Any global setup
})

afterAll(async () => {
  // Any global cleanup
})

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})
