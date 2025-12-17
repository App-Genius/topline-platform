'use server'

import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const SESSION_COOKIE = 'topline_session'
const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'topline-dev-secret-change-in-production-min-32-chars'
)

export interface SessionPayload {
  userId: string
  email: string
  orgId: string
  roleType: string
  permissions: string[]
  exp?: number
}

/**
 * Create a new session and set the cookie
 */
export async function createSession(payload: Omit<SessionPayload, 'exp'>): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

/**
 * Get the current session from the cookie
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/**
 * Destroy the current session
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

/**
 * Require specific role(s) - throws if not authorized
 * ADMIN role always has access
 */
export async function requireRole(...allowedRoles: string[]): Promise<SessionPayload> {
  const session = await requireAuth()

  // ADMIN always has access
  if (session.roleType === 'ADMIN') {
    return session
  }

  if (!allowedRoles.includes(session.roleType)) {
    throw new Error('Forbidden')
  }

  return session
}

/**
 * Check if user has a specific permission
 * Supports wildcard permissions (e.g., '*' matches all)
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const session = await getSession()
  if (!session) return false

  // Wildcard permission grants all
  if (session.permissions.includes('*')) return true

  // Check for exact match
  if (session.permissions.includes(permission)) return true

  // Check for namespace wildcard (e.g., "read:*" matches "read:users")
  const [action] = permission.split(':')
  if (session.permissions.includes(`${action}:*`)) return true

  return false
}

/**
 * Require a specific permission - throws if not authorized
 */
export async function requirePermission(permission: string): Promise<SessionPayload> {
  const session = await requireAuth()

  const permitted = await hasPermission(permission)
  if (!permitted) {
    throw new Error('Forbidden')
  }

  return session
}

/**
 * Get session token for middleware (synchronous check)
 * Note: This only checks if token exists, doesn't verify it
 */
export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value
}
