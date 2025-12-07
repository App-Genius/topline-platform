import type { AuthTokenPayload } from '@topline/shared'

// Hono context variables
export interface Env {
  Variables: {
    userId: string
    organizationId: string
    roleType: string
    permissions: string[]
    jwtPayload: AuthTokenPayload
  }
}

// Error types
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

// Pagination types
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}
