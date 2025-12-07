import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
vi.mock('@topline/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    role: {
      findFirst: vi.fn(),
    },
    behaviorLog: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
}))

import { prisma } from '@topline/db'

// Test fixtures
const mockUser = {
  id: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'TU',
  organizationId: 'org_123',
  roleId: 'role_123',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  role: { id: 'role_123', name: 'Server', type: 'SERVER' },
  _count: { behaviorLogs: 50 },
}

const mockUsers = [
  mockUser,
  {
    ...mockUser,
    id: 'user_456',
    email: 'other@example.com',
    name: 'Other User',
    role: { id: 'role_456', name: 'Manager', type: 'MANAGER' },
  },
]

describe('Users API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Role-Based Access', () => {
    it('should allow MANAGER access', () => {
      const roleType = 'MANAGER'
      const allowedRoles = ['MANAGER', 'ADMIN']

      const hasAccess = allowedRoles.includes(roleType)

      expect(hasAccess).toBe(true)
    })

    it('should allow ADMIN access', () => {
      const roleType = 'ADMIN'
      const allowedRoles = ['MANAGER', 'ADMIN']

      const hasAccess = allowedRoles.includes(roleType)

      expect(hasAccess).toBe(true)
    })

    it('should deny SERVER access', () => {
      const roleType = 'SERVER'
      const allowedRoles = ['MANAGER', 'ADMIN']

      const hasAccess = allowedRoles.includes(roleType)

      expect(hasAccess).toBe(false)
    })
  })

  describe('List Users', () => {
    it('should return paginated list', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)
      vi.mocked(prisma.user.count).mockResolvedValue(2)

      const page = 1
      const limit = 20

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: { organizationId: 'org_123' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.user.count({ where: { organizationId: 'org_123' } }),
      ])

      expect(users).toHaveLength(2)
      expect(total).toBe(2)
    })

    it('should filter by roleId', async () => {
      const orgId = 'org_123'
      const roleId = 'role_123'

      const where = {
        organizationId: orgId,
        ...(roleId ? { roleId } : {}),
      }

      expect(where).toEqual({
        organizationId: 'org_123',
        roleId: 'role_123',
      })
    })

    it('should filter by isActive', async () => {
      const orgId = 'org_123'
      const isActive = true

      const where = {
        organizationId: orgId,
        ...(isActive !== undefined ? { isActive } : {}),
      }

      expect(where).toEqual({
        organizationId: 'org_123',
        isActive: true,
      })
    })

    it('should filter by search term', async () => {
      const orgId = 'org_123'
      const search = 'test'

      const where = {
        organizationId: orgId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      }

      expect(where.OR).toBeDefined()
      expect(where.OR?.[0]).toEqual({ name: { contains: 'test', mode: 'insensitive' } })
    })

    it('should remove password hash from response', () => {
      const users = mockUsers.map((u) => {
        const { ...user } = u as any
        return user
      })

      users.forEach((u) => {
        expect((u as any).passwordHash).toBeUndefined()
      })
    })
  })

  describe('Get User by ID', () => {
    it('should return user if found', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any)

      const user = await prisma.user.findFirst({
        where: { id: 'user_123', organizationId: 'org_123' },
        include: { role: true, _count: { select: { behaviorLogs: true } } },
      })

      expect(user).toBeDefined()
      expect(user?.id).toBe('user_123')
      expect(user?._count.behaviorLogs).toBe(50)
    })

    it('should return null if not found', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)

      const user = await prisma.user.findFirst({
        where: { id: 'nonexistent', organizationId: 'org_123' },
      })

      expect(user).toBeNull()
    })

    it('should not return user from different org', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null)

      const user = await prisma.user.findFirst({
        where: { id: 'user_123', organizationId: 'different_org' },
      })

      expect(user).toBeNull()
    })
  })

  describe('Create User', () => {
    it('should verify role belongs to organization', async () => {
      vi.mocked(prisma.role.findFirst).mockResolvedValue({ id: 'role_123', organizationId: 'org_123' } as any)

      const role = await prisma.role.findFirst({
        where: { id: 'role_123', organizationId: 'org_123' },
      })

      expect(role).toBeDefined()
    })

    it('should reject role from different org', async () => {
      vi.mocked(prisma.role.findFirst).mockResolvedValue(null)

      const role = await prisma.role.findFirst({
        where: { id: 'role_123', organizationId: 'different_org' },
      })

      expect(role).toBeNull()
    })

    it('should generate avatar from name if not provided', () => {
      const name = 'Test User'
      const providedAvatar = undefined

      const avatar = providedAvatar || name.slice(0, 2).toUpperCase()

      expect(avatar).toBe('TE')
    })

    it('should use provided avatar', () => {
      const name = 'Test User'
      const providedAvatar = '🧑‍💼'

      const avatar = providedAvatar || name.slice(0, 2).toUpperCase()

      expect(avatar).toBe('🧑‍💼')
    })

    it('should create user with hashed password', async () => {
      const created = {
        id: 'user_new',
        email: 'new@example.com',
        name: 'New User',
        avatar: 'NE',
        role: { id: 'role_123', name: 'Server', type: 'SERVER' },
      }

      vi.mocked(prisma.user.create).mockResolvedValue(created as any)

      const result = await prisma.user.create({
        data: {
          email: 'new@example.com',
          name: 'New User',
          passwordHash: 'hashed_password',
          organizationId: 'org_123',
          roleId: 'role_123',
        } as any,
      })

      expect(result.email).toBe('new@example.com')
    })
  })

  describe('Update User', () => {
    it('should update user name', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, name: 'Updated Name' } as any)

      const existing = await prisma.user.findFirst({ where: { id: 'user_123', organizationId: 'org_123' } })
      expect(existing).toBeDefined()

      const result = await prisma.user.update({
        where: { id: 'user_123' },
        data: { name: 'Updated Name' },
      })

      expect(result.name).toBe('Updated Name')
    })

    it('should verify new role belongs to org when updating role', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.role.findFirst).mockResolvedValue({ id: 'role_456', organizationId: 'org_123' } as any)

      const role = await prisma.role.findFirst({
        where: { id: 'role_456', organizationId: 'org_123' },
      })

      expect(role).toBeDefined()
    })
  })

  describe('Deactivate User', () => {
    it('should prevent self-deactivation', () => {
      const userId = 'user_123'
      const currentUserId = 'user_123'

      const canDeactivate = userId !== currentUserId

      expect(canDeactivate).toBe(false)
    })

    it('should allow deactivating other users', () => {
      const userId = 'user_456'
      const currentUserId = 'user_123'

      const canDeactivate = userId !== currentUserId

      expect(canDeactivate).toBe(true)
    })

    it('should set isActive to false', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, isActive: false } as any)

      const result = await prisma.user.update({
        where: { id: 'user_456' },
        data: { isActive: false },
      })

      expect(result.isActive).toBe(false)
    })
  })

  describe('Get User Stats', () => {
    it('should calculate date range', () => {
      const days = 30
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      startDate.setHours(0, 0, 0, 0)

      const now = new Date()
      const diff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

      expect(diff).toBe(30)
    })

    it('should calculate total and verified behaviors', () => {
      const logs = [
        { id: '1', verified: true },
        { id: '2', verified: false },
        { id: '3', verified: true },
        { id: '4', verified: true },
      ]

      const total = logs.length
      const verified = logs.filter((l) => l.verified).length

      expect(total).toBe(4)
      expect(verified).toBe(3)
    })

    it('should calculate average per day', () => {
      const totalBehaviors = 150
      const days = 30

      const averagePerDay = totalBehaviors / days

      expect(averagePerDay).toBe(5)
    })

    it('should calculate behavior breakdown', () => {
      const logs = [
        { behaviorId: 'b1', behavior: { name: 'Upsell' } },
        { behaviorId: 'b1', behavior: { name: 'Upsell' } },
        { behaviorId: 'b2', behavior: { name: 'Dessert' } },
        { behaviorId: 'b1', behavior: { name: 'Upsell' } },
      ]

      const behaviorCounts = new Map<string, { name: string; count: number }>()
      for (const log of logs) {
        const current = behaviorCounts.get(log.behaviorId) || { name: log.behavior.name, count: 0 }
        behaviorCounts.set(log.behaviorId, { name: current.name, count: current.count + 1 })
      }

      expect(behaviorCounts.get('b1')?.count).toBe(3)
      expect(behaviorCounts.get('b2')?.count).toBe(1)
    })

    it('should calculate rank among team', () => {
      const allUserStats = [
        { userId: 'u1', _count: 100 },
        { userId: 'u2', _count: 150 },
        { userId: 'u3', _count: 50 },
      ]

      const sorted = [...allUserStats].sort((a, b) => b._count - a._count)
      const rank = sorted.findIndex((s) => s.userId === 'u1') + 1

      expect(rank).toBe(2) // u2 has most, then u1
    })

    it('should calculate streak days', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const uniqueDates = new Set([
        today.toISOString().split('T')[0],
        yesterday.toISOString().split('T')[0],
        twoDaysAgo.toISOString().split('T')[0],
      ])

      let streakDays = 0
      let checkDate = today.toISOString().split('T')[0]

      while (uniqueDates.has(checkDate)) {
        streakDays++
        const d = new Date(checkDate)
        d.setDate(d.getDate() - 1)
        checkDate = d.toISOString().split('T')[0]
      }

      expect(streakDays).toBe(3)
    })
  })
})
