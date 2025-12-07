import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { prisma } from '@topline/db'
import {
  organizationSchema,
  updateOrganizationSchema,
  createBenchmarkSchema,
  benchmarkSchema,
} from '@topline/shared'
import type { Env } from '../types.js'
import { Errors } from '../middleware/error-handler.js'
import { requireRole } from '../middleware/auth.js'

const app = new OpenAPIHono<Env>()

// ============================================
// GET CURRENT ORGANIZATION
// ============================================

const getOrgRoute = createRoute({
  method: 'get',
  path: '/current',
  tags: ['Organizations'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Current organization',
      content: {
        'application/json': {
          schema: organizationSchema.extend({
            _count: z.object({
              users: z.number(),
              behaviors: z.number(),
              locations: z.number(),
            }),
          }),
        },
      },
    },
  },
})

app.openapi(getOrgRoute, async (c) => {
  const orgId = c.get('organizationId')

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
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

  if (!org) {
    throw Errors.notFound('Organization')
  }

  return c.json(org)
})

// ============================================
// UPDATE ORGANIZATION
// ============================================

const updateOrgRoute = createRoute({
  method: 'patch',
  path: '/current',
  tags: ['Organizations'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateOrganizationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated organization',
      content: {
        'application/json': {
          schema: organizationSchema,
        },
      },
    },
  },
})

app.use('/current', requireRole('ADMIN'))

app.openapi(updateOrgRoute, async (c) => {
  const orgId = c.get('organizationId')
  const data = c.req.valid('json')

  const org = await prisma.organization.update({
    where: { id: orgId },
    data,
  })

  return c.json(org)
})

// ============================================
// GET LOCATIONS
// ============================================

const getLocationsRoute = createRoute({
  method: 'get',
  path: '/locations',
  tags: ['Organizations'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of locations',
      content: {
        'application/json': {
          schema: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              address: z.string().nullable(),
              isActive: z.boolean(),
            })
          ),
        },
      },
    },
  },
})

app.openapi(getLocationsRoute, async (c) => {
  const orgId = c.get('organizationId')

  const locations = await prisma.location.findMany({
    where: { organizationId: orgId },
    select: { id: true, name: true, address: true, isActive: true },
    orderBy: { name: 'asc' },
  })

  return c.json(locations)
})

// ============================================
// CREATE LOCATION
// ============================================

const createLocationRoute = createRoute({
  method: 'post',
  path: '/locations',
  tags: ['Organizations'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).max(100),
            address: z.string().max(500).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created location',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            name: z.string(),
            address: z.string().nullable(),
            isActive: z.boolean(),
          }),
        },
      },
    },
  },
})

app.use('/locations', requireRole('ADMIN'))

app.openapi(createLocationRoute, async (c) => {
  const orgId = c.get('organizationId')
  const data = c.req.valid('json')

  const location = await prisma.location.create({
    data: {
      ...data,
      organizationId: orgId,
    },
    select: { id: true, name: true, address: true, isActive: true },
  })

  return c.json(location, 201)
})

// ============================================
// GET BENCHMARKS
// ============================================

const getBenchmarksRoute = createRoute({
  method: 'get',
  path: '/benchmarks',
  tags: ['Organizations'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'List of benchmarks',
      content: {
        'application/json': {
          schema: z.array(benchmarkSchema),
        },
      },
    },
  },
})

app.openapi(getBenchmarksRoute, async (c) => {
  const orgId = c.get('organizationId')

  const benchmarks = await prisma.benchmark.findMany({
    where: { organizationId: orgId },
    orderBy: { year: 'desc' },
  })

  return c.json(benchmarks)
})

// ============================================
// CREATE/UPDATE BENCHMARK
// ============================================

const upsertBenchmarkRoute = createRoute({
  method: 'put',
  path: '/benchmarks',
  tags: ['Organizations'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createBenchmarkSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Benchmark created/updated',
      content: {
        'application/json': {
          schema: benchmarkSchema,
        },
      },
    },
  },
})

app.use('/benchmarks', requireRole('ADMIN', 'MANAGER'))

app.openapi(upsertBenchmarkRoute, async (c) => {
  const orgId = c.get('organizationId')
  const data = c.req.valid('json')

  // Calculate baseline avg check if not provided
  const baselineAvgCheck = data.baselineAvgCheck ?? data.totalRevenue / data.daysOpen

  const benchmark = await prisma.benchmark.upsert({
    where: {
      organizationId_year: {
        organizationId: orgId,
        year: data.year,
      },
    },
    update: {
      totalRevenue: data.totalRevenue,
      daysOpen: data.daysOpen,
      baselineAvgCheck,
      baselineRating: data.baselineRating,
    },
    create: {
      organizationId: orgId,
      year: data.year,
      totalRevenue: data.totalRevenue,
      daysOpen: data.daysOpen,
      baselineAvgCheck,
      baselineRating: data.baselineRating,
    },
  })

  return c.json(benchmark)
})

