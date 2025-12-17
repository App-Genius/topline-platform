'use server'

import { prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth/session'
import type { ActionResult } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import type { Industry } from '@prisma/client'

interface OrganizationWithCounts {
  id: string
  name: string
  industry: string
  createdAt: Date
  updatedAt: Date
  _count: {
    users: number
    behaviors: number
    locations: number
  }
}

interface Location {
  id: string
  name: string
  address: string | null
  isActive: boolean
}

interface Benchmark {
  id: string
  organizationId: string
  year: number
  totalRevenue: number
  daysOpen: number
  baselineAvgCheck: number
  baselineRating: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Get current organization
 */
export async function getCurrentOrganization(): Promise<ActionResult<OrganizationWithCounts>> {
  try {
    const session = await requireAuth()

    const org = await prisma.organization.findUnique({
      where: { id: session.orgId },
      include: {
        _count: {
          select: {
            users: true,
            behaviors: { where: { isActive: true } },
            locations: { where: { isActive: true } },
          },
        },
      },
    })

    if (!org) {
      return { success: false, error: 'Organization not found' }
    }

    return { success: true, data: org }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch organization',
    }
  }
}

/**
 * Update current organization (Admin only)
 */
export async function updateOrganization(data: {
  name?: string
  industry?: string
}): Promise<ActionResult<OrganizationWithCounts>> {
  try {
    await requireRole('ADMIN')
    const session = await requireAuth()

    const org = await prisma.organization.update({
      where: { id: session.orgId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.industry ? { industry: data.industry as Industry } : {}),
      },
      include: {
        _count: {
          select: {
            users: true,
            behaviors: { where: { isActive: true } },
            locations: { where: { isActive: true } },
          },
        },
      },
    })

    revalidatePath('/admin')
    return { success: true, data: org }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update organization',
    }
  }
}

/**
 * Get all locations for the organization
 */
export async function getLocations(): Promise<ActionResult<Location[]>> {
  try {
    const session = await requireAuth()

    const locations = await prisma.location.findMany({
      where: { organizationId: session.orgId },
      select: { id: true, name: true, address: true, isActive: true },
      orderBy: { name: 'asc' },
    })

    return { success: true, data: locations }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch locations',
    }
  }
}

/**
 * Create a new location (Admin only)
 */
export async function createLocation(data: {
  name: string
  address?: string
}): Promise<ActionResult<Location>> {
  try {
    await requireRole('ADMIN')
    const session = await requireAuth()

    const location = await prisma.location.create({
      data: {
        ...data,
        organizationId: session.orgId,
      },
      select: { id: true, name: true, address: true, isActive: true },
    })

    revalidatePath('/admin')
    return { success: true, data: location }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create location',
    }
  }
}

/**
 * Get all benchmarks for the organization
 */
export async function getBenchmarks(): Promise<ActionResult<Benchmark[]>> {
  try {
    const session = await requireAuth()

    const benchmarks = await prisma.benchmark.findMany({
      where: { organizationId: session.orgId },
      orderBy: { year: 'desc' },
    })

    return { success: true, data: benchmarks }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch benchmarks',
    }
  }
}

/**
 * Create or update a benchmark (Manager/Admin only)
 */
export async function upsertBenchmark(data: {
  year: number
  totalRevenue: number
  daysOpen: number
  baselineAvgCheck?: number
  baselineRating?: number
}): Promise<ActionResult<Benchmark>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    // Calculate baseline avg check if not provided
    const baselineAvgCheck = data.baselineAvgCheck ?? data.totalRevenue / data.daysOpen

    const benchmark = await prisma.benchmark.upsert({
      where: {
        organizationId_year: {
          organizationId: session.orgId,
          year: data.year,
        },
      },
      update: {
        totalRevenue: data.totalRevenue,
        daysOpen: data.daysOpen,
        baselineAvgCheck,
        baselineRating: data.baselineRating ?? 4.0,
      },
      create: {
        organizationId: session.orgId,
        year: data.year,
        totalRevenue: data.totalRevenue,
        daysOpen: data.daysOpen,
        baselineAvgCheck,
        baselineRating: data.baselineRating ?? 4.0,
      },
    })

    revalidatePath('/admin')
    revalidatePath('/setup')
    return { success: true, data: benchmark }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save benchmark',
    }
  }
}

/**
 * Update organization settings (Admin only)
 * Settings include scoreboard, notifications, and other configurable options
 */
export async function updateOrganizationSettings(settings: {
  scoreboard?: {
    metrics?: Array<{
      id: string
      name: string
      description: string
      enabled: boolean
    }>
    refreshInterval?: number
    showLeaderboard?: boolean
    anonymizeNames?: boolean
    theme?: 'dark' | 'light'
  }
  notifications?: {
    emailAlerts?: boolean
    budgetWarnings?: boolean
    performanceUpdates?: boolean
  }
}): Promise<ActionResult<{ settings: unknown }>> {
  try {
    await requireRole('ADMIN', 'MANAGER')
    const session = await requireAuth()

    // Get current organization settings
    const org = await prisma.organization.findUnique({
      where: { id: session.orgId },
      select: { settings: true },
    })

    if (!org) {
      return { success: false, error: 'Organization not found' }
    }

    // Merge new settings with existing settings
    const currentSettings = (org.settings as Record<string, unknown>) || {}
    const newSettings = {
      ...currentSettings,
      ...(settings.scoreboard ? { scoreboard: { ...(currentSettings.scoreboard as object || {}), ...settings.scoreboard } } : {}),
      ...(settings.notifications ? { notifications: { ...(currentSettings.notifications as object || {}), ...settings.notifications } } : {}),
    }

    // Update organization with new settings
    const updated = await prisma.organization.update({
      where: { id: session.orgId },
      data: { settings: newSettings },
      select: { settings: true },
    })

    revalidatePath('/settings')
    revalidatePath('/scoreboard')

    return { success: true, data: { settings: updated.settings } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
    }
  }
}

