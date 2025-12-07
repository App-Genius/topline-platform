import { vi } from 'vitest'
import * as jose from 'jose'

// JWT Secret for testing
const JWT_SECRET = new TextEncoder().encode('test-jwt-secret-for-testing-only')

// Generate a test token
export async function generateTestToken(payload: {
  userId: string
  email: string
  orgId: string
  roleType: string
  permissions: string[]
}) {
  const now = Math.floor(Date.now() / 1000)

  const token = await new jose.SignJWT({
    sub: payload.userId,
    email: payload.email,
    orgId: payload.orgId,
    roleType: payload.roleType,
    permissions: payload.permissions,
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(JWT_SECRET)

  return token
}

// Test fixtures
export const fixtures = {
  organization: {
    id: 'org_test_123',
    name: 'Test Restaurant',
    industry: 'RESTAURANT' as const,
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  adminRole: {
    id: 'role_admin_123',
    name: 'Admin',
    type: 'ADMIN' as const,
    permissions: ['*'],
    organizationId: 'org_test_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  serverRole: {
    id: 'role_server_123',
    name: 'Server',
    type: 'SERVER' as const,
    permissions: ['read:own', 'write:behaviors'],
    organizationId: 'org_test_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  adminUser: {
    id: 'user_admin_123',
    email: 'admin@test.com',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LedEJ3b2T3J3P3MBm', // "password123"
    name: 'Test Admin',
    avatar: 'TA',
    organizationId: 'org_test_123',
    roleId: 'role_admin_123',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  staffUser: {
    id: 'user_staff_123',
    email: 'staff@test.com',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LedEJ3b2T3J3P3MBm', // "password123"
    name: 'Test Staff',
    avatar: 'TS',
    organizationId: 'org_test_123',
    roleId: 'role_server_123',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  behavior: {
    id: 'behavior_123',
    name: 'Upsell Wine',
    description: 'Suggest a bottle instead of a glass',
    targetPerDay: 5,
    points: 2,
    isActive: true,
    organizationId: 'org_test_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  location: {
    id: 'location_123',
    name: 'Main Location',
    address: '123 Test Street',
    organizationId: 'org_test_123',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

// Create a mock Prisma client
export function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    behavior: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    behaviorLog: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    location: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    dailyEntry: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn({
      organization: { create: vi.fn() },
      role: { create: vi.fn() },
      location: { create: vi.fn() },
      user: { create: vi.fn() },
    })),
  }
}

// Helper to make authenticated requests
export function createAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}
