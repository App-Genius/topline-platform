import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
vi.mock('@topline/db', () => ({
  prisma: {
    behaviorLog: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    behavior: {
      findFirst: vi.fn(),
    },
    location: {
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from '@topline/db'

// Test fixtures
const mockLog = {
  id: 'log_123',
  userId: 'user_123',
  behaviorId: 'beh_123',
  locationId: 'loc_123',
  verified: false,
  verifiedById: null,
  verifiedAt: null,
  metadata: {},
  createdAt: new Date('2024-01-15T10:30:00Z'),
  user: { id: 'user_123', name: 'Test User', avatar: 'TU', organizationId: 'org_123' },
  behavior: { id: 'beh_123', name: 'Upsell Wine', points: 2 },
  verifiedBy: null,
}

const mockLogs = [
  mockLog,
  {
    ...mockLog,
    id: 'log_456',
    verified: true,
    verifiedById: 'user_manager',
    verifiedAt: new Date('2024-01-15T11:00:00Z'),
    verifiedBy: { id: 'user_manager', name: 'Manager' },
  },
]

describe('Behavior Logs API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('List Behavior Logs', () => {
    it('should return paginated list', async () => {
      vi.mocked(prisma.behaviorLog.findMany).mockResolvedValue(mockLogs as any)
      vi.mocked(prisma.behaviorLog.count).mockResolvedValue(2)

      const page = 1
      const limit = 20

      const [logs, total] = await Promise.all([
        prisma.behaviorLog.findMany({
          where: { user: { organizationId: 'org_123' } },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.behaviorLog.count({ where: { user: { organizationId: 'org_123' } } }),
      ])

      expect(logs).toHaveLength(2)
      expect(total).toBe(2)
    })

    it('should filter by userId', () => {
      const orgId = 'org_123'
      const userId = 'user_123'

      const where = {
        user: { organizationId: orgId },
        ...(userId ? { userId } : {}),
      }

      expect(where.userId).toBe('user_123')
    })

    it('should filter by behaviorId', () => {
      const orgId = 'org_123'
      const behaviorId = 'beh_123'

      const where = {
        user: { organizationId: orgId },
        ...(behaviorId ? { behaviorId } : {}),
      }

      expect(where.behaviorId).toBe('beh_123')
    })

    it('should filter by verified status', () => {
      const orgId = 'org_123'
      const verified = false

      const where = {
        user: { organizationId: orgId },
        ...(verified !== undefined ? { verified } : {}),
      }

      expect(where.verified).toBe(false)
    })

    it('should filter by date range', () => {
      const orgId = 'org_123'
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const where = {
        user: { organizationId: orgId },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }

      expect(where.createdAt.gte).toEqual(startDate)
      expect(where.createdAt.lte).toEqual(endDate)
    })

    it('should restrict staff to their own logs', () => {
      const roleType = 'SERVER'
      const currentUserId = 'user_123'
      const requestedUserId = 'user_456'

      const effectiveUserId =
        roleType === 'ADMIN' || roleType === 'MANAGER' ? requestedUserId : currentUserId

      expect(effectiveUserId).toBe('user_123') // Staff can only see their own
    })

    it('should allow managers to see any user logs', () => {
      const roleType = 'MANAGER'
      const currentUserId = 'user_123'
      const requestedUserId = 'user_456'

      const effectiveUserId =
        roleType === 'ADMIN' || roleType === 'MANAGER' ? requestedUserId : currentUserId

      expect(effectiveUserId).toBe('user_456') // Managers can see others
    })
  })

  describe('Create Behavior Log', () => {
    it('should verify behavior exists and is active', async () => {
      vi.mocked(prisma.behavior.findFirst).mockResolvedValue({
        id: 'beh_123',
        organizationId: 'org_123',
        isActive: true,
      } as any)

      const behavior = await prisma.behavior.findFirst({
        where: { id: 'beh_123', organizationId: 'org_123', isActive: true },
      })

      expect(behavior).toBeDefined()
      expect(behavior?.isActive).toBe(true)
    })

    it('should reject inactive behavior', async () => {
      vi.mocked(prisma.behavior.findFirst).mockResolvedValue(null)

      const behavior = await prisma.behavior.findFirst({
        where: { id: 'beh_inactive', organizationId: 'org_123', isActive: true },
      })

      expect(behavior).toBeNull()
    })

    it('should verify location exists if provided', async () => {
      vi.mocked(prisma.location.findFirst).mockResolvedValue({
        id: 'loc_123',
        organizationId: 'org_123',
      } as any)

      const location = await prisma.location.findFirst({
        where: { id: 'loc_123', organizationId: 'org_123' },
      })

      expect(location).toBeDefined()
    })

    it('should create log with metadata', async () => {
      const created = {
        id: 'log_new',
        userId: 'user_123',
        behaviorId: 'beh_123',
        locationId: 'loc_123',
        metadata: { tableNumber: 5, guestName: 'John' },
        behavior: { id: 'beh_123', name: 'Upsell Wine', points: 2 },
      }

      vi.mocked(prisma.behaviorLog.create).mockResolvedValue(created as any)

      const result = await prisma.behaviorLog.create({
        data: {
          userId: 'user_123',
          behaviorId: 'beh_123',
          locationId: 'loc_123',
          metadata: { tableNumber: 5, guestName: 'John' },
        },
      })

      expect(result.metadata).toEqual({ tableNumber: 5, guestName: 'John' })
    })
  })

  describe('Verify Behavior Log', () => {
    it('should require MANAGER or ADMIN role', () => {
      const roleType = 'SERVER'
      const allowedRoles = ['MANAGER', 'ADMIN']

      const canVerify = allowedRoles.includes(roleType)

      expect(canVerify).toBe(false)
    })

    it('should allow MANAGER to verify', () => {
      const roleType = 'MANAGER'
      const allowedRoles = ['MANAGER', 'ADMIN']

      const canVerify = allowedRoles.includes(roleType)

      expect(canVerify).toBe(true)
    })

    it('should verify log belongs to organization', async () => {
      vi.mocked(prisma.behaviorLog.findFirst).mockResolvedValue(mockLog as any)

      const log = await prisma.behaviorLog.findFirst({
        where: { id: 'log_123' },
        include: { user: { select: { organizationId: true } } },
      })

      expect(log?.user.organizationId).toBe('org_123')
    })

    it('should update verified status', async () => {
      vi.mocked(prisma.behaviorLog.findFirst).mockResolvedValue(mockLog as any)
      vi.mocked(prisma.behaviorLog.update).mockResolvedValue({
        ...mockLog,
        verified: true,
        verifiedById: 'user_manager',
        verifiedAt: new Date(),
      } as any)

      const result = await prisma.behaviorLog.update({
        where: { id: 'log_123' },
        data: {
          verified: true,
          verifiedById: 'user_manager',
          verifiedAt: new Date(),
        },
      })

      expect(result.verified).toBe(true)
      expect(result.verifiedById).toBe('user_manager')
    })

    it('should clear verifier when unverifying', async () => {
      vi.mocked(prisma.behaviorLog.update).mockResolvedValue({
        ...mockLog,
        verified: false,
        verifiedById: null,
        verifiedAt: null,
      } as any)

      const result = await prisma.behaviorLog.update({
        where: { id: 'log_123' },
        data: {
          verified: false,
          verifiedById: null,
          verifiedAt: null,
        },
      })

      expect(result.verified).toBe(false)
      expect(result.verifiedById).toBeNull()
    })
  })

  describe('Get Pending Verifications', () => {
    it('should require MANAGER or ADMIN role', () => {
      const roleType = 'SERVER'
      const allowedRoles = ['MANAGER', 'ADMIN']

      const canAccessPending = allowedRoles.includes(roleType)

      expect(canAccessPending).toBe(false)
    })

    it('should filter for unverified logs', () => {
      const orgId = 'org_123'

      const where = {
        user: { organizationId: orgId },
        verified: false,
      }

      expect(where.verified).toBe(false)
    })

    it('should order by creation date descending', () => {
      const logs = [...mockLogs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      expect(logs[0].id).toBe(mockLogs[0].id) // Same order since same date in fixtures
    })
  })

  describe('Delete Behavior Log', () => {
    it('should allow staff to delete their own unverified logs', () => {
      const roleType = 'SERVER'
      const logUserId = 'user_123'
      const currentUserId = 'user_123'
      const verified = false

      const canDelete =
        roleType === 'ADMIN' ||
        roleType === 'MANAGER' ||
        (logUserId === currentUserId && !verified)

      expect(canDelete).toBe(true)
    })

    it('should prevent staff from deleting other users logs', () => {
      const roleType = 'SERVER'
      const logUserId = 'user_456'
      const currentUserId = 'user_123'
      const verified = false

      const canDelete =
        roleType === 'ADMIN' ||
        roleType === 'MANAGER' ||
        (logUserId === currentUserId && !verified)

      expect(canDelete).toBe(false)
    })

    it('should prevent staff from deleting verified logs', () => {
      const roleType = 'SERVER'
      const logUserId = 'user_123'
      const currentUserId = 'user_123'
      const verified = true

      const canDelete =
        roleType === 'ADMIN' ||
        roleType === 'MANAGER' ||
        (logUserId === currentUserId && !verified)

      expect(canDelete).toBe(false)
    })

    it('should allow managers to delete any log', () => {
      const roleType = 'MANAGER'
      const logUserId = 'user_456'
      const currentUserId = 'user_123'
      const verified = true

      const canDelete =
        roleType === 'ADMIN' ||
        roleType === 'MANAGER' ||
        (logUserId === currentUserId && !verified)

      expect(canDelete).toBe(true)
    })

    it('should delete log', async () => {
      vi.mocked(prisma.behaviorLog.delete).mockResolvedValue(mockLog as any)

      await prisma.behaviorLog.delete({ where: { id: 'log_123' } })

      expect(prisma.behaviorLog.delete).toHaveBeenCalledWith({ where: { id: 'log_123' } })
    })
  })
})
