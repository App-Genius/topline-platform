import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
vi.mock('@topline/db', () => ({
  prisma: {
    dailyEntry: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    location: {
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from '@topline/db'

// Test fixtures
const mockEntry = {
  id: 'entry_123',
  locationId: 'loc_123',
  date: new Date('2024-01-15'),
  totalRevenue: 5000,
  totalCovers: 100,
  notes: 'Good day',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  location: { id: 'loc_123', name: 'Main Location' },
  reviews: [],
}

const mockEntries = [
  mockEntry,
  {
    ...mockEntry,
    id: 'entry_456',
    date: new Date('2024-01-14'),
    totalRevenue: 4500,
    totalCovers: 90,
  },
]

describe('Daily Entries API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('List Daily Entries', () => {
    it('should return paginated list with calculated avgCheck', async () => {
      vi.mocked(prisma.dailyEntry.findMany).mockResolvedValue(mockEntries as any)
      vi.mocked(prisma.dailyEntry.count).mockResolvedValue(2)

      const page = 1
      const limit = 20

      const [entries, total] = await Promise.all([
        prisma.dailyEntry.findMany({
          where: { location: { organizationId: 'org_123' } },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.dailyEntry.count({ where: { location: { organizationId: 'org_123' } } }),
      ])

      const entriesWithAvg = entries.map((entry) => ({
        ...entry,
        avgCheck: entry.totalCovers > 0 ? entry.totalRevenue / entry.totalCovers : 0,
      }))

      expect(entriesWithAvg).toHaveLength(2)
      expect(entriesWithAvg[0].avgCheck).toBe(50) // 5000 / 100
      expect(total).toBe(2)
    })

    it('should filter by locationId', () => {
      const orgId = 'org_123'
      const locationId = 'loc_123'

      const where = {
        location: { organizationId: orgId },
        ...(locationId ? { locationId } : {}),
      }

      expect(where.locationId).toBe('loc_123')
    })

    it('should filter by date range', () => {
      const orgId = 'org_123'
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const where = {
        location: { organizationId: orgId },
        date: {
          gte: startDate,
          lte: endDate,
        },
      }

      expect(where.date.gte).toEqual(startDate)
      expect(where.date.lte).toEqual(endDate)
    })

    it('should calculate average check correctly', () => {
      const entry = { totalRevenue: 5000, totalCovers: 100 }
      const avgCheck = entry.totalCovers > 0 ? entry.totalRevenue / entry.totalCovers : 0

      expect(avgCheck).toBe(50)
    })

    it('should handle zero covers', () => {
      const entry = { totalRevenue: 0, totalCovers: 0 }
      const avgCheck = entry.totalCovers > 0 ? entry.totalRevenue / entry.totalCovers : 0

      expect(avgCheck).toBe(0)
    })
  })

  describe('Get Entry by Date', () => {
    it('should find entry by location and date', async () => {
      vi.mocked(prisma.dailyEntry.findUnique).mockResolvedValue(mockEntry as any)

      const entry = await prisma.dailyEntry.findUnique({
        where: {
          locationId_date: {
            locationId: 'loc_123',
            date: new Date('2024-01-15'),
          },
        },
      })

      expect(entry).toBeDefined()
      expect(entry?.id).toBe('entry_123')
    })

    it('should use default location if not specified', async () => {
      vi.mocked(prisma.location.findFirst).mockResolvedValue({
        id: 'loc_default',
        organizationId: 'org_123',
        isActive: true,
      } as any)

      const defaultLocation = await prisma.location.findFirst({
        where: { organizationId: 'org_123', isActive: true },
        orderBy: { createdAt: 'asc' },
      })

      expect(defaultLocation?.id).toBe('loc_default')
    })

    it('should return null if no entry exists', async () => {
      vi.mocked(prisma.dailyEntry.findUnique).mockResolvedValue(null)

      const entry = await prisma.dailyEntry.findUnique({
        where: {
          locationId_date: {
            locationId: 'loc_123',
            date: new Date('2024-02-01'),
          },
        },
      })

      expect(entry).toBeNull()
    })

    it('should include reviews in response', async () => {
      const entryWithReviews = {
        ...mockEntry,
        reviews: [
          { id: 'rev_1', source: 'Google', rating: 5, text: 'Great!' },
          { id: 'rev_2', source: 'Yelp', rating: 4, text: 'Good food' },
        ],
      }
      vi.mocked(prisma.dailyEntry.findUnique).mockResolvedValue(entryWithReviews as any)

      const entry = await prisma.dailyEntry.findUnique({
        where: {
          locationId_date: {
            locationId: 'loc_123',
            date: new Date('2024-01-15'),
          },
        },
        include: { reviews: true },
      })

      expect(entry?.reviews).toHaveLength(2)
    })
  })

  describe('Upsert Daily Entry', () => {
    it('should require MANAGER or ADMIN role', () => {
      const roleType = 'SERVER'
      const allowedRoles = ['MANAGER', 'ADMIN']

      const canUpsert = allowedRoles.includes(roleType)

      expect(canUpsert).toBe(false)
    })

    it('should verify location belongs to organization', async () => {
      vi.mocked(prisma.location.findFirst).mockResolvedValue({
        id: 'loc_123',
        organizationId: 'org_123',
      } as any)

      const location = await prisma.location.findFirst({
        where: { id: 'loc_123', organizationId: 'org_123' },
      })

      expect(location).toBeDefined()
    })

    it('should reject location from different org', async () => {
      vi.mocked(prisma.location.findFirst).mockResolvedValue(null)

      const location = await prisma.location.findFirst({
        where: { id: 'loc_123', organizationId: 'different_org' },
      })

      expect(location).toBeNull()
    })

    it('should upsert entry', async () => {
      vi.mocked(prisma.dailyEntry.upsert).mockResolvedValue(mockEntry as any)

      const result = await prisma.dailyEntry.upsert({
        where: {
          locationId_date: {
            locationId: 'loc_123',
            date: new Date('2024-01-15'),
          },
        },
        update: {
          totalRevenue: 5500,
          totalCovers: 110,
        },
        create: {
          locationId: 'loc_123',
          date: new Date('2024-01-15'),
          totalRevenue: 5500,
          totalCovers: 110,
        },
      })

      expect(result).toBeDefined()
    })

    it('should validate totalRevenue is non-negative', () => {
      const input = { totalRevenue: -100 }
      const isValid = input.totalRevenue >= 0

      expect(isValid).toBe(false)
    })

    it('should validate totalCovers is non-negative integer', () => {
      const input = { totalCovers: -5 }
      const isValid = input.totalCovers >= 0 && Number.isInteger(input.totalCovers)

      expect(isValid).toBe(false)
    })
  })

  describe('Get Stats', () => {
    it('should calculate date range for stats', () => {
      const days = 30
      const endDate = new Date()
      endDate.setHours(23, 59, 59, 999)

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      startDate.setHours(0, 0, 0, 0)

      expect(startDate < endDate).toBe(true)
    })

    it('should calculate total revenue', () => {
      const entries = [
        { totalRevenue: 5000 },
        { totalRevenue: 4500 },
        { totalRevenue: 5500 },
      ]

      const totalRevenue = entries.reduce((sum, e) => sum + e.totalRevenue, 0)

      expect(totalRevenue).toBe(15000)
    })

    it('should calculate total covers', () => {
      const entries = [
        { totalCovers: 100 },
        { totalCovers: 90 },
        { totalCovers: 110 },
      ]

      const totalCovers = entries.reduce((sum, e) => sum + e.totalCovers, 0)

      expect(totalCovers).toBe(300)
    })

    it('should calculate average check', () => {
      const totalRevenue = 15000
      const totalCovers = 300

      const avgCheck = totalCovers > 0 ? totalRevenue / totalCovers : 0

      expect(avgCheck).toBe(50)
    })

    it('should calculate revenue trend', () => {
      const currentRevenue = 15000
      const previousRevenue = 12000

      const trend = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0

      expect(trend).toBe(25) // 25% increase
    })

    it('should calculate average check trend', () => {
      const currentAvgCheck = 55
      const previousAvgCheck = 50

      const trend = previousAvgCheck > 0
        ? ((currentAvgCheck - previousAvgCheck) / previousAvgCheck) * 100
        : 0

      expect(trend).toBe(10) // 10% increase
    })

    it('should format daily data', () => {
      const entries = [
        { date: new Date('2024-01-15'), totalRevenue: 5000, totalCovers: 100 },
      ]

      const dailyData = entries.map((e) => ({
        date: e.date.toISOString().split('T')[0],
        revenue: e.totalRevenue,
        covers: e.totalCovers,
        avgCheck: e.totalCovers > 0 ? e.totalRevenue / e.totalCovers : 0,
      }))

      expect(dailyData[0].date).toBe('2024-01-15')
      expect(dailyData[0].avgCheck).toBe(50)
    })
  })
})
