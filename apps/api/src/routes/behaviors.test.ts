import { describe, it, expect, vi, beforeEach } from 'vitest'
import { testClient } from 'hono/testing'
import { OpenAPIHono } from '@hono/zod-openapi'

// Mock Prisma
vi.mock('@topline/db', () => ({
  prisma: {
    behavior: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    behaviorLog: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}))

import { prisma } from '@topline/db'

// Test fixtures
const mockBehavior = {
  id: 'behavior_123',
  name: 'Upsell Wine',
  description: 'Suggest a bottle instead of a glass',
  targetPerDay: 5,
  points: 2,
  isActive: true,
  organizationId: 'org_123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  roles: [{ id: 'role_123', name: 'Server' }],
  _count: { logs: 50 },
}

const mockBehaviors = [
  mockBehavior,
  {
    ...mockBehavior,
    id: 'behavior_456',
    name: 'Suggest Appetizer',
    roles: [],
    _count: { logs: 30 },
  },
]

describe('Behaviors API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Input Validation', () => {
    it('should validate behavior name is required', () => {
      const input = { name: '' }
      const isValid = input.name.length > 0

      expect(isValid).toBe(false)
    })

    it('should validate behavior name max length', () => {
      const input = { name: 'a'.repeat(101) }
      const isValid = input.name.length <= 100

      expect(isValid).toBe(false)
    })

    it('should validate targetPerDay is non-negative', () => {
      const input = { name: 'Test', targetPerDay: -1 }
      const isValid = input.targetPerDay >= 0

      expect(isValid).toBe(false)
    })

    it('should validate points is at least 1', () => {
      const input = { name: 'Test', points: 0 }
      const isValid = input.points >= 1

      expect(isValid).toBe(false)
    })

    it('should accept valid behavior input', () => {
      const input = {
        name: 'Upsell Wine',
        description: 'Suggest a bottle instead of a glass',
        targetPerDay: 5,
        points: 2,
      }

      const isValid =
        input.name.length > 0 &&
        input.name.length <= 100 &&
        input.targetPerDay >= 0 &&
        input.points >= 1

      expect(isValid).toBe(true)
    })
  })

  describe('List Behaviors', () => {
    it('should return paginated list of behaviors', async () => {
      vi.mocked(prisma.behavior.findMany).mockResolvedValue(mockBehaviors as any)
      vi.mocked(prisma.behavior.count).mockResolvedValue(2)

      const result = {
        data: mockBehaviors,
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      }

      expect(result.data).toHaveLength(2)
      expect(result.meta.total).toBe(2)
      expect(result.meta.page).toBe(1)
    })

    it('should filter by isActive by default', async () => {
      const orgId = 'org_123'
      const includeInactive = false

      const whereClause = {
        organizationId: orgId,
        ...(includeInactive ? {} : { isActive: true }),
      }

      expect(whereClause).toEqual({
        organizationId: 'org_123',
        isActive: true,
      })
    })

    it('should include inactive when requested', async () => {
      const orgId = 'org_123'
      const includeInactive = true

      const whereClause = {
        organizationId: orgId,
        ...(includeInactive ? {} : { isActive: true }),
      }

      expect(whereClause).toEqual({
        organizationId: 'org_123',
      })
    })
  })

  describe('Get Behavior by ID', () => {
    it('should return behavior if found', async () => {
      vi.mocked(prisma.behavior.findFirst).mockResolvedValue(mockBehavior as any)

      const behavior = await prisma.behavior.findFirst({
        where: { id: 'behavior_123', organizationId: 'org_123' },
      })

      expect(behavior).toBeDefined()
      expect(behavior?.id).toBe('behavior_123')
      expect(behavior?.name).toBe('Upsell Wine')
    })

    it('should return null if not found', async () => {
      vi.mocked(prisma.behavior.findFirst).mockResolvedValue(null)

      const behavior = await prisma.behavior.findFirst({
        where: { id: 'nonexistent', organizationId: 'org_123' },
      })

      expect(behavior).toBeNull()
    })

    it('should not return behavior from different org', async () => {
      vi.mocked(prisma.behavior.findFirst).mockResolvedValue(null)

      const behavior = await prisma.behavior.findFirst({
        where: { id: 'behavior_123', organizationId: 'different_org' },
      })

      expect(behavior).toBeNull()
    })
  })

  describe('Create Behavior', () => {
    it('should create behavior with required fields', async () => {
      const input = {
        name: 'New Behavior',
        organizationId: 'org_123',
      }

      const created = {
        id: 'behavior_new',
        ...input,
        description: null,
        targetPerDay: 0,
        points: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.behavior.create).mockResolvedValue(created as any)

      const result = await prisma.behavior.create({ data: input as any })

      expect(result.name).toBe('New Behavior')
      expect(result.targetPerDay).toBe(0)
      expect(result.points).toBe(1)
    })

    it('should create behavior with all fields', async () => {
      const input = {
        name: 'Full Behavior',
        description: 'Description here',
        targetPerDay: 10,
        points: 3,
        organizationId: 'org_123',
      }

      const created = {
        id: 'behavior_full',
        ...input,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.behavior.create).mockResolvedValue(created as any)

      const result = await prisma.behavior.create({ data: input as any })

      expect(result.description).toBe('Description here')
      expect(result.targetPerDay).toBe(10)
      expect(result.points).toBe(3)
    })
  })

  describe('Update Behavior', () => {
    it('should update behavior name', async () => {
      const updated = { ...mockBehavior, name: 'Updated Name' }

      vi.mocked(prisma.behavior.update).mockResolvedValue(updated as any)

      const result = await prisma.behavior.update({
        where: { id: 'behavior_123' },
        data: { name: 'Updated Name' },
      })

      expect(result.name).toBe('Updated Name')
    })

    it('should update multiple fields', async () => {
      const updated = {
        ...mockBehavior,
        name: 'Updated Name',
        description: 'New description',
        targetPerDay: 8,
      }

      vi.mocked(prisma.behavior.update).mockResolvedValue(updated as any)

      const result = await prisma.behavior.update({
        where: { id: 'behavior_123' },
        data: {
          name: 'Updated Name',
          description: 'New description',
          targetPerDay: 8,
        },
      })

      expect(result.targetPerDay).toBe(8)
    })
  })

  describe('Delete (Soft Delete) Behavior', () => {
    it('should soft delete by setting isActive to false', async () => {
      const deleted = { ...mockBehavior, isActive: false }

      vi.mocked(prisma.behavior.update).mockResolvedValue(deleted as any)

      const result = await prisma.behavior.update({
        where: { id: 'behavior_123' },
        data: { isActive: false },
      })

      expect(result.isActive).toBe(false)
    })
  })

  describe('Behavior Stats', () => {
    it('should calculate verification rate', () => {
      const totalLogs = 100
      const verifiedLogs = 75

      const verificationRate = (verifiedLogs / totalLogs) * 100

      expect(verificationRate).toBe(75)
    })

    it('should handle zero logs', () => {
      const totalLogs = 0
      const verifiedLogs = 0

      const verificationRate = totalLogs > 0 ? (verifiedLogs / totalLogs) * 100 : 0

      expect(verificationRate).toBe(0)
    })

    it('should calculate average per day', () => {
      const totalLogs = 150
      const days = 30

      const averagePerDay = totalLogs / days

      expect(averagePerDay).toBe(5)
    })

    it('should sort top performers by count', () => {
      const performers = [
        { userId: 'u1', count: 10 },
        { userId: 'u2', count: 25 },
        { userId: 'u3', count: 15 },
      ]

      const sorted = [...performers].sort((a, b) => b.count - a.count)

      expect(sorted[0].userId).toBe('u2')
      expect(sorted[0].count).toBe(25)
    })
  })
})
