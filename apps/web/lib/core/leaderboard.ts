/**
 * Leaderboard Ranking Algorithms
 *
 * Builds ranked lists from behavior logs to power the
 * scoreboard and gamification features.
 */

import type { BehaviorLogWithUser, LeaderboardEntry } from './types';

// =============================================================================
// Types
// =============================================================================

export type MedalType = 'gold' | 'silver' | 'bronze' | null;

export interface UserScore {
  userId: string;
  userName: string;
  avatar: string | null;
  score: number;
}

export interface RankedUser extends UserScore {
  rank: number;
  medal: MedalType;
  percentOfTop: number;
}

// =============================================================================
// Core Leaderboard Building
// =============================================================================

/**
 * Build leaderboard from behavior logs
 *
 * Aggregates points by user and ranks them descending by score.
 *
 * @param logs - Behavior logs with user and behavior data
 * @param limit - Maximum entries to return (default 10)
 * @returns Ranked leaderboard entries
 *
 * @example
 * buildLeaderboard([
 *   { userId: 'u1', user: { name: 'Alice', avatar: null }, behavior: { points: 10 } },
 *   { userId: 'u1', user: { name: 'Alice', avatar: null }, behavior: { points: 5 } },
 *   { userId: 'u2', user: { name: 'Bob', avatar: null }, behavior: { points: 12 } },
 * ])
 * // => [
 * //   { rank: 1, userId: 'u1', userName: 'Alice', avatar: null, score: 15 },
 * //   { rank: 2, userId: 'u2', userName: 'Bob', avatar: null, score: 12 }
 * // ]
 */
