'use server'

import { prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth/session'
import type { ActionResult, PaginatedResponse } from '@/lib/types'
import { revalidatePath } from 'next/cache'

// ============================================
// TYPES
// ============================================

export interface VIPGuest {
  name: string
  table: string
  notes: string
}

export interface EightySixedItem {
  item: string
  reason: string
  alternatives?: string[]
}

export interface UpsellItem {
  item: string
  margin: 'High' | 'Medium' | 'Low'
  description: string
}

export interface TrainingTopicData {
  id: string
  title: string
  description: string
  relatedBehavior?: string
  tips: string[]
  videoUrl?: string
  videoDuration?: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
}

export interface BriefingData {
  id: string
  date: string
  dateFormatted: string
  reservations: {
    total: number
    lunch: number
    dinner: number
  }
  vipGuests: VIPGuest[]
  eightySixed: EightySixedItem[]
  upsellItems: {
    food: UpsellItem[]
    beverage: UpsellItem[]
  }
  trainingTopic: TrainingTopicData
  teamOnShift: TeamMember[]
  sessionId?: string // If a session already exists for today
  isCompleted: boolean
}

export interface BriefingAttendance {
  briefingId: string
  sessionId: string
  attendeeIds: string[]
  completedAt: string
  completedBy: string
  photoUrl?: string
}

export interface BriefingHistoryEntry {
  id: string
  date: string
  dateFormatted: string
  trainingTopicName: string
  attendeeCount: number
  totalStaff: number
  attendanceRate: number
  completedAt: string
  completedBy: string
  photoUrl?: string
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Default placeholder data for external integrations
// In Phase 2, these would come from POS/reservation integrations
function getPlaceholderBriefingData(): {
  vipGuests: VIPGuest[]
  eightySixed: EightySixedItem[]
  upsellItems: { food: UpsellItem[]; beverage: UpsellItem[] }
  reservations: { total: number; lunch: number; dinner: number }
} {
  return {
    reservations: {
      total: 0,
      lunch: 0,
      dinner: 0,
    },
    vipGuests: [],
    eightySixed: [],
    upsellItems: {
      food: [],
      beverage: [],
    },
  }
}

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Get today's briefing data
 * Combines training topic, team members, and placeholder operational data
 */
export async function getTodaysBriefing(
  date?: string
): Promise<ActionResult<BriefingData>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    const targetDate = date ? new Date(date) : new Date()
    targetDate.setHours(0, 0, 0, 0)
    const dateStr = getDateString(targetDate)

    // Get organization's training topics
    const trainingTopics = await prisma.trainingTopic.findMany({
      where: {
        organizationId: session.orgId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get or determine today's training topic
    // For now, cycle through topics based on day of year
    const dayOfYear = Math.floor(
      (targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    const todaysTopic = trainingTopics.length > 0
      ? trainingTopics[dayOfYear % trainingTopics.length]
      : null

    // Check if session exists for today
    const existingSession = todaysTopic
      ? await prisma.trainingSession.findFirst({
          where: {
            topicId: todaysTopic.id,
            date: targetDate,
          },
          include: {
            attendance: true,
          },
        })
      : null

    // Get team members (staff roles)
    const staffRoleTypes = ['SERVER', 'HOST', 'BARTENDER', 'BUSSER', 'CHEF', 'FRONT_DESK', 'HOUSEKEEPING']
    const teamMembers = await prisma.user.findMany({
      where: {
        organizationId: session.orgId,
        isActive: true,
        role: {
          type: { in: staffRoleTypes as never[] },
        },
      },
      include: {
        role: { select: { name: true, type: true } },
      },
      orderBy: { name: 'asc' },
    })

    // Get behaviors related to training topic (for tips)
    const relatedBehaviors = todaysTopic
      ? await prisma.behavior.findMany({
          where: {
            organizationId: session.orgId,
            isActive: true,
            name: { contains: todaysTopic.name.split(' ')[0], mode: 'insensitive' },
          },
          take: 1,
        })
      : []

    const placeholderData = getPlaceholderBriefingData()

    const briefingData: BriefingData = {
      id: `briefing-${dateStr}`,
      date: dateStr,
      dateFormatted: formatDate(targetDate),
      reservations: placeholderData.reservations,
      vipGuests: placeholderData.vipGuests,
      eightySixed: placeholderData.eightySixed,
      upsellItems: placeholderData.upsellItems,
      trainingTopic: todaysTopic
        ? {
            id: todaysTopic.id,
            title: todaysTopic.name,
            description: todaysTopic.description || '',
            relatedBehavior: relatedBehaviors[0]?.name,
            tips: todaysTopic.content
              ? todaysTopic.content.split('\n').filter((line) => line.trim().startsWith('-')).map((line) => line.replace(/^-\s*/, ''))
              : ['Focus on guest satisfaction', 'Practice the behavior throughout the shift'],
            videoUrl: todaysTopic.videoUrl || undefined,
            videoDuration: todaysTopic.duration ? `${todaysTopic.duration} min` : undefined,
          }
        : {
            id: 'default',
            title: 'Daily Focus',
            description: 'Focus on excellent service and guest satisfaction today.',
            tips: ['Greet every guest with a smile', 'Be attentive to guest needs'],
          },
      teamOnShift: teamMembers.map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role.name,
        avatar: member.avatar || member.name.slice(0, 2).toUpperCase(),
      })),
      sessionId: existingSession?.id,
      isCompleted: existingSession?.completed || false,
    }

    return { success: true, data: briefingData }
  } catch (error) {
    console.error('Get briefing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get briefing data',
    }
  }
}

/**
 * Complete a briefing session with attendance
 */
export async function completeBriefing(data: {
  date?: string
  trainingTopicId: string
  attendeeIds: string[]
  notes?: string
  photoUrl?: string
}): Promise<ActionResult<BriefingAttendance>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    const targetDate = data.date ? new Date(data.date) : new Date()
    targetDate.setHours(0, 0, 0, 0)

    // Verify training topic exists and belongs to org
    const topic = await prisma.trainingTopic.findFirst({
      where: {
        id: data.trainingTopicId,
        organizationId: session.orgId,
      },
    })

    if (!topic && data.trainingTopicId !== 'default') {
      return { success: false, error: 'Training topic not found' }
    }

    // Verify all attendees belong to org
    const validAttendees = await prisma.user.findMany({
      where: {
        id: { in: data.attendeeIds },
        organizationId: session.orgId,
        isActive: true,
      },
    })

    if (validAttendees.length !== data.attendeeIds.length) {
      return { success: false, error: 'Some attendees are not valid team members' }
    }

    // Create or update training session
    let trainingSession = await prisma.trainingSession.findFirst({
      where: {
        topicId: data.trainingTopicId === 'default' ? undefined : data.trainingTopicId,
        date: targetDate,
      },
    })

    if (trainingSession) {
      // Update existing session
      trainingSession = await prisma.trainingSession.update({
        where: { id: trainingSession.id },
        data: {
          completed: true,
          notes: data.notes,
          photoUrl: data.photoUrl,
        },
      })

      // Delete existing attendance records and recreate
      await prisma.trainingAttendance.deleteMany({
        where: { sessionId: trainingSession.id },
      })
    } else if (data.trainingTopicId !== 'default') {
      // Create new session
      trainingSession = await prisma.trainingSession.create({
        data: {
          topicId: data.trainingTopicId,
          date: targetDate,
          completed: true,
          notes: data.notes,
          photoUrl: data.photoUrl,
        },
      })
    }

    // Create attendance records
    if (trainingSession) {
      await prisma.trainingAttendance.createMany({
        data: data.attendeeIds.map((userId) => ({
          sessionId: trainingSession!.id,
          userId,
          present: true,
        })),
      })
    }

    revalidatePath('/manager/briefing')
    revalidatePath('/manager')

    return {
      success: true,
      data: {
        briefingId: `briefing-${getDateString(targetDate)}`,
        sessionId: trainingSession?.id || 'no-session',
        attendeeIds: data.attendeeIds,
        completedAt: new Date().toISOString(),
        completedBy: session.userId,
        photoUrl: data.photoUrl,
      },
    }
  } catch (error) {
    console.error('Complete briefing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete briefing',
    }
  }
}

