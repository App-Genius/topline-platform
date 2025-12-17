/**
 * Shared Types for Core Module
 * These types are used across multiple core modules
 */

// =============================================================================
// Role Types
// =============================================================================

export type RoleType =
  | 'ADMIN'
  | 'MANAGER'
  | 'SERVER'
  | 'HOST'
  | 'BARTENDER'
  | 'BUSSER'
  | 'PURCHASER'
  | 'CHEF'
  | 'ACCOUNTANT'
  | 'FACILITIES'
  | 'FRONT_DESK'
  | 'HOUSEKEEPING'
  | 'CUSTOM';

// =============================================================================
// Game State Types
// =============================================================================

export type GameStatus = 'neutral' | 'winning' | 'losing' | 'celebrating';

export interface GameStateInput {
  ytdRevenue: number;
  targetToDate: number;
  yearlyTarget: number;
}

export interface GameState {
  status: GameStatus;
  percentComplete: number;
  daysRemaining: number;
  currentScore: number;
  targetScore: number;
}

// =============================================================================
// Pagination Types
// =============================================================================

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// =============================================================================
// Date Types
// =============================================================================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// =============================================================================
// Leaderboard Types
// =============================================================================

export interface BehaviorLogWithUser {
  userId: string;
  user: { name: string; avatar: string | null };
  behavior: { points: number };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatar: string | null;
  score: number;
}

// =============================================================================
// Statistics Types
// =============================================================================

export interface UserStats {
  totalBehaviors: number;
  verifiedBehaviors: number;
  verificationRate: number;
  averagePerDay: number;
  streak: number;
  rank: number;
}

export interface BehaviorBreakdown {
  behaviorId: string;
  behaviorName: string;
  count: number;
}

export interface DailyTrend {
  date: string;
  count: number;
}

// =============================================================================
// Permission Types
// =============================================================================

export interface DeletePermission {
  canDelete: boolean;
  reason?: string;
}

export interface VerificationFields {
  verified: boolean;
  verifiedById: string | null;
  verifiedAt: Date | null;
}

// =============================================================================
// Validation Types
// =============================================================================

export interface PasswordValidation {
  valid: boolean;
  error?: string;
}