// ============================================
// GET DASHBOARD DATA
// ============================================

const getDashboardRoute = createRoute({
  method: 'get',
  path: '/dashboard',
  tags: ['Organizations'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      days: z.coerce.number().min(1).max(365).default(30),
    }),
  },
  responses: {
    200: {
      description: 'Dashboard data',
      content: {
        'application/json': {
          schema: z.object({
            gameState: z.object({
              status: z.enum(['neutral', 'winning', 'losing', 'celebrating']),
              currentScore: z.number(),
              targetScore: z.number(),
              percentComplete: z.number(),
              daysRemaining: z.number(),
            }),
            kpis: z.object({
              revenue: z.object({ current: z.number(), target: z.number(), trend: z.number() }),
              avgCheck: z.object({ current: z.number(), baseline: z.number(), trend: z.number() }),
              behaviors: z.object({ today: z.number(), average: z.number() }),
              rating: z.object({ current: z.number(), baseline: z.number() }),
            }),
            leaderboard: z.array(
              z.object({
                rank: z.number(),
                userId: z.string(),
                userName: z.string(),
                avatar: z.string().nullable(),
                score: z.number(),
              })
            ),
          }),
        },
      },
    },
  },
})

app.openapi(getDashboardRoute, async (c) => {
  const orgId = c.get('organizationId')
  const { days } = c.req.valid('query')

  const now = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get benchmark
  const benchmark = await prisma.benchmark.findFirst({
    where: { organizationId: orgId },
    orderBy: { year: 'desc' },
  })

  // Get daily entries
  const entries = await prisma.dailyEntry.findMany({
    where: {
      location: { organizationId: orgId },
      date: { gte: startDate },
    },
  })

  // Get behavior logs
  const logs = await prisma.behaviorLog.findMany({
    where: {
      user: { organizationId: orgId },
      createdAt: { gte: startDate },
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      behavior: { select: { points: true } },
    },
  })

  // Calculate KPIs
  const totalRevenue = entries.reduce((sum, e) => sum + e.totalRevenue, 0)
  const totalCovers = entries.reduce((sum, e) => sum + e.totalCovers, 0)
  const avgCheck = totalCovers > 0 ? totalRevenue / totalCovers : 0
  const todayLogs = logs.filter(
    (l) => l.createdAt.toDateString() === now.toDateString()
  ).length

  // Calculate game state
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = 365 - dayOfYear
  const targetToDate = benchmark
    ? (benchmark.totalRevenue / benchmark.daysOpen) * dayOfYear
    : 0
  const ytdRevenue = totalRevenue // Simplified - should be YTD

  let status: 'neutral' | 'winning' | 'losing' | 'celebrating' = 'neutral'
  if (benchmark) {
    const progress = ytdRevenue / targetToDate
    if (progress >= 1.05) status = 'winning'
    else if (progress <= 0.95) status = 'losing'
    if (ytdRevenue >= benchmark.totalRevenue) status = 'celebrating'
  }

  // Calculate leaderboard
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
    .slice(0, 10)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))

  return c.json({
    gameState: {
      status,
      currentScore: Math.round(ytdRevenue),
      targetScore: Math.round(benchmark?.totalRevenue || 0),
      percentComplete: benchmark
        ? Math.round((ytdRevenue / benchmark.totalRevenue) * 10000) / 100
        : 0,
      daysRemaining,
    },
    kpis: {
      revenue: {
        current: Math.round(totalRevenue),
        target: Math.round(targetToDate),
        trend: 0, // Calculate from previous period
      },
      avgCheck: {
        current: Math.round(avgCheck * 100) / 100,
        baseline: benchmark?.baselineAvgCheck || 0,
        trend: benchmark
          ? Math.round(((avgCheck - benchmark.baselineAvgCheck) / benchmark.baselineAvgCheck) * 10000) / 100
          : 0,
      },
      behaviors: {
        today: todayLogs,
        average: Math.round(logs.length / days),
      },
      rating: {
        current: 4.2, // Would come from reviews
        baseline: benchmark?.baselineRating || 4.0,
      },
    },
    leaderboard,
  })
})

export default app
