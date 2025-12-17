'use server'

import { prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth/session'
import type { ActionResult, PaginatedResponse } from '@/lib/types'
import { revalidatePath } from 'next/cache'

interface DailyEntryWithLocation {
  id: string
  locationId: string
  date: Date
  totalRevenue: number
  totalCovers: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
  location: { id: string; name: string }
  avgCheck: number
}

interface DailyEntryListParams {
  page?: number
  limit?: number
  locationId?: string
  startDate?: Date
  endDate?: Date
}

/**
 * Get paginated list of daily entries
 */
export async function getDailyEntries(
  params?: DailyEntryListParams
): Promise<ActionResult<PaginatedResponse<DailyEntryWithLocation>>> {
  try {
    const session = await requireAuth()

    const page = params?.page ?? 1
    const limit = params?.limit ?? 20

    const where = {
      location: { organizationId: session.orgId },
      ...(params?.locationId ? { locationId: params.locationId } : {}),
      ...(params?.startDate || params?.endDate
        ? {
            date: {
              ...(params.startDate ? { gte: params.startDate } : {}),
              ...(params.endDate ? { lte: params.endDate } : {}),
            },
          }
        : {}),
    }

    const [entries, total] = await Promise.all([
      prisma.dailyEntry.findMany({
        where,
        include: {
          location: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dailyEntry.count({ where }),
    ])

    // Calculate average check
    const entriesWithAvg = entries.map((entry) => ({
      ...entry,
      avgCheck: entry.totalCovers > 0 ? entry.totalRevenue / entry.totalCovers : 0,
    }))

    return {
      success: true,
      data: {
        data: entriesWithAvg,
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
      error: error instanceof Error ? error.message : 'Failed to fetch daily entries',
    }
  }
}

/**
 * Get daily entry by date
 */
export async function getDailyEntryByDate(
  date: Date,
  locationId?: string
): Promise<ActionResult<DailyEntryWithLocation | null>> {
  try {
    const session = await requireAuth()

    // If no locationId, get default location
    let targetLocationId = locationId
    if (!targetLocationId) {
      const defaultLocation = await prisma.location.findFirst({
        where: { organizationId: session.orgId, isActive: true },
        orderBy: { createdAt: 'asc' },
      })
      targetLocationId = defaultLocation?.id
    }

    if (!targetLocationId) {
      return { success: true, data: null }
    }

    const entry = await prisma.dailyEntry.findUnique({
      where: {
        locationId_date: {
          locationId: targetLocationId,
          date,
        },
      },
      include: {
        location: { select: { id: true, name: true } },
      },
    })

    if (!entry) {
      return { success: true, data: null }
    }

    return {
      success: true,
      data: {
        ...entry,
        avgCheck: entry.totalCovers > 0 ? entry.totalRevenue / entry.totalCovers : 0,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch daily entry',
    }
  }
}

/**
 * Create or update a daily entry (Manager/Admin only)
 */
export async function upsertDailyEntry(data: {
  locationId: string
  date: Date
  totalRevenue: number
  totalCovers: number
  notes?: string
}): Promise<ActionResult<DailyEntryWithLocation>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    // Verify location belongs to org
    const location = await prisma.location.findFirst({
      where: { id: data.locationId, organizationId: session.orgId },
    })

    if (!location) {
      return { success: false, error: 'Location not found' }
    }

    const entry = await prisma.dailyEntry.upsert({
      where: {
        locationId_date: {
          locationId: data.locationId,
          date: data.date,
        },
      },
      update: {
        totalRevenue: data.totalRevenue,
        totalCovers: data.totalCovers,
        notes: data.notes,
      },
      create: data,
      include: {
        location: { select: { id: true, name: true } },
      },
    })

    revalidatePath('/admin')
    revalidatePath('/manager')
    revalidatePath('/scoreboard')
    return {
      success: true,
      data: {
        ...entry,
        avgCheck: entry.totalCovers > 0 ? entry.totalRevenue / entry.totalCovers : 0,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save daily entry',
    }
  }
}

/**
 * Get daily entry statistics
 */
export async function getDailyEntryStats(
  days: number = 30,
  locationId?: string
): Promise<
  ActionResult<{
    period: { start: string; end: string; days: number }
    revenue: { total: number; average: number; trend: number }
    covers: { total: number; average: number }
    avgCheck: { current: number; previous: number; trend: number }
    dailyData: Array<{ date: string; revenue: number; covers: number; avgCheck: number }>
  }>
> {
  try {
    const session = await requireAuth()

    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const previousStart = new Date(startDate)
    previousStart.setDate(previousStart.getDate() - days)

    const where = {
      location: { organizationId: session.orgId },
      ...(locationId ? { locationId } : {}),
    }

    // Get current period
    const currentEntries = await prisma.dailyEntry.findMany({
      where: { ...where, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    })

    // Get previous period for comparison
    const previousEntries = await prisma.dailyEntry.findMany({
      where: { ...where, date: { gte: previousStart, lt: startDate } },
    })

    // Calculate stats
    const totalRevenue = currentEntries.reduce((sum, e) => sum + e.totalRevenue, 0)
    const totalCovers = currentEntries.reduce((sum, e) => sum + e.totalCovers, 0)
    const avgCheck = totalCovers > 0 ? totalRevenue / totalCovers : 0

    const prevRevenue = previousEntries.reduce((sum, e) => sum + e.totalRevenue, 0)
    const prevCovers = previousEntries.reduce((sum, e) => sum + e.totalCovers, 0)
    const prevAvgCheck = prevCovers > 0 ? prevRevenue / prevCovers : 0

    const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
    const avgCheckTrend = prevAvgCheck > 0 ? ((avgCheck - prevAvgCheck) / prevAvgCheck) * 100 : 0

    const dailyData = currentEntries.map((e) => ({
      date: e.date.toISOString().split('T')[0],
      revenue: e.totalRevenue,
      covers: e.totalCovers,
      avgCheck: e.totalCovers > 0 ? e.totalRevenue / e.totalCovers : 0,
    }))

    return {
      success: true,
      data: {
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          days,
        },
        revenue: {
          total: Math.round(totalRevenue * 100) / 100,
          average: Math.round((totalRevenue / days) * 100) / 100,
          trend: Math.round(revenueTrend * 100) / 100,
        },
        covers: {
          total: totalCovers,
          average: Math.round(totalCovers / days),
        },
        avgCheck: {
          current: Math.round(avgCheck * 100) / 100,
          previous: Math.round(prevAvgCheck * 100) / 100,
          trend: Math.round(avgCheckTrend * 100) / 100,
        },
        dailyData,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    }
  }
}
