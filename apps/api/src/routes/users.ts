import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import bcrypt from 'bcryptjs'
const { hash } = bcrypt
import { prisma } from '@topline/db'
import {
  userSchema,
  createUserSchema,
  updateUserSchema,
  paginationSchema,
} from '@topline/shared'
import type { Env } from '../types.js'
import { Errors } from '../middleware/error-handler.js'
import { requireRole } from '../middleware/auth.js'

const app = new OpenAPIHono<Env>()

// Only managers and admins can manage users
app.use('*', requireRole('MANAGER', 'ADMIN'))

// ============================================
// LIST USERS
// ============================================

const listUsersRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Users'],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationSchema.extend({
      roleId: z.string().cuid().optional(),
      isActive: z.coerce.boolean().optional(),
      search: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of users',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              userSchema.omit({ passwordHash: true } as any).extend({
                role: z.object({ id: z.string(), name: z.string(), type: z.string() }),
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

app.openapi(listUsersRoute, async (c) => {
  const orgId = c.get('organizationId')
  const { page, limit, roleId, isActive, search } = c.req.valid('query')

  const where = {
    organizationId: orgId,
    ...(roleId ? { roleId } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { role: { select: { id: true, name: true, type: true } } },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  // Remove password hashes from response
  const sanitizedUsers = users.map(({ passwordHash, ...user }) => user)

  return c.json({
    data: sanitizedUsers,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// ============================================
// GET USER BY ID
// ============================================

const getUserRoute = createRoute({
  method: 'get',
  path: '/:id',
  tags: ['Users'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
  },
  responses: {
    200: {
      description: 'User details',
      content: {
        'application/json': {
          schema: userSchema.extend({
            role: z.object({ id: z.string(), name: z.string(), type: z.string() }),
            _count: z.object({ behaviorLogs: z.number() }),
          }),
        },
      },
    },
    404: {
      description: 'User not found',
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

app.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  const orgId = c.get('organizationId')

  const user = await prisma.user.findFirst({
    where: { id, organizationId: orgId },
    include: {
      role: { select: { id: true, name: true, type: true } },
      _count: { select: { behaviorLogs: true } },
    },
  })

  if (!user) {
    throw Errors.notFound('User')
  }

  const { passwordHash, ...userWithoutPassword } = user
  return c.json(userWithoutPassword)
})

// ============================================
// CREATE USER
// ============================================

const createUserRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Users'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created user',
      content: {
        'application/json': {
          schema: userSchema.extend({
            role: z.object({ id: z.string(), name: z.string(), type: z.string() }),
          }),
        },
      },
    },
    409: {
      description: 'Email already exists',
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

app.openapi(createUserRoute, async (c) => {
  const orgId = c.get('organizationId')
  const { password, ...data } = c.req.valid('json')

  // Verify role belongs to organization
  const role = await prisma.role.findFirst({
    where: { id: data.roleId, organizationId: orgId },
  })

  if (!role) {
    throw Errors.badRequest('Role not found in organization')
  }

  const passwordHash = await hash(password, 12)

  const user = await prisma.user.create({
    data: {
      ...data,
      passwordHash,
      organizationId: orgId,
      avatar: data.avatar || data.name.slice(0, 2).toUpperCase(),
    },
    include: {
      role: { select: { id: true, name: true, type: true } },
    },
  })

  const { passwordHash: _, ...userWithoutPassword } = user
  return c.json(userWithoutPassword, 201)
})

// ============================================
// UPDATE USER
// ============================================

const updateUserRoute = createRoute({
  method: 'patch',
  path: '/:id',
  tags: ['Users'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateUserSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated user',
      content: {
        'application/json': {
          schema: userSchema.extend({
            role: z.object({ id: z.string(), name: z.string(), type: z.string() }),
          }),
        },
      },
    },
    404: {
      description: 'User not found',
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

app.openapi(updateUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  const orgId = c.get('organizationId')
  const data = c.req.valid('json')

  // Verify user exists and belongs to org
  const existing = await prisma.user.findFirst({
    where: { id, organizationId: orgId },
  })

  if (!existing) {
    throw Errors.notFound('User')
  }

  // If updating role, verify it belongs to org
  if (data.roleId) {
    const role = await prisma.role.findFirst({
      where: { id: data.roleId, organizationId: orgId },
    })
    if (!role) {
      throw Errors.badRequest('Role not found in organization')
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    include: {
      role: { select: { id: true, name: true, type: true } },
    },
  })

  const { passwordHash, ...userWithoutPassword } = user
  return c.json(userWithoutPassword)
})

// ============================================
// DEACTIVATE USER
// ============================================

const deactivateUserRoute = createRoute({
  method: 'delete',
  path: '/:id',
  tags: ['Users'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
  },
  responses: {
    200: {
      description: 'User deactivated',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    404: {
      description: 'User not found',
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

app.openapi(deactivateUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  const orgId = c.get('organizationId')
  const currentUserId = c.get('userId')

  // Prevent self-deactivation
  if (id === currentUserId) {
    throw Errors.badRequest('Cannot deactivate your own account')
  }

  const existing = await prisma.user.findFirst({
    where: { id, organizationId: orgId },
  })

  if (!existing) {
    throw Errors.notFound('User')
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  })

  return c.json({ message: 'User deactivated successfully' })
})

// ============================================
// GET USER STATS
// ============================================

const getUserStatsRoute = createRoute({
  method: 'get',
  path: '/:id/stats',
  tags: ['Users'],
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
      description: 'User statistics',
      content: {
        'application/json': {
          schema: z.object({
            totalBehaviors: z.number(),
            verifiedBehaviors: z.number(),
            averagePerDay: z.number(),
            rank: z.number(),
            streakDays: z.number(),
            behaviorBreakdown: z.array(
              z.object({
                behaviorId: z.string(),
                behaviorName: z.string(),
                count: z.number(),
              })
            ),
          }),
        },
      },
    },
  },
})

app.openapi(getUserStatsRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { days } = c.req.valid('query')
  const orgId = c.get('organizationId')

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  // Verify user exists
  const user = await prisma.user.findFirst({
    where: { id, organizationId: orgId },
  })

  if (!user) {
    throw Errors.notFound('User')
  }

  // Get user's behavior logs
  const logs = await prisma.behaviorLog.findMany({
    where: {
      userId: id,
      createdAt: { gte: startDate },
    },
    include: {
      behavior: { select: { id: true, name: true } },
    },
  })

  const totalBehaviors = logs.length
  const verifiedBehaviors = logs.filter((l) => l.verified).length
  const averagePerDay = totalBehaviors / days

  // Calculate behavior breakdown
  const behaviorCounts = new Map<string, { name: string; count: number }>()
  for (const log of logs) {
    const current = behaviorCounts.get(log.behaviorId) || {
      name: log.behavior.name,
      count: 0,
    }
    behaviorCounts.set(log.behaviorId, {
      name: current.name,
      count: current.count + 1,
    })
  }

  const behaviorBreakdown = Array.from(behaviorCounts.entries())
    .map(([behaviorId, data]) => ({
      behaviorId,
      behaviorName: data.name,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)

  // Calculate rank among team
  const allUserStats = await prisma.behaviorLog.groupBy({
    by: ['userId'],
    where: {
      user: { organizationId: orgId },
      createdAt: { gte: startDate },
    },
    _count: true,
  })

  const sortedStats = allUserStats.sort((a, b) => b._count - a._count)
  const rank = sortedStats.findIndex((s) => s.userId === id) + 1

  // Calculate streak (simplified - just count consecutive days with logs)
  const uniqueDates = new Set(logs.map((l) => l.createdAt.toISOString().split('T')[0]))
  let streakDays = 0
  const today = new Date().toISOString().split('T')[0]
  let checkDate = today

  while (uniqueDates.has(checkDate)) {
    streakDays++
    const d = new Date(checkDate)
    d.setDate(d.getDate() - 1)
    checkDate = d.toISOString().split('T')[0]
  }

  return c.json({
    totalBehaviors,
    verifiedBehaviors,
    averagePerDay: Math.round(averagePerDay * 100) / 100,
    rank,
    streakDays,
    behaviorBreakdown,
  })
})

export default app
