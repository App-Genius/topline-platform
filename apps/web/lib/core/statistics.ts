/**
 * Statistics & Trend Calculations
 *
 * User performance metrics, streaks, aggregations, and trend analysis.
 */

import type { BehaviorBreakdown, DailyTrend } from './types';

// =============================================================================
// Behavior Aggregation
// =============================================================================

/**
 * Aggregate behavior counts from logs
 *
 * Groups logs by behavior and counts occurrences.
 *
 * @param logs - Array of behavior logs
 * @returns Sorted breakdown by count (highest first)
 *
 * @example
 * aggregateBehaviorCounts([
 *   { behaviorId: 'b1', behavior: { name: 'Upsell' } },
 *   { behaviorId: 'b1', behavior: { name: 'Upsell' } },
 *   { behaviorId: 'b2', behavior: { name: 'Dessert' } },
 * ])
 * // => [
 * //   { behaviorId: 'b1', behaviorName: 'Upsell', count: 2 },
 * //   { behaviorId: 'b2', behaviorName: 'Dessert', count: 1 }
 * // ]
 */
export function aggregateBehaviorCounts(
  logs: Array<{ behaviorId: string; behavior: { name: string } }>
): BehaviorBreakdown[] {
  const counts = new Map<string, { name: string; count: number }>();

  for (const log of logs) {
    const current = counts.get(log.behaviorId) || {
      name: log.behavior.name,
      count: 0,
    };
    counts.set(log.behaviorId, {
      name: current.name,
      count: current.count + 1,
    });
  }

  return Array.from(counts.entries())
    .map(([id, data]) => ({
      behaviorId: id,
      behaviorName: data.name,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Aggregate behavior counts with percentage of total
 *
 * @param logs - Behavior logs
 * @returns Breakdown with percentages
 */
export function aggregateBehaviorCountsWithPercent(
  logs: Array<{ behaviorId: string; behavior: { name: string } }>
): Array<BehaviorBreakdown & { percent: number }> {
  const breakdown = aggregateBehaviorCounts(logs);
  const total = breakdown.reduce((sum, b) => sum + b.count, 0);

  return breakdown.map((b) => ({
    ...b,
    percent: total > 0 ? Math.round((b.count / total) * 10000) / 100 : 0,
  }));
}

// =============================================================================
// Streak Calculations
// =============================================================================

/**
 * Calculate streak (consecutive days with activity)
 *
 * @param dates - Set of date strings (YYYY-MM-DD format)
 * @param today - Today's date string
 * @returns Number of consecutive days ending today
 *
 * @example
 * calculateStreak(
 *   new Set(['2024-01-03', '2024-01-04', '2024-01-05']),
 *   '2024-01-05'
 * )
 * // => 3
 */
export function calculateStreak(dates: Set<string>, today: string): number {
  let streakDays = 0;
  let checkDate = today;

  while (dates.has(checkDate)) {
    streakDays++;
    const d = new Date(checkDate);
    d.setDate(d.getDate() - 1);
    checkDate = d.toISOString().split('T')[0];
  }

  return streakDays;
}

/**
 * Calculate longest streak in a date set
 *
 * @param dates - Set of date strings
 * @returns Longest consecutive day streak
 */
export function calculateLongestStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0;

  const sortedDates = Array.from(dates).sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);

    // Check if consecutive days
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

// =============================================================================
// Daily Trend Analysis
// =============================================================================

/**
 * Generate daily trend data from logs
 *
 * @param logs - Array of logs with createdAt dates
 * @returns Daily counts sorted by date
 *
 * @example
 * generateDailyTrend([
 *   { createdAt: new Date('2024-01-01T10:00:00') },
 *   { createdAt: new Date('2024-01-01T14:00:00') },
 *   { createdAt: new Date('2024-01-02T09:00:00') },
 * ])
 * // => [
 * //   { date: '2024-01-01', count: 2 },
 * //   { date: '2024-01-02', count: 1 }
 * // ]
 */
export function generateDailyTrend(
  logs: Array<{ createdAt: Date }>
): DailyTrend[] {
  const counts = new Map<string, number>();

  for (const log of logs) {
    const date = log.createdAt.toISOString().split('T')[0];
    counts.set(date, (counts.get(date) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Fill gaps in daily trend with zeros
 *
 * Ensures every day in the range has an entry.
 *
 * @param trend - Existing trend data
 * @param startDate - Start of range
 * @param endDate - End of range
 * @returns Complete trend with no gaps
 */
export function fillDailyTrendGaps(
  trend: DailyTrend[],
  startDate: string,
  endDate: string
): DailyTrend[] {
  const countMap = new Map(trend.map((t) => [t.date, t.count]));
  const result: DailyTrend[] = [];

  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      count: countMap.get(dateStr) || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

// =============================================================================
// Rate Calculations
// =============================================================================

/**
 * Calculate verification rate
 *
 * @param verified - Number of verified items
 * @param total - Total number of items
 * @returns Verification rate percentage
 *
 * @example
 * calculateVerificationRate(75, 100) // => 75
 */
export function calculateVerificationRate(
  verified: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((verified / total) * 10000) / 100;
}

/**
 * Calculate attendance rate
 *
 * @param present - Number present
 * @param total - Total expected
 * @returns Attendance rate percentage (rounded to whole number)
 *
 * @example
 * calculateAttendanceRate(45, 50) // => 90
 */
export function calculateAttendanceRate(present: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

/**
 * Calculate completion rate
 *
 * @param completed - Number completed
 * @param total - Total items
 * @returns Completion rate percentage
 */
export function calculateCompletionRate(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 10000) / 100;
}

// =============================================================================
// Average Calculations
// =============================================================================

/**
 * Calculate average per day
 *
 * @param total - Total count
 * @param days - Number of days
 * @returns Average per day (1 decimal)
 *
 * @example
 * calculateAveragePerDay(70, 7) // => 10.0
 */
export function calculateAveragePerDay(total: number, days: number): number {
  if (days === 0) return 0;
  return Math.round((total / days) * 10) / 10;
}

/**
 * Calculate moving average
 *
 * @param values - Array of values
 * @param windowSize - Number of periods to average
 * @returns Array of moving averages
 */
export function calculateMovingAverage(
  values: number[],
  windowSize: number
): number[] {
  if (values.length < windowSize) return [];

  const result: number[] = [];
  for (let i = windowSize - 1; i < values.length; i++) {
    const window = values.slice(i - windowSize + 1, i + 1);
    const avg = window.reduce((a, b) => a + b, 0) / windowSize;
    result.push(Math.round(avg * 100) / 100);
  }

  return result;
}

// =============================================================================
// Top Performers
// =============================================================================

/**
 * Get top performers from user counts
 *
 * @param userCounts - Array of users with counts
 * @param limit - Maximum number to return
 * @returns Top performers sorted by count
 *
 * @example
 * getTopPerformers([
 *   { userId: 'u1', userName: 'Alice', count: 50 },
 *   { userId: 'u2', userName: 'Bob', count: 30 },
 *   { userId: 'u3', userName: 'Carol', count: 40 }
 * ], 2)
 * // => [
 * //   { userId: 'u1', userName: 'Alice', count: 50 },
 * //   { userId: 'u3', userName: 'Carol', count: 40 }
 * // ]
 */
export function getTopPerformers(
  userCounts: Array<{ userId: string; userName: string; count: number }>,
  limit: number = 5
): Array<{ userId: string; userName: string; count: number }> {
  return [...userCounts].sort((a, b) => b.count - a.count).slice(0, limit);
}

/**
 * Get bottom performers (for coaching opportunities)
 *
 * @param userCounts - Array of users with counts
 * @param limit - Maximum number to return
 * @returns Bottom performers sorted by count (lowest first)
 */
export function getBottomPerformers(
  userCounts: Array<{ userId: string; userName: string; count: number }>,
  limit: number = 5
): Array<{ userId: string; userName: string; count: number }> {
  return [...userCounts].sort((a, b) => a.count - b.count).slice(0, limit);
}

// =============================================================================
// Statistical Analysis
// =============================================================================

/**
 * Calculate standard deviation
 *
 * @param values - Array of numbers
 * @returns Standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

  return Math.round(Math.sqrt(avgSquaredDiff) * 100) / 100;
}

/**
 * Calculate coefficient of variation (CV)
 *
 * Useful for comparing variability across datasets with different means.
 *
 * @param values - Array of numbers
 * @returns CV as percentage
 */
export function calculateCoefficientOfVariation(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;

  const stdDev = calculateStandardDeviation(values);
  return Math.round((stdDev / mean) * 10000) / 100;
}

/**
 * Calculate median
 *
 * @param values - Array of numbers
 * @returns Median value
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

/**
 * Calculate percentile value
 *
 * @param values - Array of numbers
 * @param percentile - Percentile to calculate (0-100)
 * @returns Value at that percentile
 */
export function calculatePercentileValue(
  values: number[],
  percentile: number
): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;

  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}
