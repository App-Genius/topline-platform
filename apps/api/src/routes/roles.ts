import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { prisma } from '@topline/db'
import { roleSchema, createRoleSchema, updateRoleSchema, paginationSchema } from '@topline/shared'
import type { Env } from '../types.js'
import { Errors } from '../middleware/error-handler.js'
import { requireRole } from '../middleware/auth.js'

const app = new OpenAPIHono<Env>()

// Only admins can manage roles
app.use('*', requireRole('ADMIN'))

// ============================================
// LIST ROLES
// ============================================

const listRolesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Roles'],
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationSchema,
  },
  responses: {
    200: {
      description: 'List of roles',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(
              roleSchema.extend({
                _count: z.object({ users: z.number() }),
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

app.openapi(listRolesRoute, async (c) => {
  const orgId = c.get('organizationId')
  const { page, limit } = c.req.valid('query')

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where: { organizationId: orgId },
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.role.count({ where: { organizationId: orgId } }),
  ])

  return c.json({
    data: roles,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// ============================================
// GET ROLE BY ID
// ============================================

const getRoleRoute = createRoute({
  method: 'get',
  path: '/:id',
  tags: ['Roles'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
  },
  responses: {
    200: {
      description: 'Role details',
      content: {
        'application/json': {
          schema: roleSchema.extend({
            _count: z.object({ users: z.number() }),
            behaviors: z.array(z.object({ id: z.string(), name: z.string() })),
          }),
        },
      },
    },
    404: {
      description: 'Role not found',
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

app.openapi(getRoleRoute, async (c) => {
  const { id } = c.req.valid('param')
  const orgId = c.get('organizationId')

  const role = await prisma.role.findFirst({
    where: { id, organizationId: orgId },
    include: {
      _count: { select: { users: true } },
      behaviors: { select: { id: true, name: true } },
    },
  })

  if (!role) {
    throw Errors.notFound('Role')
  }

  return c.json(role)
})

// ============================================
// CREATE ROLE
// ============================================

const createRoleRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Roles'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createRoleSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created role',
      content: {
        'application/json': {
          schema: roleSchema,
        },
      },
    },
    409: {
      description: 'Role with this name already exists',
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

app.openapi(createRoleRoute, async (c) => {
  const orgId = c.get('organizationId')
  const data = c.req.valid('json')

  const role = await prisma.role.create({
    data: {
      ...data,
      organizationId: orgId,
    },
  })

  return c.json(role, 201)
})

// ============================================
// UPDATE ROLE
// ============================================

const updateRoleRoute = createRoute({
  method: 'patch',
  path: '/:id',
  tags: ['Roles'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateRoleSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated role',
      content: {
        'application/json': {
          schema: roleSchema,
        },
      },
    },
    404: {
      description: 'Role not found',
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

app.openapi(updateRoleRoute, async (c) => {
  const { id } = c.req.valid('param')
  const orgId = c.get('organizationId')
  const data = c.req.valid('json')

  const existing = await prisma.role.findFirst({
    where: { id, organizationId: orgId },
  })

  if (!existing) {
    throw Errors.notFound('Role')
  }

  const role = await prisma.role.update({
    where: { id },
    data,
  })

  return c.json(role)
})

// ============================================
// DELETE ROLE
// ============================================

const deleteRoleRoute = createRoute({
  method: 'delete',
  path: '/:id',
  tags: ['Roles'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
  },
  responses: {
    200: {
      description: 'Role deleted',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: 'Cannot delete role with users',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({ code: z.string(), message: z.string() }),
          }),
        },
      },
    },
    404: {
      description: 'Role not found',
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

app.openapi(deleteRoleRoute, async (c) => {
  const { id } = c.req.valid('param')
  const orgId = c.get('organizationId')

  const role = await prisma.role.findFirst({
    where: { id, organizationId: orgId },
    include: { _count: { select: { users: true } } },
  })

  if (!role) {
    throw Errors.notFound('Role')
  }

  if (role._count.users > 0) {
    throw Errors.badRequest('Cannot delete role with assigned users. Reassign users first.')
  }

  await prisma.role.delete({ where: { id } })

  return c.json({ message: 'Role deleted successfully' })
})

export default app
