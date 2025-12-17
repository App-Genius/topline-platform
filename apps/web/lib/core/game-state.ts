/**
 * Game State Logic
 *
 * Determines winning/losing status based on revenue vs benchmarks.
 * This is the heart of Topline's gamification - turning performance
 * into a game the team can rally around.
 */

import type { GameStatus, GameStateInput, GameState } from './types';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Thresholds for game state determination
 * These can be made configurable per organization in the future
 */
export const GAME_THRESHOLDS = {
  /** Above this ratio = winning (e.g., 1.05 = 5% above target) */
  WINNING: 1.05,
  /** Below this ratio = losing (e.g., 0.95 = 5% below target) */
  LOSING: 0.95,
} as const;

// =============================================================================
// Game State Determination
// =============================================================================

/**
 * Determine the current game state based on revenue vs target
 *
 * States:
 * - 'celebrating': Yearly target achieved - time to celebrate!
 * - 'winning': 5%+ above target to date - team is crushing it
 * - 'losing': 5%+ below target to date - need to rally
 * - 'neutral': Within threshold - on track
 *
 * @param input - YTD revenue, target to date, and yearly target
 * @returns Current game status
 *
 * @example
 * determineGameState({ ytdRevenue: 1050, targetToDate: 1000, yearlyTarget: 10000 })
 * // => 'winning' (5% above target)
 */
export function determineGameState(input: GameStateInput): GameStatus {
  const { ytdRevenue, targetToDate, yearlyTarget } = input;

  // No target set - stay neutral
  if (targetToDate === 0 || yearlyTarget === 0) {
    return 'neutral';
  }

  // Yearly target achieved - time to celebrate!
  if (ytdRevenue >= yearlyTarget) {
    return 'celebrating';
  }

  // Calculate progress ratio
  const progress = ytdRevenue / targetToDate;

  if (progress >= GAME_THRESHOLDS.WINNING) {
    return 'winning';
  }

  if (progress <= GAME_THRESHOLDS.LOSING) {
    return 'losing';
  }

  return 'neutral';
}

/**
 * Determine game state with custom thresholds
 *
 * @param input - Revenue and target data
 * @param winningThreshold - Custom winning threshold (default 1.05)
 * @param losingThreshold - Custom losing threshold (default 0.95)
 * @returns Current game status
 */
export function determineGameStateCustom(
  input: GameStateInput,
  winningThreshold: number = GAME_THRESHOLDS.WINNING,
  losingThreshold: number = GAME_THRESHOLDS.LOSING
): GameStatus {
  const { ytdRevenue, targetToDate, yearlyTarget } = input;

  if (targetToDate === 0 || yearlyTarget === 0) {
    return 'neutral';
  }

  if (ytdRevenue >= yearlyTarget) {
    return 'celebrating';
  }

  const progress = ytdRevenue / targetToDate;

  if (progress >= winningThreshold) {
    return 'winning';
  }

  if (progress <= losingThreshold) {
    return 'losing';
  }

  return 'neutral';
}

// =============================================================================
// Date Calculations for Game
// =============================================================================

/**
 * Calculate the day of year (1-366)
 *
 * @param date - Date to calculate for
 * @returns Day number (1 = Jan 1, 365/366 = Dec 31)
 *
 * @example
 * getDayOfYear(new Date('2024-01-01')) // => 1
 * getDayOfYear(new Date('2024-12-31')) // => 366 (leap year)
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Calculate days remaining in the year
 *
 * @param date - Date to calculate from
 * @returns Number of days left in the year
 *
 * @example
 * getDaysRemaining(new Date('2024-12-30')) // => 1
 */
export function getDaysRemaining(date: Date): number {
  const year = date.getFullYear();
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDays = isLeapYear ? 366 : 365;
  return totalDays - getDayOfYear(date);
}

/**
 * Check if a year is a leap year
 *
 * @param year - Year to check
 * @returns True if leap year
 *
 * @example
 * isLeapYear(2024) // => true
 * isLeapYear(2023) // => false
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get total days in a year
 *
 * @param year - Year to check
 * @returns 365 or 366
 */
export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

// =============================================================================
// Progress Calculations
// =============================================================================

