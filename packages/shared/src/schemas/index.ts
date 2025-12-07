import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export const industrySchema = z.enum(['RESTAURANT', 'RETAIL', 'HOSPITALITY', 'OTHER'])
export type Industry = z.infer<typeof industrySchema>

export const roleTypeSchema = z.enum([
  'ADMIN',
  'MANAGER',
  'SERVER',
  'HOST',
  'BARTENDER',
  'BUSSER',
  'PURCHASER',
  'CHEF',
  'ACCOUNTANT',
  'FACILITIES',
  'CUSTOM',
])
export type RoleType = z.infer<typeof roleTypeSchema>

export const kpiTypeSchema = z.enum([
  'REVENUE',
  'AVERAGE_CHECK',
  'COVERS',
  'RATING',
  'BEHAVIOR_COUNT',
  'GROSS_OPERATING_PROFIT',
  'COST_OF_SALES',
  'UTILITIES',
  'CASH_FLOW',
  'ACCOUNTS_RECEIVABLE',
  'BUDGET_VARIANCE',
  'FOOD_COST',
  'LABOR_COST',
])
export type KpiType = z.infer<typeof kpiTypeSchema>

export const budgetCategorySchema = z.enum([
  'REVENUE',
  'COGS',
  'LABOR',
  'UTILITIES',
  'RENT',
  'MARKETING',
  'MAINTENANCE',
  'OTHER',
])
export type BudgetCategory = z.infer<typeof budgetCategorySchema>

// ============================================
// ORGANIZATION
// ============================================

export const organizationSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  industry: industrySchema,
  settings: z.record(z.unknown()).default({}),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type Organization = z.infer<typeof organizationSchema>

export const createOrganizationSchema = organizationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

export const updateOrganizationSchema = createOrganizationSchema.partial()
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>

// ============================================
// USER
// ============================================

export const userSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  avatar: z.string().max(10).nullable(),
  organizationId: z.string().cuid(),
  roleId: z.string().cuid(),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type User = z.infer<typeof userSchema>

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
  avatar: z.string().max(10).optional(),
  roleId: z.string().cuid(),
})
export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().max(10).nullable().optional(),
  roleId: z.string().cuid().optional(),
  isActive: z.boolean().optional(),
})
export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
export type LoginInput = z.infer<typeof loginSchema>

// ============================================
// ROLE
// ============================================

export const roleSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(50),
  type: roleTypeSchema,
  permissions: z.array(z.string()).default([]),
  organizationId: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type Role = z.infer<typeof roleSchema>

export const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  type: roleTypeSchema,
  permissions: z.array(z.string()).default([]),
})
export type CreateRoleInput = z.infer<typeof createRoleSchema>

export const updateRoleSchema = createRoleSchema.partial()
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>

// ============================================
// BEHAVIOR
// ============================================

export const behaviorSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  targetPerDay: z.number().int().min(0).default(0),
  points: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  organizationId: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type Behavior = z.infer<typeof behaviorSchema>

export const createBehaviorSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  targetPerDay: z.number().int().min(0).default(0),
  points: z.number().int().min(1).default(1),
  roleIds: z.array(z.string().cuid()).optional(),
})
export type CreateBehaviorInput = z.infer<typeof createBehaviorSchema>

export const updateBehaviorSchema = createBehaviorSchema.partial().extend({
  isActive: z.boolean().optional(),
})
export type UpdateBehaviorInput = z.infer<typeof updateBehaviorSchema>

// ============================================
// BEHAVIOR LOG
// ============================================

export const behaviorLogSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  behaviorId: z.string().cuid(),
  locationId: z.string().cuid().nullable(),
  metadata: z.record(z.unknown()).default({}),
  verified: z.boolean().default(false),
  verifiedById: z.string().cuid().nullable(),
  verifiedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
})
export type BehaviorLog = z.infer<typeof behaviorLogSchema>

export const createBehaviorLogSchema = z.object({
  behaviorId: z.string().cuid(),
  locationId: z.string().cuid().optional(),
  metadata: z
    .object({
      tableNumber: z.string().optional(),
      checkAmount: z.number().min(0).optional(),
      notes: z.string().max(500).optional(),
    })
    .optional(),
})
export type CreateBehaviorLogInput = z.infer<typeof createBehaviorLogSchema>

export const verifyBehaviorLogSchema = z.object({
  verified: z.boolean(),
})
export type VerifyBehaviorLogInput = z.infer<typeof verifyBehaviorLogSchema>