/**
 * Get organization settings
 */
export async function getOrganizationSettings(): Promise<
  ActionResult<{
    organization: { name: string; industry: string }
    settings: {
      scoreboard?: {
        metrics?: Array<{
          id: string
          name: string
          description: string
          enabled: boolean
        }>
        refreshInterval?: number
        showLeaderboard?: boolean
        anonymizeNames?: boolean
        theme?: 'dark' | 'light'
      }
      notifications?: {
        emailAlerts?: boolean
        budgetWarnings?: boolean
        performanceUpdates?: boolean
      }
    }
  }>
> {
  try {
    const session = await requireAuth()

    const org = await prisma.organization.findUnique({
      where: { id: session.orgId },
      select: { name: true, industry: true, settings: true },
    })

    if (!org) {
      return { success: false, error: 'Organization not found' }
    }

    return {
      success: true,
      data: {
        organization: {
          name: org.name,
          industry: org.industry,
        },
        settings: (org.settings as Record<string, unknown>) || {},
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch settings',
    }
  }
}

/**
 * Get dashboard data
 */
export async function getDashboard(
  days: number = 30
): Promise<
  ActionResult<{
    gameState: {
      status: 'neutral' | 'winning' | 'losing' | 'celebrating'
      currentScore: number
      targetScore: number
      percentComplete: number
      daysRemaining: number
    }
    kpis: {
      revenue: { current: number; target: number; trend: number }
      avgCheck: { current: number; baseline: number; trend: number }
      behaviors: { today: number; average: number }
      rating: { current: number; baseline: number }
    }
    leaderboard: Array<{
      rank: number
      userId: string
      userName: string
      avatar: string | null
      score: number
    }>
  }>
> {
  try {
    const session = await requireAuth()

    const now = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get benchmark
    const benchmark = await prisma.benchmark.findFirst({
      where: { organizationId: session.orgId },
      orderBy: { year: 'desc' },
    })

    // Get daily entries
    const entries = await prisma.dailyEntry.findMany({
      where: {
        location: { organizationId: session.orgId },
        date: { gte: startDate },
      },
    })

    // Get behavior logs
    const logs = await prisma.behaviorLog.findMany({
      where: {
        user: { organizationId: session.orgId },
        createdAt: { gte: startDate },
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        behavior: { select: { points: true } },
      },
    })

    // Calculate KPIs
    const totalRevenue = entries.reduce((sum, e) => sum + e.totalRevenue, 0)
    const totalCovers = entries.reduce((sum, e) => sum + e.totalCovers, 0)
    const avgCheck = totalCovers > 0 ? totalRevenue / totalCovers : 0
    const todayLogs = logs.filter((l) => l.createdAt.toDateString() === now.toDateString()).length

    // Calculate game state
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const dayOfYear = Math.floor((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = 365 - dayOfYear
    const targetToDate = benchmark ? (benchmark.totalRevenue / benchmark.daysOpen) * dayOfYear : 0
    const ytdRevenue = totalRevenue // Simplified - should be YTD

    let status: 'neutral' | 'winning' | 'losing' | 'celebrating' = 'neutral'
    if (benchmark) {
      const progress = ytdRevenue / targetToDate
      if (progress >= 1.05) status = 'winning'
      else if (progress <= 0.95) status = 'losing'
      if (ytdRevenue >= benchmark.totalRevenue) status = 'celebrating'
    }

    // Calculate leaderboard
    const userScores = new Map<string, { name: string; avatar: string | null; score: number }>()
    for (const log of logs) {
      const current = userScores.get(log.userId) || {
        name: log.user.name,
        avatar: log.user.avatar,
        score: 0,
      }
      userScores.set(log.userId, {
        ...current,
        score: current.score + log.behavior.points,
      })
    }

    const leaderboard = Array.from(userScores.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.name,
        avatar: data.avatar,
        score: data.score,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

    return {
      success: true,
      data: {
        gameState: {
          status,
          currentScore: Math.round(ytdRevenue),
          targetScore: Math.round(benchmark?.totalRevenue || 0),
          percentComplete: benchmark
            ? Math.round((ytdRevenue / benchmark.totalRevenue) * 10000) / 100
            : 0,
          daysRemaining,
        },
        kpis: {
          revenue: {
            current: Math.round(totalRevenue),
            target: Math.round(targetToDate),
            trend: 0, // Calculate from previous period
          },
          avgCheck: {
            current: Math.round(avgCheck * 100) / 100,
            baseline: benchmark?.baselineAvgCheck || 0,
            trend: benchmark
              ? Math.round(
                  ((avgCheck - benchmark.baselineAvgCheck) / benchmark.baselineAvgCheck) * 10000
                ) / 100
              : 0,
          },
          behaviors: {
            today: todayLogs,
            average: Math.round(logs.length / days),
          },
          rating: {
            current: 4.2, // Would come from reviews
            baseline: benchmark?.baselineRating || 4.0,
          },
        },
        leaderboard,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
    }
  }
}
