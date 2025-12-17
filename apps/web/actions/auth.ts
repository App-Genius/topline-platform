'use server'

import { prisma } from '@/lib/db'
import { createSession, destroySession, getSession } from '@/lib/auth/session'
import { loginSchema, createUserSchema } from '@/lib/schemas'
import type { ActionResult } from '@/lib/types'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

// User type without password hash
interface SafeUser {
  id: string
  email: string
  name: string
  avatar: string | null
  organizationId: string
  roleId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  role: {
    id: string
    name: string
    type: string
    permissions: unknown
  }
  organization?: {
    id: string
    name: string
    industry: string
  }
}

/**
 * Login with email and password
 */
export async function login(
  credentials: { email: string; password: string }
): Promise<ActionResult<{ user: SafeUser }>> {
  try {
    // Validate input
    const parsed = loginSchema.safeParse(credentials)
    if (!parsed.success) {
      return { success: false, error: 'Invalid email or password format' }
    }

    const { email, password } = parsed.data

    // Find user with role
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        organization: true,
      },
    })

    if (!user || !user.isActive) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Create session
    await createSession({
      userId: user.id,
      email: user.email,
      orgId: user.organizationId,
      roleType: user.role.type,
      permissions: user.role.permissions as string[],
    })

    // Remove password hash from response
    const { passwordHash: _, ...safeUser } = user

    return { success: true, data: { user: safeUser } }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed. Please try again.' }
  }
}

/**
 * Register a new user and organization
 */
export async function register(
  data: {
    email: string
    password: string
    name: string
    organizationName: string
    avatar?: string
  }
): Promise<ActionResult<{ user: SafeUser }>> {
  try {
    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return { success: false, error: 'Email already registered' }
    }

    // Validate password
    if (data.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' }
    }

    // Create organization, role, location, and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const org = await tx.organization.create({
        data: { name: data.organizationName },
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

      // Hash password and create user
      const passwordHash = await bcrypt.hash(data.password, 12)
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          avatar: data.avatar || data.name.slice(0, 2).toUpperCase(),
          organizationId: org.id,
          roleId: role.id,
        },
        include: {
          role: true,
          organization: true,
        },
      })

      return user
    })

    // Create session
    await createSession({
      userId: result.id,
      email: result.email,
      orgId: result.organizationId,
      roleType: result.role.type,
      permissions: result.role.permissions as string[],
    })

    const { passwordHash: _, ...safeUser } = result

    return { success: true, data: { user: safeUser } }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Registration failed. Please try again.' }
  }
}

/**
 * Logout - destroy the session
 */
export async function logout(): Promise<ActionResult<null>> {
  try {
    await destroySession()
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, error: 'Logout failed' }
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<ActionResult<SafeUser>> {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        role: true,
        organization: true,
      },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const { passwordHash: _, ...safeUser } = user
    return { success: true, data: safeUser }
  } catch (error) {
    console.error('Get current user error:', error)
    return { success: false, error: 'Failed to get user' }
  }
}

/**
 * Check if user is authenticated (lightweight check)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null
}
