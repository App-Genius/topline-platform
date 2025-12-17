import { describe, it, expect } from 'vitest';
import {
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
} from '@/lib/core/leaderboard';
import type { BehaviorLogWithUser } from '@/lib/core/types';

describe('buildLeaderboard', () => {
  it('aggregates scores by user', () => {
    const logs: BehaviorLogWithUser[] = [
      { userId: 'u1', user: { name: 'Alice', avatar: null }, behavior: { points: 10 } },
      { userId: 'u1', user: { name: 'Alice', avatar: null }, behavior: { points: 5 } },
      { userId: 'u2', user: { name: 'Bob', avatar: null }, behavior: { points: 12 } },
    ];

    const leaderboard = buildLeaderboard(logs);

    expect(leaderboard).toHaveLength(2);
    expect(leaderboard[0]).toMatchObject({
      rank: 1,
      userId: 'u1',
      userName: 'Alice',
      score: 15,
    });
    expect(leaderboard[1]).toMatchObject({
      rank: 2,
      userId: 'u2',
      userName: 'Bob',
      score: 12,
    });
  });

  it('respects limit parameter', () => {
    const logs: BehaviorLogWithUser[] = [
      { userId: 'u1', user: { name: 'Alice', avatar: null }, behavior: { points: 10 } },
      { userId: 'u2', user: { name: 'Bob', avatar: null }, behavior: { points: 8 } },
      { userId: 'u3', user: { name: 'Carol', avatar: null }, behavior: { points: 6 } },
    ];

    const leaderboard = buildLeaderboard(logs, 2);

    expect(leaderboard).toHaveLength(2);
    expect(leaderboard[0].userName).toBe('Alice');
    expect(leaderboard[1].userName).toBe('Bob');
  });

  it('sorts by score descending', () => {
    const logs: BehaviorLogWithUser[] = [
      { userId: 'u1', user: { name: 'Alice', avatar: null }, behavior: { points: 5 } },
      { userId: 'u2', user: { name: 'Bob', avatar: null }, behavior: { points: 20 } },
      { userId: 'u3', user: { name: 'Carol', avatar: null }, behavior: { points: 10 } },
    ];

    const leaderboard = buildLeaderboard(logs);

    expect(leaderboard[0].userName).toBe('Bob');
    expect(leaderboard[1].userName).toBe('Carol');
    expect(leaderboard[2].userName).toBe('Alice');
  });

  it('handles empty logs', () => {
    expect(buildLeaderboard([])).toEqual([]);
  });

  it('preserves avatar from user data', () => {
    const logs: BehaviorLogWithUser[] = [
      { userId: 'u1', user: { name: 'Alice', avatar: 'AL' }, behavior: { points: 10 } },
    ];

    const leaderboard = buildLeaderboard(logs);

    expect(leaderboard[0].avatar).toBe('AL');
  });

  it('assigns correct ranks', () => {
    const logs: BehaviorLogWithUser[] = [
      { userId: 'u1', user: { name: 'Alice', avatar: null }, behavior: { points: 30 } },
      { userId: 'u2', user: { name: 'Bob', avatar: null }, behavior: { points: 20 } },
      { userId: 'u3', user: { name: 'Carol', avatar: null }, behavior: { points: 10 } },
    ];

    const leaderboard = buildLeaderboard(logs);

    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[1].rank).toBe(2);
    expect(leaderboard[2].rank).toBe(3);
  });
});

describe('buildEnhancedLeaderboard', () => {
  it('includes medals for top 3', () => {
    const logs: BehaviorLogWithUser[] = [
      { userId: 'u1', user: { name: 'Alice', avatar: null }, behavior: { points: 30 } },
      { userId: 'u2', user: { name: 'Bob', avatar: null }, behavior: { points: 20 } },
      { userId: 'u3', user: { name: 'Carol', avatar: null }, behavior: { points: 10 } },
      { userId: 'u4', user: { name: 'Dave', avatar: null }, behavior: { points: 5 } },
    ];

    const leaderboard = buildEnhancedLeaderboard(logs);

    expect(leaderboard[0].medal).toBe('gold');
    expect(leaderboard[1].medal).toBe('silver');
    expect(leaderboard[2].medal).toBe('bronze');
    expect(leaderboard[3].medal).toBeNull();
  });

  it('calculates percentOfTop correctly', () => {
    const logs: BehaviorLogWithUser[] = [
      { userId: 'u1', user: { name: 'Alice', avatar: null }, behavior: { points: 100 } },
      { userId: 'u2', user: { name: 'Bob', avatar: null }, behavior: { points: 50 } },
    ];

    const leaderboard = buildEnhancedLeaderboard(logs);

    expect(leaderboard[0].percentOfTop).toBe(100);
    expect(leaderboard[1].percentOfTop).toBe(50);
  });

  it('handles zero top score', () => {
    const leaderboard = buildEnhancedLeaderboard([]);
    expect(leaderboard).toEqual([]);
  });
});

describe('calculateRank', () => {
  it('returns correct rank for user', () => {
    const counts = [
      { userId: 'u1', count: 50 },
      { userId: 'u2', count: 30 },
      { userId: 'u3', count: 40 },
    ];

    expect(calculateRank('u1', counts)).toBe(1); // Highest
    expect(calculateRank('u3', counts)).toBe(2); // Second
    expect(calculateRank('u2', counts)).toBe(3); // Third
  });

  it('returns 0 for non-existent user', () => {
    const counts = [
      { userId: 'u1', count: 50 },
    ];

    expect(calculateRank('u99', counts)).toBe(0);
  });

  it('handles empty array', () => {
    expect(calculateRank('u1', [])).toBe(0);
  });
});

