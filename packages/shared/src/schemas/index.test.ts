import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  createUserSchema,
  userSchema,
  createBehaviorSchema,
  behaviorSchema,
  createBehaviorLogSchema,
  createQuestionnaireSubmissionSchema,
  paginationSchema,
} from './index.js'

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login input', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createUserSchema', () => {
    it('should validate correct user input', () => {
      const result = createUserSchema.safeParse({
        email: 'newuser@example.com',
        password: 'securepass123',
        name: 'John Doe',
        roleId: 'clxxxxxxxxxxxxxxxxx',
      })
      expect(result.success).toBe(true)
    })

    it('should reject password shorter than 8 characters', () => {
      const result = createUserSchema.safeParse({
        email: 'newuser@example.com',
        password: 'short',
        name: 'John Doe',
        roleId: 'clxxxxxxxxxxxxxxxxx',
      })
      expect(result.success).toBe(false)
    })

    it('should accept optional avatar', () => {
      const result = createUserSchema.safeParse({
        email: 'newuser@example.com',
        password: 'securepass123',
        name: 'John Doe',
        avatar: 'JD',
        roleId: 'clxxxxxxxxxxxxxxxxx',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.avatar).toBe('JD')
      }
    })
  })
})

describe('Behavior Schemas', () => {
  describe('createBehaviorSchema', () => {
    it('should validate minimal behavior input', () => {
      const result = createBehaviorSchema.safeParse({
        name: 'Upsell Wine',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.targetPerDay).toBe(0)
        expect(result.data.points).toBe(1)
      }
    })

    it('should validate full behavior input', () => {
      const result = createBehaviorSchema.safeParse({
        name: 'Upsell Wine',
        description: 'Suggest a bottle instead of a glass',
        targetPerDay: 5,
        points: 2,
        roleIds: ['clxxxxxxxxxxxxxxxxx'],
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = createBehaviorSchema.safeParse({
        name: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative targetPerDay', () => {
      const result = createBehaviorSchema.safeParse({
        name: 'Valid Name',
        targetPerDay: -1,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createBehaviorLogSchema', () => {
    it('should validate minimal log input', () => {
      const result = createBehaviorLogSchema.safeParse({
        behaviorId: 'clxxxxxxxxxxxxxxxxx',
      })
      expect(result.success).toBe(true)
    })

    it('should validate full log input with metadata', () => {
      const result = createBehaviorLogSchema.safeParse({
        behaviorId: 'clxxxxxxxxxxxxxxxxx',
        locationId: 'clyyyyyyyyyyyyyyyyy',
        metadata: {
          tableNumber: '12',
          checkAmount: 85.50,
          notes: 'Guest appreciated the recommendation',
        },
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('Questionnaire Schema', () => {
  describe('createQuestionnaireSubmissionSchema', () => {
    it('should validate complete questionnaire submission', () => {
      const result = createQuestionnaireSubmissionSchema.safeParse({
        email: 'business@example.com',
        companyName: 'Acme Restaurant',
        industry: 'RESTAURANT',
        employeeCount: '11-50',
        responses: {
          revenueGrowth: 3,
          revenueConcern: true,
          costIncrease: 4,
          trackCostOfSales: false,
          teamContribution: 2,
          retentionIssues: true,
          regularMeetings: false,
          existingRoles: ['SERVER', 'HOST', 'BARTENDER'],
        },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid industry', () => {
      const result = createQuestionnaireSubmissionSchema.safeParse({
        email: 'business@example.com',
        companyName: 'Acme Restaurant',
        industry: 'INVALID',
        employeeCount: '11-50',
        responses: {
          revenueGrowth: 3,
          revenueConcern: true,
          costIncrease: 4,
          trackCostOfSales: false,
          teamContribution: 2,
          retentionIssues: true,
          regularMeetings: false,
          existingRoles: [],
        },
      })
      expect(result.success).toBe(false)
    })

    it('should reject rating outside 1-5 range', () => {
      const result = createQuestionnaireSubmissionSchema.safeParse({
        email: 'business@example.com',
        companyName: 'Acme Restaurant',
        industry: 'RESTAURANT',
        employeeCount: '11-50',
        responses: {
          revenueGrowth: 6, // Invalid - should be 1-5
          revenueConcern: true,
          costIncrease: 4,
          trackCostOfSales: false,
          teamContribution: 2,
          retentionIssues: true,
          regularMeetings: false,
          existingRoles: [],
        },
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Pagination Schema', () => {
  describe('paginationSchema', () => {
    it('should use default values when empty', () => {
      const result = paginationSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('should parse string numbers', () => {
      const result = paginationSchema.safeParse({
        page: '2',
        limit: '50',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(50)
      }
    })

    it('should reject page less than 1', () => {
      const result = paginationSchema.safeParse({
        page: 0,
      })
      expect(result.success).toBe(false)
    })

    it('should reject limit greater than 100', () => {
      const result = paginationSchema.safeParse({
        limit: 101,
      })
      expect(result.success).toBe(false)
    })
  })
})
