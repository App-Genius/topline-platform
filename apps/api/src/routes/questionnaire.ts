import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { prisma } from '@topline/db'
import {
  createQuestionnaireSubmissionSchema,
  questionnaireSubmissionSchema,
  paginationSchema,
} from '@topline/shared'
import { scoreQuestionnaire } from '@topline/shared'
import { Errors } from '../middleware/error-handler.js'

const app = new OpenAPIHono()

// ============================================
// SUBMIT QUESTIONNAIRE (Public)
// ============================================

const submitRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Questionnaire'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createQuestionnaireSubmissionSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Questionnaire submitted',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            scores: z.object({
              revenueHealth: z.number(),
              costManagement: z.number(),
              teamEngagement: z.number(),
              overall: z.number(),
              recommendations: z.array(z.string()),
            }),
            message: z.string(),
          }),
        },
      },
    },
  },
})

app.openapi(submitRoute, async (c) => {
  const data = c.req.valid('json')

  // Calculate scores
  const scores = scoreQuestionnaire(data.responses)

  const submission = await prisma.questionnaireSubmission.create({
    data: {
      email: data.email,
      companyName: data.companyName,
      industry: data.industry,
      employeeCount: data.employeeCount,
      responses: data.responses,
      scores: {
        revenueHealth: scores.revenueHealth,
        costManagement: scores.costManagement,
        teamEngagement: scores.teamEngagement,
        overall: scores.overall,
      },
    },
  })

  return c.json(
    {
      id: submission.id,
      scores,
      message:
        scores.overall >= 70
          ? 'Great news! Your business is well-positioned for Topline. Our team will be in touch soon.'
          : 'Thank you for your submission. Our team will review your responses and reach out with personalized recommendations.',
    },
    201
  )
})

// ============================================
// GET SUBMISSION BY ID (for thank you page)
// ============================================

const getSubmissionRoute = createRoute({
  method: 'get',
  path: '/:id',
  tags: ['Questionnaire'],
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
  },
  responses: {
    200: {
      description: 'Submission details',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            companyName: z.string(),
            scores: z.object({
              revenueHealth: z.number(),
              costManagement: z.number(),
              teamEngagement: z.number(),
              overall: z.number(),
            }),
            recommendations: z.array(z.string()),
            createdAt: z.string(),
          }),
        },
      },
    },
    404: {
      description: 'Submission not found',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({ code: z.string(), message: z.string() }),
          }),
        },
      },
    },
  },
})

app.openapi(getSubmissionRoute, async (c) => {
  const { id } = c.req.valid('param')

  const submission = await prisma.questionnaireSubmission.findUnique({
    where: { id },
  })

  if (!submission) {
    throw Errors.notFound('Submission')
  }

  // Recalculate recommendations
  const responses = submission.responses as any
  const scores = scoreQuestionnaire(responses)

  return c.json({
    id: submission.id,
    companyName: submission.companyName,
    scores: submission.scores as any,
    recommendations: scores.recommendations,
    createdAt: submission.createdAt.toISOString(),
  })
})

// ============================================
// ADMIN: LIST SUBMISSIONS (Protected - would need auth)
// ============================================

const listSubmissionsRoute = createRoute({
  method: 'get',
  path: '/admin/list',
  tags: ['Questionnaire'],
  request: {
    query: paginationSchema.extend({
      contacted: z.coerce.boolean().optional(),
      minScore: z.coerce.number().min(0).max(100).optional(),
    }),
    headers: z.object({
      'x-admin-key': z.string(),
    }),
  },
  responses: {
    200: {
      description: 'List of submissions',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(questionnaireSubmissionSchema),
            meta: z.object({
              total: z.number(),
              page: z.number(),
              limit: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({ code: z.string(), message: z.string() }),
          }),
        },
      },
    },
  },
})

app.openapi(listSubmissionsRoute, async (c) => {
  const adminKey = c.req.header('x-admin-key')

  // Simple admin key check (in production, use proper auth)
  if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'topline-admin-dev') {
    throw Errors.unauthorized('Invalid admin key')
  }

  const { page, limit, contacted, minScore } = c.req.valid('query')

  const where = {
    ...(contacted !== undefined ? { contacted } : {}),
    ...(minScore !== undefined
      ? {
          scores: {
            path: ['overall'],
            gte: minScore,
          },
        }
      : {}),
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

  return c.json({
    data: submissions,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// ============================================
// ADMIN: MARK AS CONTACTED
// ============================================

const markContactedRoute = createRoute({
  method: 'patch',
  path: '/admin/:id/contacted',
  tags: ['Questionnaire'],
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
    headers: z.object({
      'x-admin-key': z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Marked as contacted',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
  },
})

app.openapi(markContactedRoute, async (c) => {
  const adminKey = c.req.header('x-admin-key')

  if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'topline-admin-dev') {
    throw Errors.unauthorized('Invalid admin key')
  }

  const { id } = c.req.valid('param')

  await prisma.questionnaireSubmission.update({
    where: { id },
    data: { contacted: true },
  })

  return c.json({ message: 'Marked as contacted' })
})

export default app
