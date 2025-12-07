import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { prisma } from '@topline/db'
import {
  behaviorSchema,
  createBehaviorSchema,
  updateBehaviorSchema,
  paginationSchema,
} from '@topline/shared'
import type { Env } from '../types.js'
import { Errors } from '../middleware/error-handler.js'
import { requireRole } from '../middleware/auth.js'

const app = new OpenAPIHono<Env>()

// ============================================
// LIST BEHAVIORS
// ============================================

const listBehaviorsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Behaviors'],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationSchema.extend({
      includeInactive: z.coerce.boolean().optional().default(false),
    }),
  },
  responses: {
    200: {
      description: 'List of behaviors',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              behaviorSchema.extend({
                roles: z.array(z.object({ id: z.string(), name: z.string() })),
                _count: z.object({ logs: z.number() }).optional(),
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

app.openapi(listBehaviorsRoute, async (c) => {
  const orgId = c.get('organizationId')
  const { page, limit, includeInactive } = c.req.valid('query')

  const where = {
    organizationId: orgId,
    ...(includeInactive ? {} : { isActive: true }),
  }

  const [behaviors, total] = await Promise.all([
    prisma.behavior.findMany({
      where,
      include: {
        roles: { select: { id: true, name: true } },
        _count: { select: { logs: true } },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.behavior.count({ where }),
  ])

  return c.json({
    data: behaviors,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// ============================================
// GET BEHAVIOR BY ID
// ============================================

const getBehaviorRoute = createRoute({
  method: 'get',
  path: '/:id',
  tags: ['Behaviors'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
  },
  responses: {
    200: {
      description: 'Behavior details',
      content: {
        'application/json': {
          schema: behaviorSchema.extend({
            roles: z.array(z.object({ id: z.string(), name: z.string(), type: z.string() })),
            _count: z.object({ logs: z.number() }),
          }),
        },
      },
    },
    404: {
      description: 'Behavior not found',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
          }),
        },
      },
    },
  },
})

app.openapi(getBehaviorRoute, async (c) => {
  const { id } = c.req.valid('param')
  const orgId = c.get('organizationId')

  const behavior = await prisma.behavior.findFirst({
    where: { id, organizationId: orgId },
    include: {
      roles: { select: { id: true, name: true, type: true } },
      _count: { select: { logs: true } },
    },
  })

  if (!behavior) {
    throw Errors.notFound('Behavior')
  }

  return c.json(behavior)
})

// ============================================
// CREATE BEHAVIOR
// ============================================

const createBehaviorRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Behaviors'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createBehaviorSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created behavior',
      content: {
        'application/json': {
          schema: behaviorSchema,
        },
      },
    },
    409: {
      description: 'Behavior with this name already exists',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
          }),
        },
      },
    },
  },
})

app.openapi(createBehaviorRoute, async (c) => {
  const orgId = c.get('organizationId')
  const { roleIds, ...data } = c.req.valid('json')

  const behavior = await prisma.behavior.create({
    data: {
      ...data,
      organizationId: orgId,
      roles: roleIds ? { connect: roleIds.map((id) => ({ id })) } : undefined,
    },
    include: {
      roles: { select: { id: true, name: true } },
    },
  })

  return c.json(behavior, 201)
})

// ============================================
// UPDATE BEHAVIOR
// ============================================

const updateBehaviorRoute = createRoute({
  method: 'patch',
  path: '/:id',
  tags: ['Behaviors'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateBehaviorSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated behavior',
      content: {
        'application/json': {
          schema: behaviorSchema,
        },
      },
    },
    404: {
      description: 'Behavior not found',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
          }),
        },
      },
    },
  },
})

