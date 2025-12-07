import { createMiddleware } from 'hono/factory'
import { ZodError } from 'zod'
import type { Env } from '../types.js'

export const errorHandler = createMiddleware<Env>(async (c, next) => {
  try {
    await next()
  } catch (error) {
    console.error('API Error:', error)

    // Zod validation errors
    if (error instanceof ZodError) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.flatten().fieldErrors,
          },
        },
        400
      )
    }

    // Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: Record<string, unknown> }

      switch (prismaError.code) {
        case 'P2002':
          return c.json(
            {
              error: {
                code: 'CONFLICT',
                message: 'A record with this value already exists',
                details: prismaError.meta,
              },
            },
            409
          )
        case 'P2025':
          return c.json(
            {
              error: {
                code: 'NOT_FOUND',
                message: 'Record not found',
              },
            },
            404
          )
        case 'P2003':
          return c.json(
            {
              error: {
                code: 'BAD_REQUEST',
                message: 'Foreign key constraint failed',
                details: prismaError.meta,
              },
            },
            400
          )
      }
    }

    // Generic error
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'

    return c.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message,
        },
      },
      500
    )
  }
})

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Helper to throw common errors
export const Errors = {
  notFound: (resource: string) =>
    new ApiError('NOT_FOUND', `${resource} not found`, 404),

  unauthorized: (message = 'Unauthorized') =>
    new ApiError('UNAUTHORIZED', message, 401),

  forbidden: (message = 'Forbidden') =>
    new ApiError('FORBIDDEN', message, 403),

  badRequest: (message: string, details?: Record<string, unknown>) =>
    new ApiError('BAD_REQUEST', message, 400, details),

  conflict: (message: string) =>
    new ApiError('CONFLICT', message, 409),
}
