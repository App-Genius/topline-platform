import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import bcrypt from 'bcryptjs'
const { hash, compare } = bcrypt
import { prisma } from '@topline/db'
import { loginSchema, createUserSchema, userSchema } from '@topline/shared'
import { generateTokens, verifyRefreshToken } from '../middleware/auth.js'
import { Errors } from '../middleware/error-handler.js'

const app = new OpenAPIHono()

// ============================================
// LOGIN
// ============================================

const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: z.object({
            accessToken: z.string(),
            refreshToken: z.string(),
            user: userSchema.extend({
              role: z.object({
                id: z.string(),
                name: z.string(),
                type: z.string(),
              }),
            }),
          }),
        },
      },
    },
    401: {
      description: 'Invalid credentials',
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

app.openapi(loginRoute, async (c) => {
  const { email, password } = c.req.valid('json')

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  })

  if (!user || !user.isActive) {
    throw Errors.unauthorized('Invalid email or password')
  }

  const validPassword = await compare(password, user.passwordHash)
  if (!validPassword) {
    throw Errors.unauthorized('Invalid email or password')
  }

  const tokens = await generateTokens({
    sub: user.id,
    email: user.email,
    orgId: user.organizationId,
    roleType: user.role.type,
    permissions: user.role.permissions as string[],
  })

  // Remove password hash from response
  const { passwordHash, ...userWithoutPassword } = user

  return c.json({
    ...tokens,
    user: userWithoutPassword,
  })
})

// ============================================
// REGISTER
// ============================================

const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createUserSchema.extend({
            organizationName: z.string().min(1).max(100),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Registration successful',
      content: {
        'application/json': {
          schema: z.object({
            accessToken: z.string(),
            refreshToken: z.string(),
            user: userSchema.extend({
              role: z.object({
                id: z.string(),
                name: z.string(),
                type: z.string(),
              }),
            }),
          }),
        },
      },
    },
    409: {
      description: 'Email already exists',
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

app.openapi(registerRoute, async (c) => {
  const { email, password, name, avatar, organizationName } = c.req.valid('json')

  // Check if email exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw Errors.conflict('Email already registered')
  }

  // Create organization and admin user in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create organization
    const org = await tx.organization.create({
      data: { name: organizationName },
    })

    // Create admin role
    const role = await tx.role.create({
      data: {
        name: 'Admin',
        type: 'ADMIN',
        organizationId: org.id,
        permissions: ['*'],
      },
    })

    // Create default location
    await tx.location.create({
      data: {
        name: 'Main Location',
        organizationId: org.id,
      },
    })

    // Create user
    const passwordHash = await hash(password, 12)
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        name,
        avatar: avatar || name.slice(0, 2).toUpperCase(),
        organizationId: org.id,
        roleId: role.id,
      },
      include: { role: true },
    })

    return user
  })

  const tokens = await generateTokens({
    sub: result.id,
    email: result.email,
    orgId: result.organizationId,
    roleType: result.role.type,
    permissions: result.role.permissions as string[],
  })

  const { passwordHash, ...userWithoutPassword } = result

  return c.json(
    {
      ...tokens,
      user: userWithoutPassword,
    },
    201
  )
})

// ============================================
// REFRESH TOKEN
// ============================================

const refreshRoute = createRoute({
  method: 'post',
  path: '/refresh',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            refreshToken: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Token refreshed',
      content: {
        'application/json': {
          schema: z.object({
            accessToken: z.string(),
            refreshToken: z.string(),
          }),
        },
      },
    },
    401: {
      description: 'Invalid refresh token',
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

app.openapi(refreshRoute, async (c) => {
  const { refreshToken } = c.req.valid('json')

  const userId = await verifyRefreshToken(refreshToken)
  if (!userId) {
    throw Errors.unauthorized('Invalid or expired refresh token')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  })

  if (!user || !user.isActive) {
    throw Errors.unauthorized('User not found or inactive')
  }

  const tokens = await generateTokens({
    sub: user.id,
    email: user.email,
    orgId: user.organizationId,
    roleType: user.role.type,
    permissions: user.role.permissions as string[],
  })

  return c.json(tokens)
})

// ============================================
// GET CURRENT USER
// ============================================

const meRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Auth'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Current user info',
      content: {
        'application/json': {
          schema: userSchema.extend({
            role: z.object({
              id: z.string(),
              name: z.string(),
              type: z.string(),
              permissions: z.array(z.string()),
            }),
            organization: z.object({
              id: z.string(),
              name: z.string(),
              industry: z.string(),
            }),
          }),
        },
      },
    },
  },
})

// This route needs auth - handled in index.ts by mounting under /api/auth
// For now, we'll make it work with manual header check
app.openapi(meRoute, async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw Errors.unauthorized('Missing authorization header')
  }

  // Import jose for verification
  const jose = await import('jose')
  const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'topline-dev-secret-change-in-production'
  )

  try {
    const token = authHeader.slice(7)
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    const userId = payload.sub as string

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        organization: true,
      },
    })

    if (!user) {
      throw Errors.notFound('User')
    }

    const { passwordHash, ...userWithoutPassword } = user
    return c.json(userWithoutPassword)
  } catch {
    throw Errors.unauthorized('Invalid token')
  }
})

export default app
