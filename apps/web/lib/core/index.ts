/**
 * Core Business Logic Module
 *
 * This module contains all pure business logic for Topline,
 * cleanly separated from database and framework concerns.
 *
 * All functions are:
 * - Pure (no side effects)
 * - Thoroughly tested (95%+ coverage)
 * - Well-documented
 *
 * Usage:
 * ```ts
 * import { calculateAverageCheck, determineGameState, isManagerRole } from '@/lib/core';
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export type {
  RoleType,
  GameStatus,
  GameStateInput,
  GameState,
  PaginationMeta,
  DateRange,
  BehaviorLogWithUser,
  LeaderboardEntry,
  UserStats,
  BehaviorBreakdown,
  DailyTrend,
  DeletePermission,
  VerificationFields,
  PasswordValidation,
} from './types';

// =============================================================================
// KPI Calculations
// =============================================================================

export {
  calculateAverageCheck,
  calculateTrend,
  calculateVariance,
  calculateCostPercent,
  calculatePaginationMeta,
  calculateGrossMargin,
  calculateCAGR,
  calculateRevenuePerEmployee,
  calculateAverageTransaction,
  calculateProgress,
  calculateRemaining,
  calculateDailyRunRate,
} from './kpi';

// =============================================================================
// Game State
// =============================================================================

export {
  GAME_THRESHOLDS,
  determineGameState,
  determineGameStateCustom,
  getDayOfYear,
  getDaysRemaining,
  isLeapYear,
  getDaysInYear,
  calculateProgressPercent,
  calculateExpectedProgress,
  calculateTargetToDate,
  buildGameState,
  calculateWinningStreak,
  calculateLongestStreak,
} from './game-state';

// =============================================================================
// Leaderboard
// =============================================================================

export type { MedalType, UserScore, RankedUser } from './leaderboard';

export {
  buildLeaderboard,
  buildEnhancedLeaderboard,
  calculateRank,
  calculateRankWithTies,
  getMedalType,
  getMedalEmoji,
  calculateScoreGaps,
  getPointsToNextRank,
  calculatePercentile,
  calculateRankMovement,
  getMovementIndicator,
} from './leaderboard';

// =============================================================================
// Statistics
// =============================================================================

export {
  aggregateBehaviorCounts,
  aggregateBehaviorCountsWithPercent,
  calculateStreak,
  calculateLongestStreak as calculateLongestBehaviorStreak,
  generateDailyTrend,
  fillDailyTrendGaps,
  calculateVerificationRate,
  calculateAttendanceRate,
  calculateCompletionRate,
  calculateAveragePerDay,
  calculateMovingAverage,
  getTopPerformers,
  getBottomPerformers,
  calculateStandardDeviation,
  calculateCoefficientOfVariation,
  calculateMedian,
  calculatePercentileValue,
} from './statistics';

// =============================================================================
// RBAC (Role-Based Access Control)
// =============================================================================

export {
  isManagerRole,
  isStaffRole,
  isBackofficeRole,
  isAdminRole,
  getEffectiveUserId,
  canStaffDeleteLog,
  canDeleteRole,
  canVerifyLogs,
  canViewAllUsers,
  canEditUserProfile,
  canAccessAdmin,
  canAccessManager,
  getVerificationUpdate,
  canAccessOrganization,
  canAccessFeature,
  canUsePinLogin,
  getAllowedRoutes,
  getUnauthorizedRedirect,
} from './rbac';

// =============================================================================
// Date Utilities
// =============================================================================

export {
  getDateString,
  getTodayString,
  parseDate,
  safeParsDate,
  formatDate,
  formatDateShort,
  formatDateMedium,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  buildDateRange,
  buildMonthRange,
  buildWeekRange,
  getPreviousDateRange,
  isToday,
  isPastDate,
  isFutureDate,
  isYesterday,
  isSameDay,
  isWithinRange,
  addDays,
  addMonths,
  getDaysDifference,
  startOfDay,
  endOfDay,
  getWeekNumber,
  getDayName,
  getMonthName,
} from './date-utils';

// =============================================================================
// Shared Utilities
// =============================================================================

export {
  sanitizeUser,
  sanitizeUsers,
  generateAvatar,
  generateColorFromString,
  validatePassword,
  validatePasswordStrict,
  validateEmail,
  validatePhone,
  safeDivide,
  clamp,
  roundTo,
  isInRange,
  truncate,
  capitalize,
  titleCase,
  slugify,
  unique,
  uniqueBy,
  groupBy,
  sum,
  average,
  chunk,
  pick,
  omit,
  isEmpty,
  formatCurrency,
  formatNumber,
  formatPercent,
} from './utils';