export function buildLeaderboard(
  logs: BehaviorLogWithUser[],
  limit: number = 10
): LeaderboardEntry[] {
  // Aggregate scores by user
  const userScores = new Map<
    string,
    { name: string; avatar: string | null; score: number }
  >();

  for (const log of logs) {
    const current = userScores.get(log.userId) || {
      name: log.user.name,
      avatar: log.user.avatar,
      score: 0,
    };
    userScores.set(log.userId, {
      ...current,
      score: current.score + log.behavior.points,
    });
  }

  // Sort by score descending and add ranks
  return Array.from(userScores.entries())
    .map(([userId, data]) => ({
      userId,
      userName: data.name,
      avatar: data.avatar,
      score: data.score,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/**
 * Build leaderboard with medals and percentage calculations
 *
 * @param logs - Behavior logs
 * @param limit - Maximum entries
 * @returns Enhanced leaderboard with medals and percentages
 */
export function buildEnhancedLeaderboard(
  logs: BehaviorLogWithUser[],
  limit: number = 10
): RankedUser[] {
  const basic = buildLeaderboard(logs, limit);
  const topScore = basic[0]?.score || 0;

  return basic.map((entry) => ({
    ...entry,
    medal: getMedalType(entry.rank),
    percentOfTop: topScore > 0 ? Math.round((entry.score / topScore) * 100) : 0,
  }));
}

// =============================================================================
// Rank Calculations
// =============================================================================

/**
 * Calculate a user's rank from an array of user counts
 *
 * @param userId - User ID to find
 * @param allUserCounts - Array of user IDs and their counts
 * @returns User's rank (1-based), or 0 if not found
 *
 * @example
 * calculateRank('u2', [
 *   { userId: 'u1', count: 50 },
 *   { userId: 'u2', count: 30 },
 *   { userId: 'u3', count: 40 }
 * ])
 * // => 2 (u2 is second place)
 */
export function calculateRank(
  userId: string,
  allUserCounts: Array<{ userId: string; count: number }>
): number {
  const sorted = [...allUserCounts].sort((a, b) => b.count - a.count);
  const index = sorted.findIndex((u) => u.userId === userId);
  return index === -1 ? 0 : index + 1;
}

/**
 * Calculate rank with tie handling
 *
 * Users with the same score get the same rank.
 *
 * @param userId - User ID to find
 * @param allUserCounts - Array of user IDs and counts
 * @returns User's rank with ties considered
 *
 * @example
 * calculateRankWithTies('u2', [
 *   { userId: 'u1', count: 50 },
 *   { userId: 'u2', count: 50 },  // Tied with u1
 *   { userId: 'u3', count: 40 }
 * ])
 * // => 1 (both u1 and u2 are rank 1)
 */
export function calculateRankWithTies(
  userId: string,
  allUserCounts: Array<{ userId: string; count: number }>
): number {
  const sorted = [...allUserCounts].sort((a, b) => b.count - a.count);
  const userEntry = sorted.find((u) => u.userId === userId);

  if (!userEntry) return 0;

  // Find the first user with the same count
  const rank = sorted.findIndex((u) => u.count === userEntry.count);
  return rank + 1;
}

// =============================================================================
// Medal Determination
// =============================================================================

/**
 * Get medal type based on rank
 *
 * @param rank - User's rank (1-based)
 * @returns Medal type or null
 *
 * @example
 * getMedalType(1) // => 'gold'
 * getMedalType(2) // => 'silver'
 * getMedalType(3) // => 'bronze'
 * getMedalType(4) // => null
 */
export function getMedalType(rank: number): MedalType {
  switch (rank) {
    case 1:
      return 'gold';
    case 2:
      return 'silver';
    case 3:
      return 'bronze';
    default:
      return null;
  }
}

/**
 * Get medal emoji for display
 *
 * @param rank - User's rank
 * @returns Medal emoji or empty string
 */
export function getMedalEmoji(rank: number): string {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
}

// =============================================================================
// Leaderboard Analysis
// =============================================================================

/**
 * Calculate score gap between ranks
 *
 * @param leaderboard - Leaderboard entries
 * @returns Array of gaps between consecutive ranks
 *
 * @example
 * calculateScoreGaps([
 *   { rank: 1, score: 100 },
 *   { rank: 2, score: 80 },
 *   { rank: 3, score: 75 }
 * ])
 * // => [20, 5] (gap between 1st-2nd is 20, 2nd-3rd is 5)
 */
export function calculateScoreGaps(
  leaderboard: Array<{ rank: number; score: number }>
): number[] {
  const gaps: number[] = [];
  for (let i = 0; i < leaderboard.length - 1; i++) {
    gaps.push(leaderboard[i].score - leaderboard[i + 1].score);
  }
  return gaps;
}

/**
 * Get points needed to reach next rank
 *
 * @param userId - User ID
 * @param leaderboard - Current leaderboard
 * @returns Points needed to move up, or 0 if already first
 */
export function getPointsToNextRank(
  userId: string,
  leaderboard: LeaderboardEntry[]
): number {
  const userIndex = leaderboard.findIndex((e) => e.userId === userId);

  if (userIndex <= 0) return 0; // Already first or not found

  const userScore = leaderboard[userIndex].score;
  const nextScore = leaderboard[userIndex - 1].score;

  return nextScore - userScore + 1; // Need 1 more than tie
}

/**
 * Calculate score percentile
 *
 * @param score - User's score
 * @param allScores - All scores in the leaderboard
 * @returns Percentile (0-100)
 *
 * @example
 * calculatePercentile(80, [100, 90, 80, 70, 60]) // => 40 (40th percentile)
 */
export function calculatePercentile(score: number, allScores: number[]): number {
  if (allScores.length === 0) return 0;

  const sortedScores = [...allScores].sort((a, b) => a - b);
  const belowCount = sortedScores.filter((s) => s < score).length;

  return Math.round((belowCount / sortedScores.length) * 100);
}

// =============================================================================
// Movement Tracking
// =============================================================================

/**
 * Calculate rank movement from previous period
 *
 * @param currentRank - Current rank
 * @param previousRank - Previous rank
 * @returns Movement (positive = improved, negative = dropped)
 *
 * @example
 * calculateRankMovement(2, 5) // => 3 (moved up 3 spots)
 * calculateRankMovement(5, 2) // => -3 (dropped 3 spots)
 */
export function calculateRankMovement(
  currentRank: number,
  previousRank: number
): number {
  // Lower rank number = better position
  return previousRank - currentRank;
}

/**
 * Get movement indicator
 *
 * @param movement - Rank movement value
 * @returns 'up' | 'down' | 'same'
 */
export function getMovementIndicator(
  movement: number
): 'up' | 'down' | 'same' {
  if (movement > 0) return 'up';
  if (movement < 0) return 'down';
  return 'same';
}
