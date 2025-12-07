/**
 * Typed API Client for Topline
 *
 * This client provides type-safe access to the Hono API.
 * All methods return typed responses based on the shared schemas.
 */

import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  Role,
  CreateRoleInput,
  UpdateRoleInput,
  Behavior,
  CreateBehaviorInput,
  UpdateBehaviorInput,
  BehaviorLog,
  CreateBehaviorLogInput,
  DailyEntry,
  CreateDailyEntryInput,
  Benchmark,
  CreateBenchmarkInput,
  Organization,
  UpdateOrganizationInput,
  CreateQuestionnaireSubmissionInput,
  PaginationInput,
  AuthResponse,
  LoginInput,
} from '@topline/shared'

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

// Token storage (client-side only)
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('topline_access_token', token)
    } else {
      localStorage.removeItem('topline_access_token')
    }
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken
  if (typeof window !== 'undefined') {
    return localStorage.getItem('topline_access_token')
  }
  return null
}

// API Error
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Generic fetch wrapper
async function fetchAPI<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken()

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'An unexpected error occurred' },
    }))
    throw new ApiError(
      error.error?.code || 'UNKNOWN',
      error.error?.message || 'An unexpected error occurred',
      response.status,
      error.error?.details
    )
  }

  // Handle empty responses
  const text = await response.text()
  if (!text) return {} as T

  return JSON.parse(text)
}

// Pagination helper
interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  }
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

// ============================================
// AUTH API
// ============================================

export const authApi = {
  login: async (credentials: LoginInput): Promise<AuthResponse> => {
    const response = await fetchAPI<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    setAccessToken(response.accessToken)
    return response
  },

  register: async (
    data: { email: string; password: string; name: string; organizationName: string }
  ): Promise<AuthResponse> => {
    const response = await fetchAPI<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    setAccessToken(response.accessToken)
    return response
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await fetchAPI<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }
    )
    setAccessToken(response.accessToken)
    return response
  },

  me: async (): Promise<User & { role: Role; organization: Organization }> => {
    return fetchAPI('/auth/me')
  },

  logout: () => {
    setAccessToken(null)
  },
}

// ============================================
// USERS API
// ============================================