describe('calculateRankWithTies', () => {
  it('gives same rank to tied users', () => {
    const counts = [
      { userId: 'u1', count: 50 },
      { userId: 'u2', count: 50 },
      { userId: 'u3', count: 40 },
    ];

    expect(calculateRankWithTies('u1', counts)).toBe(1);
    expect(calculateRankWithTies('u2', counts)).toBe(1); // Tied with u1
    expect(calculateRankWithTies('u3', counts)).toBe(3); // After tie
  });

  it('returns 0 for non-existent user', () => {
    const counts = [{ userId: 'u1', count: 50 }];
    expect(calculateRankWithTies('u99', counts)).toBe(0);
  });
});

describe('getMedalType', () => {
  it('returns gold for rank 1', () => {
    expect(getMedalType(1)).toBe('gold');
  });

  it('returns silver for rank 2', () => {
    expect(getMedalType(2)).toBe('silver');
  });

  it('returns bronze for rank 3', () => {
    expect(getMedalType(3)).toBe('bronze');
  });

  it('returns null for rank 4+', () => {
    expect(getMedalType(4)).toBeNull();
    expect(getMedalType(10)).toBeNull();
    expect(getMedalType(100)).toBeNull();
  });

  it('returns null for rank 0 or negative', () => {
    expect(getMedalType(0)).toBeNull();
    expect(getMedalType(-1)).toBeNull();
  });
});

describe('getMedalEmoji', () => {
  it('returns correct emoji for ranks 1-3', () => {
    expect(getMedalEmoji(1)).toBe('🥇');
    expect(getMedalEmoji(2)).toBe('🥈');
    expect(getMedalEmoji(3)).toBe('🥉');
  });

  it('returns empty string for rank 4+', () => {
    expect(getMedalEmoji(4)).toBe('');
    expect(getMedalEmoji(10)).toBe('');
  });
});

describe('calculateScoreGaps', () => {
  it('calculates gaps between consecutive ranks', () => {
    const leaderboard = [
      { rank: 1, score: 100 },
      { rank: 2, score: 80 },
      { rank: 3, score: 75 },
    ];

    const gaps = calculateScoreGaps(leaderboard);

    expect(gaps).toEqual([20, 5]);
  });

  it('handles single entry', () => {
    const leaderboard = [{ rank: 1, score: 100 }];
    expect(calculateScoreGaps(leaderboard)).toEqual([]);
  });

  it('handles empty array', () => {
    expect(calculateScoreGaps([])).toEqual([]);
  });

  it('handles tied scores (0 gap)', () => {
    const leaderboard = [
      { rank: 1, score: 100 },
      { rank: 2, score: 100 },
    ];

    expect(calculateScoreGaps(leaderboard)).toEqual([0]);
  });
});

describe('getPointsToNextRank', () => {
  it('returns points needed to move up', () => {
    const leaderboard = [
      { rank: 1, userId: 'u1', userName: 'Alice', avatar: null, score: 100 },
      { rank: 2, userId: 'u2', userName: 'Bob', avatar: null, score: 80 },
      { rank: 3, userId: 'u3', userName: 'Carol', avatar: null, score: 60 },
    ];

    expect(getPointsToNextRank('u2', leaderboard)).toBe(21); // 100 - 80 + 1
    expect(getPointsToNextRank('u3', leaderboard)).toBe(21); // 80 - 60 + 1
  });

  it('returns 0 for first place', () => {
    const leaderboard = [
      { rank: 1, userId: 'u1', userName: 'Alice', avatar: null, score: 100 },
    ];

    expect(getPointsToNextRank('u1', leaderboard)).toBe(0);
  });

  it('returns 0 for non-existent user', () => {
    const leaderboard = [
      { rank: 1, userId: 'u1', userName: 'Alice', avatar: null, score: 100 },
    ];

    expect(getPointsToNextRank('u99', leaderboard)).toBe(0);
  });
});

describe('calculatePercentile', () => {
  it('calculates percentile correctly', () => {
    const scores = [100, 90, 80, 70, 60];

    expect(calculatePercentile(80, scores)).toBe(40); // 2 scores below out of 5
    expect(calculatePercentile(100, scores)).toBe(80); // 4 scores below
    expect(calculatePercentile(60, scores)).toBe(0); // No scores below
  });

  it('handles empty array', () => {
    expect(calculatePercentile(100, [])).toBe(0);
  });

  it('handles single score', () => {
    expect(calculatePercentile(100, [100])).toBe(0);
  });
});

describe('calculateRankMovement', () => {
  it('returns positive for improvement (moving up)', () => {
    expect(calculateRankMovement(2, 5)).toBe(3); // Was 5th, now 2nd
  });

  it('returns negative for dropping', () => {
    expect(calculateRankMovement(5, 2)).toBe(-3); // Was 2nd, now 5th
  });

  it('returns 0 for no change', () => {
    expect(calculateRankMovement(3, 3)).toBe(0);
  });
});

describe('getMovementIndicator', () => {
  it('returns up for positive movement', () => {
    expect(getMovementIndicator(3)).toBe('up');
    expect(getMovementIndicator(1)).toBe('up');
  });

  it('returns down for negative movement', () => {
    expect(getMovementIndicator(-3)).toBe('down');
    expect(getMovementIndicator(-1)).toBe('down');
  });

  it('returns same for no movement', () => {
    expect(getMovementIndicator(0)).toBe('same');
  });
});