/**
 * Calculate progress percentage toward yearly target
 *
 * @param ytdRevenue - Year-to-date revenue
 * @param yearlyTarget - Full year target
 * @returns Progress percentage (0-100+)
 *
 * @example
 * calculateProgressPercent(500000, 1000000) // => 50 (50% to goal)
 */
export function calculateProgressPercent(
  ytdRevenue: number,
  yearlyTarget: number
): number {
  if (yearlyTarget === 0) return 0;
  return Math.round((ytdRevenue / yearlyTarget) * 10000) / 100;
}

/**
 * Calculate expected progress based on day of year
 *
 * Assumes linear distribution of revenue throughout the year.
 *
 * @param date - Current date
 * @returns Expected progress percentage (0-100)
 *
 * @example
 * // On July 1 (day 183 of 366)
 * calculateExpectedProgress(new Date('2024-07-01')) // => ~50
 */
export function calculateExpectedProgress(date: Date): number {
  const dayOfYear = getDayOfYear(date);
  const totalDays = getDaysInYear(date.getFullYear());
  return Math.round((dayOfYear / totalDays) * 10000) / 100;
}

/**
 * Calculate target-to-date based on yearly target and current date
 *
 * Prorates the yearly target to today's date.
 *
 * @param yearlyTarget - Full year revenue target
 * @param date - Current date
 * @returns Target to date (prorated)
 *
 * @example
 * // On July 1 (roughly 50% through year)
 * calculateTargetToDate(1000000, new Date('2024-07-01')) // => ~500000
 */
export function calculateTargetToDate(yearlyTarget: number, date: Date): number {
  const dayOfYear = getDayOfYear(date);
  const totalDays = getDaysInYear(date.getFullYear());
  return Math.round((yearlyTarget * dayOfYear) / totalDays);
}

// =============================================================================
// Full Game State Builder
// =============================================================================

/**
 * Build complete game state object
 *
 * @param ytdRevenue - Year-to-date revenue
 * @param yearlyTarget - Full year target
 * @param date - Current date (defaults to today)
 * @returns Complete game state with all calculated fields
 *
 * @example
 * buildGameState(500000, 1000000, new Date('2024-07-01'))
 * // => {
 * //   status: 'winning' | 'losing' | 'neutral' | 'celebrating',
 * //   percentComplete: 50,
 * //   daysRemaining: 183,
 * //   currentScore: 500000,
 * //   targetScore: 500000
 * // }
 */
export function buildGameState(
  ytdRevenue: number,
  yearlyTarget: number,
  date: Date = new Date()
): GameState {
  const targetToDate = calculateTargetToDate(yearlyTarget, date);

  return {
    status: determineGameState({ ytdRevenue, targetToDate, yearlyTarget }),
    percentComplete: calculateProgressPercent(ytdRevenue, yearlyTarget),
    daysRemaining: getDaysRemaining(date),
    currentScore: ytdRevenue,
    targetScore: targetToDate,
  };
}

// =============================================================================
// Streak Tracking
// =============================================================================

/**
 * Calculate winning streak (consecutive days above target)
 *
 * @param dailyResults - Array of { date, revenue, target } in chronological order
 * @returns Number of consecutive winning days from most recent
 *
 * @example
 * calculateWinningStreak([
 *   { date: '2024-01-01', revenue: 1100, target: 1000 },
 *   { date: '2024-01-02', revenue: 1050, target: 1000 },
 *   { date: '2024-01-03', revenue: 900, target: 1000 }  // Lost
 * ])
 * // => 0 (most recent day was a loss)
 */
export function calculateWinningStreak(
  dailyResults: Array<{ date: string; revenue: number; target: number }>
): number {
  let streak = 0;

  // Iterate backwards from most recent
  for (let i = dailyResults.length - 1; i >= 0; i--) {
    const day = dailyResults[i];
    if (day.revenue >= day.target) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate longest winning streak in period
 *
 * @param dailyResults - Array of daily results
 * @returns Longest consecutive winning days in the period
 */
export function calculateLongestStreak(
  dailyResults: Array<{ date: string; revenue: number; target: number }>
): number {
  let longest = 0;
  let current = 0;

  for (const day of dailyResults) {
    if (day.revenue >= day.target) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}
