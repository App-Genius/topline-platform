import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { prisma } from '@topline/db'
import {
  dailyEntrySchema,
  createDailyEntrySchema,
  updateDailyEntrySchema,
  paginationSchema,
} from '@topline/shared'
import type { Env } from '../types.js'
import { Errors } from '../middleware/error-handler.js'
import { requireRole } from '../middleware/auth.js'

const app = new OpenAPIHono<Env>()

// ============================================
// LIST DAILY ENTRIES
// ============================================

const listEntriesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Daily Entries'],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationSchema.extend({
      locationId: z.string().cuid().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of daily entries',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              dailyEntrySchema.extend({
                location: z.object({ id: z.string(), name: z.string() }),
                avgCheck: z.number(),
              })
            ),
            meta: z.object({
              total: z.number(),
              page: z.number(),
              limit: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
  },
})

app.openapi(listEntriesRoute, async (c) => {
  const orgId = c.get('organizationId')
  const { page, limit, locationId, startDate, endDate } = c.req.valid('query')

  const where = {
    location: { organizationId: orgId },
    ...(locationId ? { locationId } : {}),
    ...(startDate || endDate
      ? {
          date: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {}),
  }

  const [entries, total] = await Promise.all([
    prisma.dailyEntry.findMany({
      where,
      include: {
        location: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.dailyEntry.count({ where }),
  ])

  // Calculate average check
  const entriesWithAvg = entries.map((entry) => ({
    ...entry,
    avgCheck: entry.totalCovers > 0 ? entry.totalRevenue / entry.totalCovers : 0,
  }))

  return c.json({
    data: entriesWithAvg,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// ============================================
// GET ENTRY BY DATE
// ============================================

const getEntryByDateRoute = createRoute({
  method: 'get',
  path: '/by-date',
  tags: ['Daily Entries'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      date: z.coerce.date(),
      locationId: z.string().cuid().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Daily entry for date',
      content: {
        'application/json': {
          schema: dailyEntrySchema
            .extend({
              location: z.object({ id: z.string(), name: z.string() }),
              avgCheck: z.number(),
              reviews: z.array(
                z.object({
                  id: z.string(),
                  source: z.string(),
                  rating: z.number(),
                  text: z.string().nullable(),
                })
              ),
            })
            .nullable(),
        },
      },
    },
  },
})

app.openapi(getEntryByDateRoute, async (c) => {
  const orgId = c.get('organizationId')
  const { date, locationId } = c.req.valid('query')

  // If no locationId, get default location
  let targetLocationId = locationId
  if (!targetLocationId) {
    const defaultLocation = await prisma.location.findFirst({
      where: { organizationId: orgId, isActive: true },
      orderBy: { createdAt: 'asc' },
    })
    targetLocationId = defaultLocation?.id
  }

  if (!targetLocationId) {
    return c.json(null)
  }

  const entry = await prisma.dailyEntry.findUnique({
    where: {
      locationId_date: {
        locationId: targetLocationId,
        date,
      },
    },
    include: {
      location: { select: { id: true, name: true } },
      reviews: true,
    },
  })

  if (!entry) {
    return c.json(null)
  }

  return c.json({
    ...entry,
    avgCheck: entry.totalCovers > 0 ? entry.totalRevenue / entry.totalCovers : 0,
  })
})

// ============================================
// CREATE/UPDATE DAILY ENTRY (Upsert)
// ============================================

const upsertEntryRoute = createRoute({
  method: 'put',
  path: '/',
  tags: ['Daily Entries'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createDailyEntrySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Daily entry created/updated',
      content: {
        'application/json': {
          schema: dailyEntrySchema.extend({
            location: z.object({ id: z.string(), name: z.string() }),
          }),
        },
      },
    },
    404: {
      description: 'Location not found',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({ code: z.string(), message: z.string() }),
          }),
        },
      },
    },
  },
})

app.use('/', requireRole('MANAGER', 'ADMIN'))

app.openapi(upsertEntryRoute, async (c) => {
  const orgId = c.get('organizationId')
  const data = c.req.valid('json')

  // Verify location belongs to org
  const location = await prisma.location.findFirst({
    where: { id: data.locationId, organizationId: orgId },
  })

  if (!location) {
    throw Errors.notFound('Location')
  }

  const entry = await prisma.dailyEntry.upsert({
    where: {
      locationId_date: {
        locationId: data.locationId,
        date: data.date,
      },
    },
    update: {
      totalRevenue: data.totalRevenue,
      totalCovers: data.totalCovers,
      notes: data.notes,
    },
    create: data,
    include: {
      location: { select: { id: true, name: true } },
    },
  })

  return c.json(entry)
})

// ============================================
// GET STATS SUMMARY
// ============================================

const getStatsRoute = createRoute({
  method: 'get',
  path: '/stats',
  tags: ['Daily Entries'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      days: z.coerce.number().min(1).max(365).default(30),
      locationId: z.string().cuid().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Statistics summary',
      content: {
        'application/json': {
          schema: z.object({
            period: z.object({
              start: z.string(),
              end: z.string(),
              days: z.number(),
            }),
            revenue: z.object({
              total: z.number(),
              average: z.number(),
              trend: z.number(),
            }),
            covers: z.object({
              total: z.number(),
              average: z.number(),
            }),
            avgCheck: z.object({
              current: z.number(),
              previous: z.number(),
              trend: z.number(),
            }),
            dailyData: z.array(
              z.object({
                date: z.string(),
                revenue: z.number(),
                covers: z.number(),
                avgCheck: z.number(),
              })
            ),
          }),
        },
      },
    },
  },
})

app.openapi(getStatsRoute, async (c) => {
  const orgId = c.get('organizationId')
  const { days, locationId } = c.req.valid('query')

  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const previousStart = new Date(startDate)
  previousStart.setDate(previousStart.getDate() - days)

  const where = {
    location: { organizationId: orgId },
    ...(locationId ? { locationId } : {}),
  }

  // Get current period
  const currentEntries = await prisma.dailyEntry.findMany({
    where: { ...where, date: { gte: startDate, lte: endDate } },
    orderBy: { date: 'asc' },
  })

  // Get previous period for comparison
  const previousEntries = await prisma.dailyEntry.findMany({
    where: { ...where, date: { gte: previousStart, lt: startDate } },
  })

  // Calculate stats
  const totalRevenue = currentEntries.reduce((sum, e) => sum + e.totalRevenue, 0)
  const totalCovers = currentEntries.reduce((sum, e) => sum + e.totalCovers, 0)
  const avgCheck = totalCovers > 0 ? totalRevenue / totalCovers : 0

  const prevRevenue = previousEntries.reduce((sum, e) => sum + e.totalRevenue, 0)
  const prevCovers = previousEntries.reduce((sum, e) => sum + e.totalCovers, 0)
  const prevAvgCheck = prevCovers > 0 ? prevRevenue / prevCovers : 0

  const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
  const avgCheckTrend = prevAvgCheck > 0 ? ((avgCheck - prevAvgCheck) / prevAvgCheck) * 100 : 0

  const dailyData = currentEntries.map((e) => ({
    date: e.date.toISOString().split('T')[0],
    revenue: e.totalRevenue,
    covers: e.totalCovers,
    avgCheck: e.totalCovers > 0 ? e.totalRevenue / e.totalCovers : 0,
  }))

  return c.json({
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      days,
    },
    revenue: {
      total: Math.round(totalRevenue * 100) / 100,
      average: Math.round((totalRevenue / days) * 100) / 100,
      trend: Math.round(revenueTrend * 100) / 100,
    },
    covers: {
      total: totalCovers,
      average: Math.round(totalCovers / days),
    },
    avgCheck: {
      current: Math.round(avgCheck * 100) / 100,
      previous: Math.round(prevAvgCheck * 100) / 100,
      trend: Math.round(avgCheckTrend * 100) / 100,
    },
    dailyData,
  })
})

export default app
