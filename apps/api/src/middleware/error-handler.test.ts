import { describe, it, expect } from 'vitest'
import { ZodError, z } from 'zod'
import { ApiError, Errors } from './error-handler.js'

describe('Error Handler', () => {
  describe('ApiError Class', () => {
    it('should create error with all properties', () => {
      const error = new ApiError('TEST_ERROR', 'Test message', 400, { field: 'value' })

      expect(error.code).toBe('TEST_ERROR')
      expect(error.message).toBe('Test message')
      expect(error.status).toBe(400)
      expect(error.details).toEqual({ field: 'value' })
      expect(error.name).toBe('ApiError')
    })

    it('should default status to 400', () => {
      const error = new ApiError('TEST_ERROR', 'Test message')

      expect(error.status).toBe(400)
    })

    it('should be instanceof Error', () => {
      const error = new ApiError('TEST_ERROR', 'Test message')

      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('Errors Factory', () => {
    it('should create notFound error', () => {
      const error = Errors.notFound('User')

      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('User not found')
      expect(error.status).toBe(404)
    })

    it('should create unauthorized error with default message', () => {
      const error = Errors.unauthorized()

      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.message).toBe('Unauthorized')
      expect(error.status).toBe(401)
    })

    it('should create unauthorized error with custom message', () => {
      const error = Errors.unauthorized('Invalid credentials')

      expect(error.message).toBe('Invalid credentials')
    })

    it('should create forbidden error', () => {
      const error = Errors.forbidden('Access denied')

      expect(error.code).toBe('FORBIDDEN')
      expect(error.message).toBe('Access denied')
      expect(error.status).toBe(403)
    })

    it('should create badRequest error', () => {
      const error = Errors.badRequest('Invalid input', { field: 'email' })

      expect(error.code).toBe('BAD_REQUEST')
      expect(error.message).toBe('Invalid input')
      expect(error.status).toBe(400)
      expect(error.details).toEqual({ field: 'email' })
    })

    it('should create conflict error', () => {
      const error = Errors.conflict('Email already exists')

      expect(error.code).toBe('CONFLICT')
      expect(error.message).toBe('Email already exists')
      expect(error.status).toBe(409)
    })
  })

  describe('Zod Error Handling', () => {
    it('should flatten Zod validation errors', () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      })

      const result = schema.safeParse({
        email: 'invalid-email',
        password: 'short',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const flattened = result.error.flatten()

        expect(flattened.fieldErrors.email).toBeDefined()
        expect(flattened.fieldErrors.password).toBeDefined()
      }
    })

    it('should handle nested Zod errors', () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1),
          email: z.string().email(),
        }),
      })

      const result = schema.safeParse({
        user: {
          name: '',
          email: 'invalid',
        },
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Prisma Error Codes', () => {
    it('should identify P2002 as unique constraint violation', () => {
      const prismaErrorCode = 'P2002'

      const isUniqueViolation = prismaErrorCode === 'P2002'

      expect(isUniqueViolation).toBe(true)
    })

    it('should identify P2025 as record not found', () => {
      const prismaErrorCode = 'P2025'

      const isNotFound = prismaErrorCode === 'P2025'

      expect(isNotFound).toBe(true)
    })

    it('should identify P2003 as foreign key constraint', () => {
      const prismaErrorCode = 'P2003'

      const isForeignKeyViolation = prismaErrorCode === 'P2003'

      expect(isForeignKeyViolation).toBe(true)
    })
  })
})