// ============================================
// DAILY ENTRY
// ============================================

export const dailyEntrySchema = z.object({
  id: z.string().cuid(),
  locationId: z.string().cuid(),
  date: z.coerce.date(),
  totalRevenue: z.number().min(0).default(0),
  totalCovers: z.number().int().min(0).default(0),
  notes: z.string().max(1000).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type DailyEntry = z.infer<typeof dailyEntrySchema>

export const createDailyEntrySchema = z.object({
  locationId: z.string().cuid(),
  date: z.coerce.date(),
  totalRevenue: z.number().min(0).default(0),
  totalCovers: z.number().int().min(0).default(0),
  notes: z.string().max(1000).optional(),
})
export type CreateDailyEntryInput = z.infer<typeof createDailyEntrySchema>

export const updateDailyEntrySchema = createDailyEntrySchema.partial().omit({
  locationId: true,
  date: true,
})
export type UpdateDailyEntryInput = z.infer<typeof updateDailyEntrySchema>

// ============================================
// BENCHMARK
// ============================================

export const benchmarkSchema = z.object({
  id: z.string().cuid(),
  organizationId: z.string().cuid(),
  year: z.number().int().min(2000).max(2100),
  totalRevenue: z.number().min(0),
  daysOpen: z.number().int().min(1).max(366),
  baselineAvgCheck: z.number().min(0),
  baselineRating: z.number().min(0).max(5).default(4.0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type Benchmark = z.infer<typeof benchmarkSchema>

export const createBenchmarkSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  totalRevenue: z.number().min(0),
  daysOpen: z.number().int().min(1).max(366),
  baselineAvgCheck: z.number().min(0).optional(),
  baselineRating: z.number().min(0).max(5).default(4.0),
})
export type CreateBenchmarkInput = z.infer<typeof createBenchmarkSchema>

// ============================================
// TRAINING
// ============================================

export const trainingTopicSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  content: z.string().nullable(),
  videoUrl: z.string().url().nullable(),
  duration: z.number().int().min(1).nullable(),
  organizationId: z.string().cuid(),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type TrainingTopic = z.infer<typeof trainingTopicSchema>

export const createTrainingTopicSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().int().min(1).optional(),
})
export type CreateTrainingTopicInput = z.infer<typeof createTrainingTopicSchema>

export const trainingSessionSchema = z.object({
  id: z.string().cuid(),
  topicId: z.string().cuid(),
  date: z.coerce.date(),
  completed: z.boolean().default(false),
  notes: z.string().max(1000).nullable(),
  photoUrl: z.string().url().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type TrainingSession = z.infer<typeof trainingSessionSchema>

export const createTrainingSessionSchema = z.object({
  topicId: z.string().cuid(),
  date: z.coerce.date(),
  notes: z.string().max(1000).optional(),
})
export type CreateTrainingSessionInput = z.infer<typeof createTrainingSessionSchema>

// ============================================
// QUESTIONNAIRE
// ============================================

export const questionnaireSubmissionSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  companyName: z.string().min(1).max(100),
  industry: industrySchema,
  employeeCount: z.string(),
  responses: z.record(z.unknown()),
  scores: z.record(z.number()),
  contacted: z.boolean().default(false),
  convertedToOrg: z.string().cuid().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type QuestionnaireSubmission = z.infer<typeof questionnaireSubmissionSchema>

export const createQuestionnaireSubmissionSchema = z.object({
  email: z.string().email(),
  companyName: z.string().min(1).max(100),
  industry: industrySchema,
  employeeCount: z.enum(['1-10', '11-50', '51-200', '200+']),
  responses: z.object({
    revenueGrowth: z.number().int().min(1).max(5),
    revenueConcern: z.boolean(),
    costIncrease: z.number().int().min(1).max(5),
    trackCostOfSales: z.boolean(),
    teamContribution: z.number().int().min(1).max(5),
    retentionIssues: z.boolean(),
    regularMeetings: z.boolean(),
    existingRoles: z.array(z.string()),
  }),
})
export type CreateQuestionnaireSubmissionInput = z.infer<typeof createQuestionnaireSubmissionSchema>

// ============================================
// API RESPONSE WRAPPERS
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type PaginationInput = z.infer<typeof paginationSchema>

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      total: z.number().int(),
      page: z.number().int(),
      limit: z.number().int(),
      totalPages: z.number().int(),
    }),
  })

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
})
export type ApiError = z.infer<typeof apiErrorSchema>