/**
 * Upload attendance sheet photo
 * For MVP, stores as base64 or file path - Phase 2 would use cloud storage
 */
export async function uploadAttendancePhoto(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  try {
    await requireRole('MANAGER', 'ADMIN')

    const file = formData.get('file') as File | null

    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please upload JPG, PNG, or WebP.' }
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: 'File too large. Maximum size is 10MB.' }
    }

    // For MVP, we'll store as a local path
    // In production, this would upload to S3/Cloudinary/etc.
    const timestamp = Date.now()
    const filename = `attendance-${timestamp}.${file.type.split('/')[1]}`
    const url = `/uploads/${filename}`

    // Note: Actual file storage would go here
    // For now, we return a placeholder URL

    return {
      success: true,
      data: { url },
    }
  } catch (error) {
    console.error('Upload photo error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload photo',
    }
  }
}

/**
 * Get briefing history
 */
export async function getBriefingHistory(params?: {
  page?: number
  limit?: number
  days?: number
}): Promise<ActionResult<PaginatedResponse<BriefingHistoryEntry>>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    const page = params?.page ?? 1
    const limit = params?.limit ?? 10
    const days = params?.days ?? 30

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Get training sessions with attendance
    const [sessions, total] = await Promise.all([
      prisma.trainingSession.findMany({
        where: {
          date: { gte: startDate },
          topic: { organizationId: session.orgId },
          completed: true,
        },
        include: {
          topic: { select: { name: true } },
          attendance: {
            include: {
              user: { select: { id: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.trainingSession.count({
        where: {
          date: { gte: startDate },
          topic: { organizationId: session.orgId },
          completed: true,
        },
      }),
    ])

    // Get total staff count for attendance rate calculation
    const staffCount = await prisma.user.count({
      where: {
        organizationId: session.orgId,
        isActive: true,
        role: {
          type: { in: ['SERVER', 'HOST', 'BARTENDER', 'BUSSER', 'CHEF', 'FRONT_DESK', 'HOUSEKEEPING'] as never[] },
        },
      },
    })

    const historyEntries: BriefingHistoryEntry[] = sessions.map((s) => ({
      id: s.id,
      date: getDateString(s.date),
      dateFormatted: formatDate(s.date),
      trainingTopicName: s.topic.name,
      attendeeCount: s.attendance.filter((a) => a.present).length,
      totalStaff: staffCount,
      attendanceRate: staffCount > 0
        ? Math.round((s.attendance.filter((a) => a.present).length / staffCount) * 100)
        : 0,
      completedAt: s.updatedAt.toISOString(),
      completedBy: 'manager', // Would need to add completedById to TrainingSession
      photoUrl: s.photoUrl || undefined,
    }))

    return {
      success: true,
      data: {
        data: historyEntries,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    }
  } catch (error) {
    console.error('Get briefing history error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get briefing history',
    }
  }
}

/**
 * Get team members on shift for a specific date
 */
export async function getTeamOnShift(
  date?: string
): Promise<ActionResult<TeamMember[]>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    // For MVP, return all active staff
    // Phase 2 would integrate with scheduling system
    const staffRoleTypes = ['SERVER', 'HOST', 'BARTENDER', 'BUSSER', 'CHEF', 'FRONT_DESK', 'HOUSEKEEPING']

    const teamMembers = await prisma.user.findMany({
      where: {
        organizationId: session.orgId,
        isActive: true,
        role: {
          type: { in: staffRoleTypes as never[] },
        },
      },
      include: {
        role: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    })

    return {
      success: true,
      data: teamMembers.map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role.name,
        avatar: member.avatar || member.name.slice(0, 2).toUpperCase(),
      })),
    }
  } catch (error) {
    console.error('Get team on shift error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get team members',
    }
  }
}