app.openapi(updateBehaviorRoute, async (c) => {
  const { id } = c.req.valid('param')
  const orgId = c.get('organizationId')
  const { roleIds, ...data } = c.req.valid('json')

  // Verify behavior exists and belongs to org
  const existing = await prisma.behavior.findFirst({
    where: { id, organizationId: orgId },
  })

  if (!existing) {
    throw Errors.notFound('Behavior')
  }

  const behavior = await prisma.behavior.update({
    where: { id },
    data: {
      ...data,
      roles: roleIds
        ? {
            set: [], // Clear existing
            connect: roleIds.map((roleId) => ({ id: roleId })),
          }
        : undefined,
    },
    include: {
      roles: { select: { id: true, name: true } },
    },
  })

  return c.json(behavior)
})

// ============================================
// DELETE BEHAVIOR (Soft delete)
// ============================================

const deleteBehaviorRoute = createRoute({
  method: 'delete',
  path: '/:id',
  tags: ['Behaviors'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
  },
  responses: {
    200: {
      description: 'Behavior deactivated',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    404: {
      description: 'Behavior not found',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
          }),
        },
      },
    },
  },
})

// Only managers and admins can delete
app.use('/:id', requireRole('MANAGER', 'ADMIN'))

app.openapi(deleteBehaviorRoute, async (c) => {
  const { id } = c.req.valid('param')
  const orgId = c.get('organizationId')

  const existing = await prisma.behavior.findFirst({
    where: { id, organizationId: orgId },
  })

  if (!existing) {
    throw Errors.notFound('Behavior')
  }

  await prisma.behavior.update({
    where: { id },
    data: { isActive: false },
  })

  return c.json({ message: 'Behavior deactivated successfully' })
})

// ============================================
// GET BEHAVIOR STATS
// ============================================

const getBehaviorStatsRoute = createRoute({
  method: 'get',
  path: '/:id/stats',
  tags: ['Behaviors'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
    query: z.object({
      days: z.coerce.number().min(1).max(365).default(30),
    }),
  },
  responses: {
    200: {
      description: 'Behavior statistics',
      content: {
        'application/json': {
          schema: z.object({
            totalLogs: z.number(),
            verifiedLogs: z.number(),
            verificationRate: z.number(),
            averagePerDay: z.number(),
            topPerformers: z.array(
              z.object({
                userId: z.string(),
                userName: z.string(),
                count: z.number(),
              })
            ),
            dailyTrend: z.array(
              z.object({
                date: z.string(),
                count: z.number(),
              })
            ),
          }),
        },
      },
    },
  },
})

app.openapi(getBehaviorStatsRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { days } = c.req.valid('query')
  const orgId = c.get('organizationId')

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  // Verify behavior exists
  const behavior = await prisma.behavior.findFirst({
    where: { id, organizationId: orgId },
  })

  if (!behavior) {
    throw Errors.notFound('Behavior')
  }

  // Get logs in date range
  const logs = await prisma.behaviorLog.findMany({
    where: {
      behaviorId: id,
      createdAt: { gte: startDate },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const totalLogs = logs.length
  const verifiedLogs = logs.filter((l) => l.verified).length
  const verificationRate = totalLogs > 0 ? (verifiedLogs / totalLogs) * 100 : 0
  const averagePerDay = totalLogs / days

  // Calculate top performers
  const userCounts = new Map<string, { name: string; count: number }>()
  for (const log of logs) {
    const current = userCounts.get(log.userId) || { name: log.user.name, count: 0 }
    userCounts.set(log.userId, { name: current.name, count: current.count + 1 })
  }

  const topPerformers = Array.from(userCounts.entries())
    .map(([userId, data]) => ({ userId, userName: data.name, count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Calculate daily trend
  const dailyCounts = new Map<string, number>()
  for (const log of logs) {
    const date = log.createdAt.toISOString().split('T')[0]
    dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1)
  }

  const dailyTrend = Array.from(dailyCounts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return c.json({
    totalLogs,
    verifiedLogs,
    verificationRate: Math.round(verificationRate * 100) / 100,
    averagePerDay: Math.round(averagePerDay * 100) / 100,
    topPerformers,
    dailyTrend,
  })
})

export default app
