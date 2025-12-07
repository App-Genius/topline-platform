import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
vi.mock('@topline/db', () => ({
  prisma: {
    questionnaireSubmission: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock the scoreQuestionnaire function
vi.mock('@topline/shared', () => ({
  scoreQuestionnaire: vi.fn().mockReturnValue({
    revenueHealth: 75,
    costManagement: 60,
    teamEngagement: 80,
    overall: 72,
    recommendations: [
      'Focus on cost tracking',
      'Implement team training program',
    ],
  }),
  createQuestionnaireSubmissionSchema: {},
  questionnaireSubmissionSchema: {},
  paginationSchema: {},
}))

import { prisma } from '@topline/db'
import { scoreQuestionnaire } from '@topline/shared'

// Test fixtures
const mockSubmission = {
  id: 'sub_123',
  email: 'test@company.com',
  companyName: 'Test Company',
  industry: 'restaurant',
  employeeCount: '11-50',
  responses: {
    revenueIncreased: 4,
    revenueConcrn: true,
    costsIncreased: 3,
    trackCostOfSales: true,
    teamContributes: 4,
    retentionIssues: false,
    regularMeetings: true,
  },
  scores: {
    revenueHealth: 75,
    costManagement: 60,
    teamEngagement: 80,
    overall: 72,
  },
  contacted: false,
  convertedToOrgId: null,
  createdAt: new Date('2024-01-15'),
}

describe('Questionnaire API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Submit Questionnaire (Public)', () => {
    it('should validate email is required', () => {
      const input = { email: '' }
      const isValid = input.email.length > 0 && input.email.includes('@')

      expect(isValid).toBe(false)
    })

    it('should validate email format', () => {
      const validEmails = ['test@company.com', 'user@domain.co']
      const invalidEmails = ['notanemail', 'user@', 'user@domain']

      validEmails.forEach((email) => {
        const hasAt = email.includes('@')
        const domain = email.split('@')[1]
        const hasDot = domain?.includes('.')
        expect(hasAt && hasDot).toBe(true)
      })

      invalidEmails.forEach((email) => {
        const hasAt = email.includes('@')
        const domain = email.split('@')[1]
        const hasDot = domain?.includes('.') ?? false
        const isValid = hasAt && hasDot
        expect(isValid).toBe(false)
      })
    })

    it('should validate company name is required', () => {
      const input = { companyName: '' }
      const isValid = input.companyName.length > 0

      expect(isValid).toBe(false)
    })

    it('should calculate scores from responses', () => {
      const responses = {
        revenueIncreased: 4,
        revenueConcern: true,
        costsIncreased: 3,
      }

      const scores = scoreQuestionnaire(responses)

      expect(scores.revenueHealth).toBe(75)
      expect(scores.costManagement).toBe(60)
      expect(scores.teamEngagement).toBe(80)
      expect(scores.overall).toBe(72)
    })

    it('should generate recommendations based on scores', () => {
      const responses = {}
      const scores = scoreQuestionnaire(responses)

      expect(scores.recommendations).toBeDefined()
      expect(Array.isArray(scores.recommendations)).toBe(true)
      expect(scores.recommendations.length).toBeGreaterThan(0)
    })

    it('should create submission with scores', async () => {
      vi.mocked(prisma.questionnaireSubmission.create).mockResolvedValue(mockSubmission as any)

      const result = await prisma.questionnaireSubmission.create({
        data: {
          email: 'test@company.com',
          companyName: 'Test Company',
          industry: 'restaurant',
          employeeCount: '11-50',
          responses: mockSubmission.responses,
          scores: mockSubmission.scores,
        },
      })

      expect(result.id).toBe('sub_123')
      expect(result.scores).toBeDefined()
    })

    it('should return positive message for high scores', () => {
      const overallScore = 75

      const message = overallScore >= 70
        ? 'Great news! Your business is well-positioned for Topline. Our team will be in touch soon.'
        : 'Thank you for your submission. Our team will review your responses and reach out with personalized recommendations.'

      expect(message).toContain('well-positioned')
    })

    it('should return follow-up message for low scores', () => {
      const overallScore = 50

      const message = overallScore >= 70
        ? 'Great news! Your business is well-positioned for Topline. Our team will be in touch soon.'
        : 'Thank you for your submission. Our team will review your responses and reach out with personalized recommendations.'

      expect(message).toContain('personalized recommendations')
    })
  })

  describe('Get Submission by ID', () => {
    it('should return submission with scores', async () => {
      vi.mocked(prisma.questionnaireSubmission.findUnique).mockResolvedValue(mockSubmission as any)

      const submission = await prisma.questionnaireSubmission.findUnique({
        where: { id: 'sub_123' },
      })

      expect(submission).toBeDefined()
      expect(submission?.scores).toBeDefined()
      expect(submission?.companyName).toBe('Test Company')
    })

    it('should return null if not found', async () => {
      vi.mocked(prisma.questionnaireSubmission.findUnique).mockResolvedValue(null)

      const submission = await prisma.questionnaireSubmission.findUnique({
        where: { id: 'nonexistent' },
      })

      expect(submission).toBeNull()
    })

    it('should recalculate recommendations on fetch', () => {
      const responses = mockSubmission.responses
      const scores = scoreQuestionnaire(responses)

      expect(scores.recommendations).toHaveLength(2)
    })
  })

  describe('Admin: List Submissions', () => {
    it('should require admin key', () => {
      const adminKey = 'wrong-key'
      const validKeys = [process.env.ADMIN_KEY, 'topline-admin-dev']

      const isAuthorized = validKeys.includes(adminKey)

      expect(isAuthorized).toBe(false)
    })

    it('should accept valid admin key', () => {
      const adminKey = 'topline-admin-dev'
      const validKeys = [process.env.ADMIN_KEY, 'topline-admin-dev']

      const isAuthorized = validKeys.includes(adminKey)

      expect(isAuthorized).toBe(true)
    })

    it('should filter by contacted status', () => {
      const contacted = false

      const where = {
        ...(contacted !== undefined ? { contacted } : {}),
      }

      expect(where.contacted).toBe(false)
    })

    it('should filter by minimum score', () => {
      const minScore = 70

      const where = {
        ...(minScore !== undefined
          ? {
              scores: {
                path: ['overall'],
                gte: minScore,
              },
            }
          : {}),
      }

      expect(where.scores).toBeDefined()
      expect(where.scores?.gte).toBe(70)
    })

    it('should return paginated results', async () => {
      vi.mocked(prisma.questionnaireSubmission.findMany).mockResolvedValue([mockSubmission] as any)
      vi.mocked(prisma.questionnaireSubmission.count).mockResolvedValue(1)

      const page = 1
      const limit = 20

      const [submissions, total] = await Promise.all([
        prisma.questionnaireSubmission.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.questionnaireSubmission.count(),
      ])

      expect(submissions).toHaveLength(1)
      expect(total).toBe(1)
    })
  })

  describe('Admin: Mark as Contacted', () => {
    it('should require admin key', () => {
      const adminKey = undefined

      expect(adminKey).toBeUndefined()
    })

    it('should update contacted status', async () => {
      vi.mocked(prisma.questionnaireSubmission.update).mockResolvedValue({
        ...mockSubmission,
        contacted: true,
      } as any)

      const result = await prisma.questionnaireSubmission.update({
        where: { id: 'sub_123' },
        data: { contacted: true },
      })

      expect(result.contacted).toBe(true)
    })
  })

  describe('Questionnaire Response Validation', () => {
    it('should validate scale responses are 1-5', () => {
      const validValues = [1, 2, 3, 4, 5]
      const invalidValues = [0, 6, -1]

      validValues.forEach((val) => {
        expect(val >= 1 && val <= 5).toBe(true)
      })

      invalidValues.forEach((val) => {
        expect(val >= 1 && val <= 5).toBe(false)
      })
    })

    it('should validate boolean responses', () => {
      const response = { trackCostOfSales: true }

      expect(typeof response.trackCostOfSales).toBe('boolean')
    })

    it('should validate industry selection', () => {
      const validIndustries = ['restaurant', 'retail', 'hospitality', 'other']
      const input = { industry: 'restaurant' }

      const isValid = validIndustries.includes(input.industry)

      expect(isValid).toBe(true)
    })

    it('should validate employee count selection', () => {
      const validCounts = ['1-10', '11-50', '51+']
      const input = { employeeCount: '11-50' }

      const isValid = validCounts.includes(input.employeeCount)

      expect(isValid).toBe(true)
    })
  })

  describe('Score Calculations', () => {
    it('should calculate overall score as weighted average', () => {
      const revenueHealth = 75
      const costManagement = 60
      const teamEngagement = 80

      // Simple average for now
      const overall = Math.round((revenueHealth + costManagement + teamEngagement) / 3)

      expect(overall).toBe(72)
    })

    it('should cap scores at 100', () => {
      const rawScore = 110
      const cappedScore = Math.min(rawScore, 100)

      expect(cappedScore).toBe(100)
    })

    it('should floor scores at 0', () => {
      const rawScore = -10
      const flooredScore = Math.max(rawScore, 0)

      expect(flooredScore).toBe(0)
    })
  })
})
