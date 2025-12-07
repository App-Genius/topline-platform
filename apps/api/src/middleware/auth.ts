import { createMiddleware } from 'hono/factory'
import * as jose from 'jose'
import type { Env } from '../types.js'
import type { AuthTokenPayload } from '@topline/shared'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'topline-dev-secret-change-in-production')

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      },
      401
    )
  }

  const token = authHeader.slice(7)

  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    const authPayload = payload as unknown as AuthTokenPayload

    // Set context variables
    c.set('userId', authPayload.sub)
    c.set('organizationId', authPayload.orgId)
    c.set('roleType', authPayload.roleType)
    c.set('permissions', authPayload.permissions)
    c.set('jwtPayload', authPayload)

    await next()
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      return c.json(
        {
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Access token has expired',
          },
        },
        401
      )
    }

    return c.json(
      {
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token',
        },
      },
      401
    )
  }
})

// Helper to generate tokens
export async function generateTokens(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>) {
  const now = Math.floor(Date.now() / 1000)

  const accessToken = await new jose.SignJWT({
    ...payload,
    iat: now,
    exp: now + 60 * 60, // 1 hour
  })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(JWT_SECRET)

  const refreshToken = await new jose.SignJWT({
    sub: payload.sub,
    type: 'refresh',
    iat: now,
    exp: now + 60 * 60 * 24 * 7, // 7 days
  })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(JWT_SECRET)

  return { accessToken, refreshToken }
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    if (payload.type !== 'refresh') return null
    return payload.sub as string
  } catch {
    return null
  }
}

// Permission checking middleware
export function requirePermission(permission: string) {
  return createMiddleware<Env>(async (c, next) => {
    const permissions = c.get('permissions')

    if (!permissions.includes('*') && !permissions.includes(permission)) {
      return c.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: `Missing required permission: ${permission}`,
          },
        },
        403
      )
    }

    await next()
  })
}

// Role type checking middleware
export function requireRole(...allowedRoles: string[]) {
  return createMiddleware<Env>(async (c, next) => {
    const roleType = c.get('roleType')

    if (!allowedRoles.includes(roleType) && roleType !== 'ADMIN') {
      return c.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient role privileges',
          },
        },
        403
      )
    }

    await next()
  })
}
