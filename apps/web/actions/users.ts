'use server'

import { prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth/session'
import type { ActionResult, PaginatedResponse } from '@/lib/types'
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
  }
}

interface UserListParams {
  page?: number
  limit?: number
  roleId?: string
  isActive?: boolean
  search?: string
}

/**
 * Get paginated list of users (Manager/Admin only)
 */
export async function getUsers(
  params?: UserListParams
): Promise<ActionResult<PaginatedResponse<SafeUser>>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    const page = params?.page ?? 1
    const limit = params?.limit ?? 20

    const where = {
      organizationId: session.orgId,
      ...(params?.roleId ? { roleId: params.roleId } : {}),
      ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params?.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' as const } },
              { email: { contains: params.search, mode: 'insensitive' as const } },
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

    const sanitizedUsers = users.map(({ passwordHash, ...user }) => user)

    return {
      success: true,
      data: {
        data: sanitizedUsers,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    }
  }
}

/**
 * Get a single user by ID (Manager/Admin only)
 */
export async function getUser(id: string): Promise<ActionResult<SafeUser & { _count: { behaviorLogs: number } }>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    const user = await prisma.user.findFirst({
      where: { id, organizationId: session.orgId },
      include: {
        role: { select: { id: true, name: true, type: true } },
        _count: { select: { behaviorLogs: true } },
      },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const { passwordHash, ...safeUser } = user
    return { success: true, data: safeUser }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user',
    }
  }
}

/**
 * Create a new user (Manager/Admin only)
 */
export async function createUser(data: {
  email: string
  password: string
  name: string
  roleId: string
  avatar?: string
}): Promise<ActionResult<SafeUser>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    // Verify role belongs to organization
    const role = await prisma.role.findFirst({
      where: { id: data.roleId, organizationId: session.orgId },
    })

    if (!role) {
      return { success: false, error: 'Role not found in organization' }
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        avatar: data.avatar || data.name.slice(0, 2).toUpperCase(),
        organizationId: session.orgId,
        roleId: data.roleId,
      },
      include: {
        role: { select: { id: true, name: true, type: true } },
      },
    })

    const { passwordHash: _, ...safeUser } = user
    revalidatePath('/admin/users')
    return { success: true, data: safeUser }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, error: 'Email already registered' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    }
  }
}

/**
 * Update a user (Manager/Admin only)
 */
export async function updateUser(
  id: string,
  data: {
    email?: string
    name?: string
    avatar?: string | null
    roleId?: string
    isActive?: boolean
  }
): Promise<ActionResult<SafeUser>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    // Verify user exists and belongs to org
    const existing = await prisma.user.findFirst({
      where: { id, organizationId: session.orgId },
    })

    if (!existing) {
      return { success: false, error: 'User not found' }
    }

    // If updating role, verify it belongs to org
    if (data.roleId) {
      const role = await prisma.role.findFirst({
        where: { id: data.roleId, organizationId: session.orgId },
      })
      if (!role) {
        return { success: false, error: 'Role not found in organization' }
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: {
        role: { select: { id: true, name: true, type: true } },
      },
    })

    const { passwordHash, ...safeUser } = user
    revalidatePath('/admin/users')
    return { success: true, data: safeUser }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
    }
  }
}

/**
 * Deactivate a user (soft delete) (Manager/Admin only)
 */
export async function deactivateUser(id: string): Promise<ActionResult<{ message: string }>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    // Prevent self-deactivation
    if (id === session.userId) {
      return { success: false, error: 'Cannot deactivate your own account' }
    }

    const existing = await prisma.user.findFirst({
      where: { id, organizationId: session.orgId },
    })

    if (!existing) {
      return { success: false, error: 'User not found' }
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    revalidatePath('/admin/users')
    return { success: true, data: { message: 'User deactivated successfully' } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deactivate user',
    }
  }
}

/**
 * Get user statistics (Manager/Admin only)
 */
export async function getUserStats(
  id: string,
  days: number = 30
): Promise<ActionResult<{
  totalBehaviors: number
  verifiedBehaviors: number
  averagePerDay: number
  rank: number
  streakDays: number
  behaviorBreakdown: Array<{ behaviorId: string; behaviorName: string; count: number }>
}>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Verify user exists
    const user = await prisma.user.findFirst({
      where: { id, organizationId: session.orgId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
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
        user: { organizationId: session.orgId },
        createdAt: { gte: startDate },
      },
      _count: true,
    })

    const sortedStats = allUserStats.sort((a, b) => b._count - a._count)
    const rank = sortedStats.findIndex((s) => s.userId === id) + 1

    // Calculate streak
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

    return {
      success: true,
      data: {
        totalBehaviors,
        verifiedBehaviors,
        averagePerDay: Math.round(averagePerDay * 100) / 100,
        rank,
        streakDays,
        behaviorBreakdown,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user stats',
    }
  }
}
