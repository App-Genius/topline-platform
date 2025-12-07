import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { prisma } from '@topline/db'
import {
  behaviorLogSchema,
  createBehaviorLogSchema,
  verifyBehaviorLogSchema,
  paginationSchema,
} from '@topline/shared'
import type { Env } from '../types.js'
import { Errors } from '../middleware/error-handler.js'
import { requireRole, requirePermission } from '../middleware/auth.js'

const app = new OpenAPIHono<Env>()

// ============================================
// LIST BEHAVIOR LOGS
// ============================================

const listLogsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Behavior Logs'],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationSchema.extend({
      userId: z.string().cuid().optional(),
      behaviorId: z.string().cuid().optional(),
      verified: z.coerce.boolean().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of behavior logs',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              behaviorLogSchema.extend({
                user: z.object({ id: z.string(), name: z.string(), avatar: z.string().nullable() }),
                behavior: z.object({ id: z.string(), name: z.string(), points: z.number() }),
                verifiedBy: z.object({ id: z.string(), name: z.string() }).nullable(),
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

app.openapi(listLogsRoute, async (c) => {
  const orgId = c.get('organizationId')
  const roleType = c.get('roleType')
  const currentUserId = c.get('userId')
  const { page, limit, userId, behaviorId, verified, startDate, endDate } = c.req.valid('query')

  // Staff can only see their own logs
  const effectiveUserId =
    roleType === 'ADMIN' || roleType === 'MANAGER' ? userId : currentUserId

  const where = {
    user: { organizationId: orgId },
    ...(effectiveUserId ? { userId: effectiveUserId } : {}),
    ...(behaviorId ? { behaviorId } : {}),
    ...(verified !== undefined ? { verified } : {}),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.behaviorLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        behavior: { select: { id: true, name: true, points: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.behaviorLog.count({ where }),
  ])

  return c.json({
    data: logs,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// ============================================
// CREATE BEHAVIOR LOG
// ============================================

const createLogRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Behavior Logs'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createBehaviorLogSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created behavior log',
      content: {
        'application/json': {
          schema: behaviorLogSchema.extend({
            behavior: z.object({ id: z.string(), name: z.string(), points: z.number() }),
          }),
        },
      },
    },
    404: {
      description: 'Behavior not found',
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

app.openapi(createLogRoute, async (c) => {
  const userId = c.get('userId')
  const orgId = c.get('organizationId')
  const data = c.req.valid('json')

  // Verify behavior exists and is active
  const behavior = await prisma.behavior.findFirst({
    where: { id: data.behaviorId, organizationId: orgId, isActive: true },
  })

  if (!behavior) {
    throw Errors.notFound('Behavior')
  }

  // If location provided, verify it exists
  if (data.locationId) {
    const location = await prisma.location.findFirst({
      where: { id: data.locationId, organizationId: orgId },
    })
    if (!location) {
      throw Errors.notFound('Location')
    }
  }

  const log = await prisma.behaviorLog.create({
    data: {
      userId,
      behaviorId: data.behaviorId,
      locationId: data.locationId,
      metadata: data.metadata || {},
    },
    include: {
      behavior: { select: { id: true, name: true, points: true } },
    },
  })

  return c.json(log, 201)
})

// ============================================
// VERIFY BEHAVIOR LOG
// ============================================

const verifyLogRoute = createRoute({
  method: 'patch',
  path: '/:id/verify',
  tags: ['Behavior Logs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: verifyBehaviorLogSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Log verification updated',
      content: {
        'application/json': {
          schema: behaviorLogSchema,
        },
      },
    },
    403: {
      description: 'Only managers can verify logs',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({ code: z.string(), message: z.string() }),
          }),
        },
      },
    },
    404: {
      description: 'Log not found',
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

// Only managers and admins can verify
app.use('/:id/verify', requireRole('MANAGER', 'ADMIN'))

app.openapi(verifyLogRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { verified } = c.req.valid('json')
  const verifierId = c.get('userId')
  const orgId = c.get('organizationId')

  const existing = await prisma.behaviorLog.findFirst({
    where: { id },
    include: { user: { select: { organizationId: true } } },
  })

  if (!existing || existing.user.organizationId !== orgId) {
    throw Errors.notFound('Behavior log')
  }

  const log = await prisma.behaviorLog.update({
    where: { id },
    data: {
      verified,
      verifiedById: verified ? verifierId : null,
      verifiedAt: verified ? new Date() : null,
    },
  })

  return c.json(log)
})

// ============================================
// GET PENDING VERIFICATIONS
// ============================================

const pendingRoute = createRoute({
  method: 'get',
  path: '/pending',
  tags: ['Behavior Logs'],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationSchema,
  },
  responses: {
    200: {
      description: 'Pending verifications',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              behaviorLogSchema.extend({
                user: z.object({ id: z.string(), name: z.string(), avatar: z.string().nullable() }),
                behavior: z.object({ id: z.string(), name: z.string() }),
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

app.use('/pending', requireRole('MANAGER', 'ADMIN'))

app.openapi(pendingRoute, async (c) => {
  const orgId = c.get('organizationId')
  const { page, limit } = c.req.valid('query')

  const where = {
    user: { organizationId: orgId },
    verified: false,
  }

  const [logs, total] = await Promise.all([
    prisma.behaviorLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        behavior: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.behaviorLog.count({ where }),
  ])

  return c.json({
    data: logs,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// ============================================
// DELETE BEHAVIOR LOG
// ============================================

const deleteLogRoute = createRoute({
  method: 'delete',
  path: '/:id',
  tags: ['Behavior Logs'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
  },
  responses: {
    200: {
      description: 'Log deleted',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    403: {
      description: 'Can only delete own unverified logs',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({ code: z.string(), message: z.string() }),
          }),
        },
      },
    },
    404: {
      description: 'Log not found',
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

app.openapi(deleteLogRoute, async (c) => {
  const { id } = c.req.valid('param')
  const userId = c.get('userId')
  const roleType = c.get('roleType')
  const orgId = c.get('organizationId')

  const log = await prisma.behaviorLog.findFirst({
    where: { id },
    include: { user: { select: { organizationId: true } } },
  })

  if (!log || log.user.organizationId !== orgId) {
    throw Errors.notFound('Behavior log')
  }

  // Staff can only delete their own unverified logs
  if (roleType !== 'ADMIN' && roleType !== 'MANAGER') {
    if (log.userId !== userId) {
      throw Errors.forbidden('Can only delete your own logs')
    }
    if (log.verified) {
      throw Errors.forbidden('Cannot delete verified logs')
    }
  }

  await prisma.behaviorLog.delete({ where: { id } })

  return c.json({ message: 'Behavior log deleted successfully' })
})

export default app
