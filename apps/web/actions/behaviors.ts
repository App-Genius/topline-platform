'use server'

import { prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth/session'
import type { ActionResult, PaginatedResponse } from '@/lib/types'
import { revalidatePath } from 'next/cache'

interface BehaviorWithRoles {
  id: string
  name: string
  description: string | null
  targetPerDay: number
  points: number
  isActive: boolean
  organizationId: string
  createdAt: Date
  updatedAt: Date
  roles: Array<{ id: string; name: string }>
  _count?: { logs: number }
}

interface BehaviorListParams {
  page?: number
  limit?: number
  includeInactive?: boolean
}

/**
 * Get paginated list of behaviors
 */
export async function getBehaviors(
  params?: BehaviorListParams
): Promise<ActionResult<PaginatedResponse<BehaviorWithRoles>>> {
  try {
    const session = await requireAuth()

    const page = params?.page ?? 1
    const limit = params?.limit ?? 20
    const includeInactive = params?.includeInactive ?? false

    const where = {
      organizationId: session.orgId,
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

    return {
      success: true,
      data: {
        data: behaviors,
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
      error: error instanceof Error ? error.message : 'Failed to fetch behaviors',
    }
  }
}

/**
 * Get a single behavior by ID
 */
export async function getBehavior(id: string): Promise<ActionResult<BehaviorWithRoles>> {
  try {
    const session = await requireAuth()

    const behavior = await prisma.behavior.findFirst({
      where: { id, organizationId: session.orgId },
      include: {
        roles: { select: { id: true, name: true, type: true } },
        _count: { select: { logs: true } },
      },
    })

    if (!behavior) {
      return { success: false, error: 'Behavior not found' }
    }

    return { success: true, data: behavior }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch behavior',
    }
  }
}

/**
 * Create a new behavior
 */
export async function createBehavior(data: {
  name: string
  description?: string
  targetPerDay?: number
  points?: number
  roleIds?: string[]
}): Promise<ActionResult<BehaviorWithRoles>> {
  try {
    const session = await requireAuth()

    const behavior = await prisma.behavior.create({
      data: {
        name: data.name,
        description: data.description,
        targetPerDay: data.targetPerDay ?? 0,
        points: data.points ?? 1,
        organizationId: session.orgId,
        roles: data.roleIds ? { connect: data.roleIds.map((id) => ({ id })) } : undefined,
      },
      include: {
        roles: { select: { id: true, name: true } },
      },
    })

    revalidatePath('/admin/behaviors')
    return { success: true, data: behavior }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, error: 'Behavior with this name already exists' }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create behavior',
    }
  }
}

/**
 * Update a behavior
 */
export async function updateBehavior(
  id: string,
  data: {
    name?: string
    description?: string
    targetPerDay?: number
    points?: number
    isActive?: boolean
    roleIds?: string[]
  }
): Promise<ActionResult<BehaviorWithRoles>> {
  try {
    const session = await requireAuth()

    // Verify behavior exists and belongs to org
    const existing = await prisma.behavior.findFirst({
      where: { id, organizationId: session.orgId },
    })

    if (!existing) {
      return { success: false, error: 'Behavior not found' }
    }

    const behavior = await prisma.behavior.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.targetPerDay !== undefined && { targetPerDay: data.targetPerDay }),
        ...(data.points !== undefined && { points: data.points }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.roleIds !== undefined && {
          roles: {
            set: [], // Clear existing
            connect: data.roleIds.map((roleId) => ({ id: roleId })),
          },
        }),
      },
      include: {
        roles: { select: { id: true, name: true } },
      },
    })

    revalidatePath('/admin/behaviors')
    return { success: true, data: behavior }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update behavior',
    }
  }
}

/**
 * Delete a behavior (soft delete) (Manager/Admin only)
 */
export async function deleteBehavior(id: string): Promise<ActionResult<{ message: string }>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    const existing = await prisma.behavior.findFirst({
      where: { id, organizationId: session.orgId },
    })

    if (!existing) {
      return { success: false, error: 'Behavior not found' }
    }

    await prisma.behavior.update({
      where: { id },
      data: { isActive: false },
    })

    revalidatePath('/admin/behaviors')
    return { success: true, data: { message: 'Behavior deactivated successfully' } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete behavior',
    }
  }
}

/**
 * Get behavior statistics
 */
export async function getBehaviorStats(
  id: string,
  days: number = 30
): Promise<ActionResult<{
  totalLogs: number
  verifiedLogs: number
  verificationRate: number
  averagePerDay: number
  topPerformers: Array<{ userId: string; userName: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
}>> {
  try {
    const session = await requireAuth()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Verify behavior exists
    const behavior = await prisma.behavior.findFirst({
      where: { id, organizationId: session.orgId },
    })

    if (!behavior) {
      return { success: false, error: 'Behavior not found' }
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

    return {
      success: true,
      data: {
        totalLogs,
        verifiedLogs,
        verificationRate: Math.round(verificationRate * 100) / 100,
        averagePerDay: Math.round(averagePerDay * 100) / 100,
        topPerformers,
        dailyTrend,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch behavior stats',
    }
  }
}
