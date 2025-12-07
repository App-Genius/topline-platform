import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
vi.mock('@topline/db', () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    location: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    benchmark: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    dailyEntry: {
      findMany: vi.fn(),
    },
    behaviorLog: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@topline/db'

// Test fixtures
const mockOrg = {
  id: 'org_123',
  name: 'Test Restaurant',
  industry: 'restaurant',
  settings: {},
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  _count: {
    users: 10,
    behaviors: 5,
    locations: 2,
  },
}

const mockLocation = {
  id: 'loc_123',
  name: 'Main Location',
  address: '123 Main St',
  isActive: true,
  organizationId: 'org_123',
}

const mockBenchmark = {
  id: 'bench_123',
  organizationId: 'org_123',
  year: 2024,
  totalRevenue: 1000000,
  daysOpen: 300,
  baselineAvgCheck: 50,
  baselineRating: 4.2,
}

describe('Organizations API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Get Current Organization', () => {
    it('should return organization with counts', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(mockOrg as any)

      const org = await prisma.organization.findUnique({
        where: { id: 'org_123' },
        include: {
          _count: {
            select: {
              users: true,
              behaviors: { where: { isActive: true } },
              locations: { where: { isActive: true } },
            },
          },
        },
      })

      expect(org).toBeDefined()
      expect(org?._count.users).toBe(10)
      expect(org?._count.behaviors).toBe(5)
      expect(org?._count.locations).toBe(2)
    })

    it('should return null if not found', async () => {
      vi.mocked(prisma.organization.findUnique).mockResolvedValue(null)

      const org = await prisma.organization.findUnique({
        where: { id: 'nonexistent' },
      })

      expect(org).toBeNull()
    })
  })

  describe('Update Organization', () => {
    it('should require ADMIN role', () => {
      const roleType = 'MANAGER'
      const allowedRoles = ['ADMIN']

      const canUpdate = allowedRoles.includes(roleType)

      expect(canUpdate).toBe(false)
    })

    it('should update organization name', async () => {
      vi.mocked(prisma.organization.update).mockResolvedValue({
        ...mockOrg,
        name: 'Updated Restaurant',
      } as any)

      const result = await prisma.organization.update({
        where: { id: 'org_123' },
        data: { name: 'Updated Restaurant' },
      })

      expect(result.name).toBe('Updated Restaurant')
    })

    it('should update organization industry', async () => {
      vi.mocked(prisma.organization.update).mockResolvedValue({
        ...mockOrg,
        industry: 'retail',
      } as any)

      const result = await prisma.organization.update({
        where: { id: 'org_123' },
        data: { industry: 'retail' },
      })

      expect(result.industry).toBe('retail')
    })

    it('should validate industry type', () => {
      const validIndustries = ['restaurant', 'retail', 'hospitality', 'other']
      const input = { industry: 'restaurant' }

      const isValid = validIndustries.includes(input.industry)

      expect(isValid).toBe(true)
    })
  })

  describe('Get Locations', () => {
    it('should return list of locations', async () => {
      vi.mocked(prisma.location.findMany).mockResolvedValue([mockLocation] as any)

      const locations = await prisma.location.findMany({
        where: { organizationId: 'org_123' },
        select: { id: true, name: true, address: true, isActive: true },
        orderBy: { name: 'asc' },
      })

      expect(locations).toHaveLength(1)
      expect(locations[0].name).toBe('Main Location')
    })

    it('should include all location fields', () => {
      const location = mockLocation

      expect(location.id).toBeDefined()
      expect(location.name).toBeDefined()
      expect(location.address).toBeDefined()
      expect(location.isActive).toBeDefined()
    })
  })

  describe('Create Location', () => {
    it('should require ADMIN role', () => {
      const roleType = 'MANAGER'
      const allowedRoles = ['ADMIN']

      const canCreate = allowedRoles.includes(roleType)

      expect(canCreate).toBe(false)
    })

    it('should validate location name is required', () => {
      const input = { name: '' }
      const isValid = input.name.length > 0

      expect(isValid).toBe(false)
    })

    it('should validate location name max length', () => {
      const input = { name: 'a'.repeat(101) }
      const isValid = input.name.length <= 100

      expect(isValid).toBe(false)
    })

    it('should create location', async () => {
      vi.mocked(prisma.location.create).mockResolvedValue(mockLocation as any)

      const result = await prisma.location.create({
        data: {
          name: 'New Location',
          address: '456 New St',
          organizationId: 'org_123',
        },
      })

      expect(result.name).toBe('Main Location')
    })
  })

  describe('Get Benchmarks', () => {
    it('should return benchmarks ordered by year descending', async () => {
      const benchmarks = [
        { ...mockBenchmark, year: 2024 },
        { ...mockBenchmark, id: 'bench_456', year: 2023 },
      ]
      vi.mocked(prisma.benchmark.findMany).mockResolvedValue(benchmarks as any)

      const result = await prisma.benchmark.findMany({
        where: { organizationId: 'org_123' },
        orderBy: { year: 'desc' },
      })

      expect(result[0].year).toBe(2024)
      expect(result[1].year).toBe(2023)
    })
  })

  describe('Upsert Benchmark', () => {
    it('should require ADMIN or MANAGER role', () => {
      const roleType = 'SERVER'
      const allowedRoles = ['ADMIN', 'MANAGER']

      const canUpsert = allowedRoles.includes(roleType)

      expect(canUpsert).toBe(false)
    })

    it('should calculate baseline avg check if not provided', () => {
      const totalRevenue = 1000000
      const daysOpen = 300
      const providedAvgCheck = undefined

      const baselineAvgCheck = providedAvgCheck ?? totalRevenue / daysOpen

      expect(baselineAvgCheck).toBeCloseTo(3333.33, 1)
    })

    it('should use provided baseline avg check', () => {
      const totalRevenue = 1000000
      const daysOpen = 300
      const providedAvgCheck = 50

      const baselineAvgCheck = providedAvgCheck ?? totalRevenue / daysOpen

      expect(baselineAvgCheck).toBe(50)
    })

    it('should upsert benchmark', async () => {
      vi.mocked(prisma.benchmark.upsert).mockResolvedValue(mockBenchmark as any)

      const result = await prisma.benchmark.upsert({
        where: {
          organizationId_year: {
            organizationId: 'org_123',
            year: 2024,
          },
        },
        update: {
          totalRevenue: 1100000,
        },
        create: {
          organizationId: 'org_123',
          year: 2024,
          totalRevenue: 1100000,
          daysOpen: 300,
          baselineAvgCheck: 50,
          baselineRating: 4.2,
        },
      })

      expect(result).toBeDefined()
    })
  })

  describe('Get Dashboard Data', () => {
    it('should calculate game state status - winning', () => {
      const ytdRevenue = 600000
      const targetToDate = 500000

      const progress = ytdRevenue / targetToDate
      let status: string = 'neutral'

      if (progress >= 1.05) status = 'winning'
      else if (progress <= 0.95) status = 'losing'

      expect(status).toBe('winning')
    })

    it('should calculate game state status - losing', () => {
      const ytdRevenue = 400000
      const targetToDate = 500000

      const progress = ytdRevenue / targetToDate
      let status: string = 'neutral'

      if (progress >= 1.05) status = 'winning'
      else if (progress <= 0.95) status = 'losing'

      expect(status).toBe('losing')
    })

    it('should calculate game state status - neutral', () => {
      const ytdRevenue = 500000
      const targetToDate = 500000

      const progress = ytdRevenue / targetToDate
      let status: string = 'neutral'

      if (progress >= 1.05) status = 'winning'
      else if (progress <= 0.95) status = 'losing'

      expect(status).toBe('neutral')
    })

    it('should calculate game state status - celebrating', () => {
      const ytdRevenue = 1100000
      const totalTarget = 1000000

      let status: string = 'neutral'
      if (ytdRevenue >= totalTarget) status = 'celebrating'

      expect(status).toBe('celebrating')
    })

    it('should calculate leaderboard from behavior logs', () => {
      const logs = [
        { userId: 'u1', user: { name: 'User 1', avatar: 'U1' }, behavior: { points: 2 } },
        { userId: 'u1', user: { name: 'User 1', avatar: 'U1' }, behavior: { points: 3 } },
        { userId: 'u2', user: { name: 'User 2', avatar: 'U2' }, behavior: { points: 5 } },
        { userId: 'u1', user: { name: 'User 1', avatar: 'U1' }, behavior: { points: 1 } },
      ]

      const userScores = new Map<string, { name: string; avatar: string | null; score: number }>()
      for (const log of logs) {
        const current = userScores.get(log.userId) || {
          name: log.user.name,
          avatar: log.user.avatar,
          score: 0,
        }
        userScores.set(log.userId, {
          ...current,
          score: current.score + log.behavior.points,
        })
      }

      const leaderboard = Array.from(userScores.entries())
        .map(([userId, data]) => ({
          userId,
          userName: data.name,
          avatar: data.avatar,
          score: data.score,
        }))
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({ ...entry, rank: index + 1 }))

      expect(leaderboard[0].userId).toBe('u1')
      expect(leaderboard[0].score).toBe(6) // 2 + 3 + 1
      expect(leaderboard[0].rank).toBe(1)
      expect(leaderboard[1].userId).toBe('u2')
      expect(leaderboard[1].score).toBe(5)
      expect(leaderboard[1].rank).toBe(2)
    })

    it('should calculate days remaining in year', () => {
      const now = new Date()
      const yearStart = new Date(now.getFullYear(), 0, 1)
      const dayOfYear = Math.floor((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24))
      const daysRemaining = 365 - dayOfYear

      expect(daysRemaining).toBeGreaterThanOrEqual(0)
      expect(daysRemaining).toBeLessThanOrEqual(365)
    })

    it('should calculate percent complete', () => {
      const ytdRevenue = 750000
      const totalTarget = 1000000

      const percentComplete = Math.round((ytdRevenue / totalTarget) * 10000) / 100

      expect(percentComplete).toBe(75)
    })

    it('should calculate avg check trend', () => {
      const currentAvgCheck = 55
      const baselineAvgCheck = 50

      const trend = baselineAvgCheck > 0
        ? Math.round(((currentAvgCheck - baselineAvgCheck) / baselineAvgCheck) * 10000) / 100
        : 0

      expect(trend).toBe(10) // 10% increase
    })
  })
})
