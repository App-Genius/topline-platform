// Re-export all types from schemas
export type {
  Industry,
  RoleType,
  KpiType,
  BudgetCategory,
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  User,
  CreateUserInput,
  UpdateUserInput,
  LoginInput,
  Role,
  CreateRoleInput,
  UpdateRoleInput,
  Behavior,
  CreateBehaviorInput,
  UpdateBehaviorInput,
  BehaviorLog,
  CreateBehaviorLogInput,
  VerifyBehaviorLogInput,
  DailyEntry,
  CreateDailyEntryInput,
  UpdateDailyEntryInput,
  Benchmark,
  CreateBenchmarkInput,
  TrainingTopic,
  CreateTrainingTopicInput,
  TrainingSession,
  CreateTrainingSessionInput,
  QuestionnaireSubmission,
  CreateQuestionnaireSubmissionInput,
  PaginationInput,
  ApiError,
} from '../schemas'

// ============================================
// EXTENDED TYPES (with relations)
// ============================================

import type { User, Role, Behavior, BehaviorLog, Organization } from '../schemas'

export interface UserWithRole extends User {
  role: Role
}

export interface UserWithOrganization extends UserWithRole {
  organization: Organization
}

export interface BehaviorWithRoles extends Behavior {
  roles: Role[]
}

export interface BehaviorLogWithDetails extends BehaviorLog {
  user: User
  behavior: Behavior
  verifiedBy?: User | null
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface DailyStats {
  date: string
  revenue: number
  avgCheck: number
  covers: number
  behaviorCount: number
  rating?: number
}

export interface UserStats {
  userId: string
  userName: string
  totalBehaviors: number
  verifiedBehaviors: number
  averageCheck: number
  rank: number
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  avatar: string | null
  score: number
  behaviorCount: number
  streak: number
}

export interface GameState {
  status: 'neutral' | 'winning' | 'losing' | 'celebrating'
  currentScore: number
  targetScore: number
  percentComplete: number
  daysRemaining: number
  streakDays: number
}

// ============================================
// AUTH TYPES
// ============================================

export interface AuthTokenPayload {
  sub: string // userId
  email: string
  orgId: string
  roleType: string
  permissions: string[]
  iat: number
  exp: number
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: UserWithRole
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface ManagerDashboard {
  dailyBriefing: {
    date: string
    reservationCount: number
    vipGuests: string[]
    eightySixedItems: string[]
    upsellItems: string[]
    trainingTopic?: string
  }
  teamStats: {
    totalStaff: number
    activeToday: number
    behaviorGoalProgress: number
  }
  pendingVerifications: number
  alerts: Array<{
    type: 'warning' | 'success' | 'info'
    message: string
  }>
}

export interface AdminDashboard {
  revenue: {
    mtd: number
    ytd: number
    trend: number
  }
  kpis: Array<{
    name: string
    value: number
    target: number
    trend: number
  }>
  healthScore: {
    satisfaction: number
    churnRisk: boolean
    message: string
  }
}
