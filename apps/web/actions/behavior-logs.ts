'use server'

import { prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth/session'
import type { ActionResult, PaginatedResponse } from '@/lib/types'
import { revalidatePath } from 'next/cache'

interface BehaviorLogWithRelations {
  id: string
  userId: string
  behaviorId: string
  locationId: string | null
  metadata: unknown
  verified: boolean
  verifiedById: string | null
  verifiedAt: Date | null
  createdAt: Date
  user: { id: string; name: string; avatar: string | null }
  behavior: { id: string; name: string; points: number }
  verifiedBy: { id: string; name: string } | null
}

interface BehaviorLogListParams {
  page?: number
  limit?: number
  userId?: string
  behaviorId?: string
  verified?: boolean
  startDate?: Date
  endDate?: Date
}

/**
 * Get paginated list of behavior logs
 * Staff can only see their own logs
 * Managers/Admins can see all logs in their org
 */
export async function getBehaviorLogs(
  params?: BehaviorLogListParams
): Promise<ActionResult<PaginatedResponse<BehaviorLogWithRelations>>> {
  try {
    const session = await requireAuth()

    const page = params?.page ?? 1
    const limit = params?.limit ?? 20

    // Staff can only see their own logs
    const effectiveUserId =
      session.roleType === 'ADMIN' || session.roleType === 'MANAGER'
        ? params?.userId
        : session.userId

    const where = {
      user: { organizationId: session.orgId },
      ...(effectiveUserId ? { userId: effectiveUserId } : {}),
      ...(params?.behaviorId ? { behaviorId: params.behaviorId } : {}),
      ...(params?.verified !== undefined ? { verified: params.verified } : {}),
      ...(params?.startDate || params?.endDate
        ? {
            createdAt: {
              ...(params.startDate ? { gte: params.startDate } : {}),
              ...(params.endDate ? { lte: params.endDate } : {}),
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

    return {
      success: true,
      data: {
        data: logs,
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
      error: error instanceof Error ? error.message : 'Failed to fetch behavior logs',
    }
  }
}

/**
 * Create a new behavior log
 */
export async function createBehaviorLog(data: {
  behaviorId: string
  locationId?: string
  metadata?: Record<string, unknown>
}): Promise<ActionResult<BehaviorLogWithRelations>> {
  try {
    const session = await requireAuth()

    // Verify behavior exists and is active
    const behavior = await prisma.behavior.findFirst({
      where: { id: data.behaviorId, organizationId: session.orgId, isActive: true },
    })

    if (!behavior) {
      return { success: false, error: 'Behavior not found' }
    }

    // If location provided, verify it exists
    if (data.locationId) {
      const location = await prisma.location.findFirst({
        where: { id: data.locationId, organizationId: session.orgId },
      })
      if (!location) {
        return { success: false, error: 'Location not found' }
      }
    }

    const log = await prisma.behaviorLog.create({
      data: {
        userId: session.userId,
        behaviorId: data.behaviorId,
        locationId: data.locationId,
        metadata: (data.metadata || {}) as object,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        behavior: { select: { id: true, name: true, points: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
    })

    revalidatePath('/staff')
    revalidatePath('/manager')
    revalidatePath('/scoreboard')
    return { success: true, data: log }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create behavior log',
    }
  }
}

/**
 * Verify a behavior log (Manager/Admin only)
 */
export async function verifyBehaviorLog(
  id: string,
  verified: boolean
): Promise<ActionResult<BehaviorLogWithRelations>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    const existing = await prisma.behaviorLog.findFirst({
      where: { id },
      include: { user: { select: { organizationId: true } } },
    })

    if (!existing || existing.user.organizationId !== session.orgId) {
      return { success: false, error: 'Behavior log not found' }
    }

    const log = await prisma.behaviorLog.update({
      where: { id },
      data: {
        verified,
        verifiedById: verified ? session.userId : null,
        verifiedAt: verified ? new Date() : null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        behavior: { select: { id: true, name: true, points: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
    })

    revalidatePath('/manager')
    revalidatePath('/staff')
    return { success: true, data: log }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify behavior log',
    }
  }
}

/**
 * Get pending verifications (Manager/Admin only)
 */
export async function getPendingLogs(params?: {
  page?: number
  limit?: number
}): Promise<ActionResult<PaginatedResponse<BehaviorLogWithRelations>>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    const page = params?.page ?? 1
    const limit = params?.limit ?? 20

    const where = {
      user: { organizationId: session.orgId },
      verified: false,
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

    return {
      success: true,
      data: {
        data: logs,
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
      error: error instanceof Error ? error.message : 'Failed to fetch pending logs',
    }
  }
}

/**
 * Bulk verify multiple behavior logs (Manager/Admin only)
 */
export async function bulkVerifyBehaviorLogs(
  ids: string[],
  verified: boolean
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    if (ids.length === 0) {
      return { success: false, error: 'No logs provided' }
    }

    // Verify all logs belong to the organization
    const logs = await prisma.behaviorLog.findMany({
      where: {
        id: { in: ids },
        user: { organizationId: session.orgId },
      },
      select: { id: true },
    })

    if (logs.length !== ids.length) {
      return { success: false, error: 'Some behavior logs not found or not accessible' }
    }

    // Update all logs
    const result = await prisma.behaviorLog.updateMany({
      where: {
        id: { in: ids },
        user: { organizationId: session.orgId },
      },
      data: {
        verified,
        verifiedById: verified ? session.userId : null,
        verifiedAt: verified ? new Date() : null,
      },
    })

    revalidatePath('/manager')
    revalidatePath('/manager/verification')
    revalidatePath('/staff')
    revalidatePath('/scoreboard')

    return { success: true, data: { count: result.count } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk verify behavior logs',
    }
  }
}

/**
 * Delete a behavior log
 * Staff can only delete their own unverified logs
 * Managers/Admins can delete any log
 */
export async function deleteBehaviorLog(id: string): Promise<ActionResult<{ message: string }>> {
  try {
    const session = await requireAuth()

    const log = await prisma.behaviorLog.findFirst({
      where: { id },
      include: { user: { select: { organizationId: true } } },
    })

    if (!log || log.user.organizationId !== session.orgId) {
      return { success: false, error: 'Behavior log not found' }
    }

    // Staff can only delete their own unverified logs
    if (session.roleType !== 'ADMIN' && session.roleType !== 'MANAGER') {
      if (log.userId !== session.userId) {
        return { success: false, error: 'Can only delete your own logs' }
      }
      if (log.verified) {
        return { success: false, error: 'Cannot delete verified logs' }
      }
    }

    await prisma.behaviorLog.delete({ where: { id } })

    revalidatePath('/staff')
    revalidatePath('/manager')
    return { success: true, data: { message: 'Behavior log deleted successfully' } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete behavior log',
    }
  }
}
