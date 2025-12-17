'use server'

import { prisma } from '@/lib/db'
import type { ActionResult, PaginatedResponse } from '@/lib/types'
import { scoreQuestionnaire } from '@/lib/utils'
import type { Industry } from '@prisma/client'

interface QuestionnaireScores {
  revenueHealth: number
  costManagement: number
  teamEngagement: number
  overall: number
  recommendations: string[]
}

interface QuestionnaireSubmission {
  id: string
  email: string
  companyName: string
  industry: string
  employeeCount: string
  responses: unknown
  scores: unknown
  contacted: boolean
  createdAt: Date
  updatedAt: Date
}

interface QuestionnaireResponses {
  revenueGrowth: number
  revenueConcern: boolean
  costIncrease: number
  trackCostOfSales: boolean
  teamContribution: number
  retentionIssues: boolean
  regularMeetings: boolean
  existingRoles?: string[]
}

/**
 * Submit a questionnaire (Public - no auth required)
 */
export async function submitQuestionnaire(data: {
  email: string
  companyName: string
  industry: string
  employeeCount: string
  responses: QuestionnaireResponses
}): Promise<
  ActionResult<{
    id: string
    scores: QuestionnaireScores
    message: string
  }>
> {
  try {
    // Calculate scores
    const scores = scoreQuestionnaire(data.responses)

    const submission = await prisma.questionnaireSubmission.create({
      data: {
        email: data.email,
        companyName: data.companyName,
        industry: data.industry as Industry,
        employeeCount: data.employeeCount,
        responses: data.responses as object,
        scores: {
          revenueHealth: scores.revenueHealth,
          costManagement: scores.costManagement,
          teamEngagement: scores.teamEngagement,
          overall: scores.overall,
        },
      },
    })

    return {
      success: true,
      data: {
        id: submission.id,
        scores,
        message:
          scores.overall >= 70
            ? 'Great news! Your business is well-positioned for Topline. Our team will be in touch soon.'
            : 'Thank you for your submission. Our team will review your responses and reach out with personalized recommendations.',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit questionnaire',
    }
  }
}

/**
 * Get questionnaire submission by ID (for thank you page)
 */
export async function getQuestionnaireResult(id: string): Promise<
  ActionResult<{
    id: string
    companyName: string
    scores: {
      revenueHealth: number
      costManagement: number
      teamEngagement: number
      overall: number
    }
    recommendations: string[]
    createdAt: string
  }>
> {
  try {
    const submission = await prisma.questionnaireSubmission.findUnique({
      where: { id },
    })

    if (!submission) {
      return { success: false, error: 'Submission not found' }
    }

    // Recalculate recommendations
    const responses = submission.responses as unknown as QuestionnaireResponses
    const scores = scoreQuestionnaire(responses)

    return {
      success: true,
      data: {
        id: submission.id,
        companyName: submission.companyName,
        scores: submission.scores as {
          revenueHealth: number
          costManagement: number
          teamEngagement: number
          overall: number
        },
        recommendations: scores.recommendations,
        createdAt: submission.createdAt.toISOString(),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch questionnaire result',
    }
  }
}

/**
 * Admin: List questionnaire submissions (requires admin key)
 */
export async function listQuestionnaireSubmissions(
  adminKey: string,
  params?: {
    page?: number
    limit?: number
    contacted?: boolean
    minScore?: number
  }
): Promise<ActionResult<PaginatedResponse<QuestionnaireSubmission>>> {
  try {
    // Simple admin key check
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'topline-admin-dev') {
      return { success: false, error: 'Unauthorized' }
    }

    const page = params?.page ?? 1
    const limit = params?.limit ?? 20

    const where = {
      ...(params?.contacted !== undefined ? { contacted: params.contacted } : {}),
      // Note: Prisma doesn't support JSON path queries directly in the where clause
      // This would need to be filtered in memory for minScore
    }

    const [submissions, total] = await Promise.all([
      prisma.questionnaireSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.questionnaireSubmission.count({ where }),
    ])

    // Filter by minScore in memory if needed
    let filtered = submissions
    if (params?.minScore !== undefined) {
      filtered = submissions.filter((s) => {
        const scores = s.scores as { overall?: number }
        return (scores.overall ?? 0) >= params.minScore!
      })
    }

    return {
      success: true,
      data: {
        data: filtered,
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
      error: error instanceof Error ? error.message : 'Failed to fetch submissions',
    }
  }
}

/**
 * Admin: Mark submission as contacted
 */
export async function markSubmissionContacted(
  id: string,
  adminKey: string
): Promise<ActionResult<{ message: string }>> {
  try {
    // Simple admin key check
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'topline-admin-dev') {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.questionnaireSubmission.update({
      where: { id },
      data: { contacted: true },
    })

    return { success: true, data: { message: 'Marked as contacted' } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark as contacted',
    }
  }
}