export const usersApi = {
  list: async (
    params?: PaginationInput & { roleId?: string; isActive?: boolean; search?: string }
  ): Promise<PaginatedResponse<User & { role: Role }>> => {
    return fetchAPI(`/api/users${buildQueryString(params || {})}`)
  },

  get: async (id: string): Promise<User & { role: Role }> => {
    return fetchAPI(`/api/users/${id}`)
  },

  create: async (data: CreateUserInput): Promise<User & { role: Role }> => {
    return fetchAPI('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: UpdateUserInput): Promise<User & { role: Role }> => {
    return fetchAPI(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deactivate: async (id: string): Promise<{ message: string }> => {
    return fetchAPI(`/api/users/${id}`, { method: 'DELETE' })
  },

  getStats: async (
    id: string,
    days = 30
  ): Promise<{
    totalBehaviors: number
    verifiedBehaviors: number
    averagePerDay: number
    rank: number
    streakDays: number
    behaviorBreakdown: Array<{ behaviorId: string; behaviorName: string; count: number }>
  }> => {
    return fetchAPI(`/api/users/${id}/stats?days=${days}`)
  },
}

// ============================================
// ROLES API
// ============================================

export const rolesApi = {
  list: async (params?: PaginationInput): Promise<PaginatedResponse<Role>> => {
    return fetchAPI(`/api/roles${buildQueryString(params || {})}`)
  },

  get: async (id: string): Promise<Role> => {
    return fetchAPI(`/api/roles/${id}`)
  },

  create: async (data: CreateRoleInput): Promise<Role> => {
    return fetchAPI('/api/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: UpdateRoleInput): Promise<Role> => {
    return fetchAPI(`/api/roles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchAPI(`/api/roles/${id}`, { method: 'DELETE' })
  },
}

// ============================================
// BEHAVIORS API
// ============================================

export const behaviorsApi = {
  list: async (
    params?: PaginationInput & { includeInactive?: boolean }
  ): Promise<PaginatedResponse<Behavior & { roles: Array<{ id: string; name: string }> }>> => {
    return fetchAPI(`/api/behaviors${buildQueryString(params || {})}`)
  },

  get: async (id: string): Promise<Behavior & { roles: Array<{ id: string; name: string }> }> => {
    return fetchAPI(`/api/behaviors/${id}`)
  },

  create: async (
    data: CreateBehaviorInput
  ): Promise<Behavior & { roles: Array<{ id: string; name: string }> }> => {
    return fetchAPI('/api/behaviors', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (
    id: string,
    data: UpdateBehaviorInput
  ): Promise<Behavior & { roles: Array<{ id: string; name: string }> }> => {
    return fetchAPI(`/api/behaviors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchAPI(`/api/behaviors/${id}`, { method: 'DELETE' })
  },

  getStats: async (
    id: string,
    days = 30
  ): Promise<{
    totalLogs: number
    verifiedLogs: number
    verificationRate: number
    averagePerDay: number
    topPerformers: Array<{ userId: string; userName: string; count: number }>
    dailyTrend: Array<{ date: string; count: number }>
  }> => {
    return fetchAPI(`/api/behaviors/${id}/stats?days=${days}`)
  },
}

// ============================================
// BEHAVIOR LOGS API
// ============================================

export const behaviorLogsApi = {
  list: async (
    params?: PaginationInput & {
      userId?: string
      behaviorId?: string
      verified?: boolean
      startDate?: string
      endDate?: string
    }
  ): Promise<PaginatedResponse<BehaviorLog & { user: User; behavior: Behavior }>> => {
    return fetchAPI(`/api/behavior-logs${buildQueryString(params || {})}`)
  },

  create: async (data: CreateBehaviorLogInput): Promise<BehaviorLog & { behavior: Behavior }> => {
    return fetchAPI('/api/behavior-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  verify: async (id: string, verified: boolean): Promise<BehaviorLog> => {
    return fetchAPI(`/api/behavior-logs/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ verified }),
    })
  },

  getPending: async (
    params?: PaginationInput
  ): Promise<PaginatedResponse<BehaviorLog & { user: User; behavior: Behavior }>> => {
    return fetchAPI(`/api/behavior-logs/pending${buildQueryString(params || {})}`)
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchAPI(`/api/behavior-logs/${id}`, { method: 'DELETE' })
  },
}

// ============================================
// DAILY ENTRIES API
// ============================================

export const dailyEntriesApi = {
  list: async (
    params?: PaginationInput & { locationId?: string; startDate?: string; endDate?: string }
  ): Promise<PaginatedResponse<DailyEntry & { avgCheck: number }>> => {
    return fetchAPI(`/api/daily-entries${buildQueryString(params || {})}`)
  },

  getByDate: async (
    date: string,
    locationId?: string
  ): Promise<(DailyEntry & { avgCheck: number }) | null> => {
    const params = { date, ...(locationId ? { locationId } : {}) }
    return fetchAPI(`/api/daily-entries/by-date${buildQueryString(params)}`)
  },

  upsert: async (
    data: CreateDailyEntryInput
  ): Promise<DailyEntry & { location: { id: string; name: string } }> => {
    return fetchAPI('/api/daily-entries', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  getStats: async (
    days = 30,
    locationId?: string
  ): Promise<{
    period: { start: string; end: string; days: number }
    revenue: { total: number; average: number; trend: number }
    covers: { total: number; average: number }
    avgCheck: { current: number; previous: number; trend: number }
    dailyData: Array<{ date: string; revenue: number; covers: number; avgCheck: number }>
  }> => {
    const params = { days, ...(locationId ? { locationId } : {}) }
    return fetchAPI(`/api/daily-entries/stats${buildQueryString(params)}`)
  },
}

// ============================================
// ORGANIZATIONS API
// ============================================

export const organizationsApi = {
  getCurrent: async (): Promise<Organization & { _count: { users: number; behaviors: number } }> => {
    return fetchAPI('/api/organizations/current')
  },

  update: async (data: UpdateOrganizationInput): Promise<Organization> => {
    return fetchAPI('/api/organizations/current', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  getLocations: async (): Promise<
    Array<{ id: string; name: string; address: string | null; isActive: boolean }>
  > => {
    return fetchAPI('/api/organizations/locations')
  },

  createLocation: async (data: {
    name: string
    address?: string
  }): Promise<{ id: string; name: string; address: string | null; isActive: boolean }> => {
    return fetchAPI('/api/organizations/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getBenchmarks: async (): Promise<Benchmark[]> => {
    return fetchAPI('/api/organizations/benchmarks')
  },

  upsertBenchmark: async (data: CreateBenchmarkInput): Promise<Benchmark> => {
    return fetchAPI('/api/organizations/benchmarks', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  getDashboard: async (days = 30): Promise<{
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
  }> => {
    return fetchAPI(`/api/organizations/dashboard?days=${days}`)
  },
}

// ============================================
// QUESTIONNAIRE API (Public)
// ============================================

export const questionnaireApi = {
  submit: async (
    data: CreateQuestionnaireSubmissionInput
  ): Promise<{
    id: string
    scores: {
      revenueHealth: number
      costManagement: number
      teamEngagement: number
      overall: number
      recommendations: string[]
    }
    message: string
  }> => {
    return fetchAPI('/questionnaire', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  get: async (
    id: string
  ): Promise<{
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
  }> => {
    return fetchAPI(`/questionnaire/${id}`)
  },
}

// ============================================
// COMBINED API EXPORT
// ============================================

export const api = {
  auth: authApi,
  users: usersApi,
  roles: rolesApi,
  behaviors: behaviorsApi,
  behaviorLogs: behaviorLogsApi,
  dailyEntries: dailyEntriesApi,
  organizations: organizationsApi,
  questionnaire: questionnaireApi,
}

export default api
