import { describe, it, expect } from 'vitest';
import {
  aggregateBehaviorCounts,
  aggregateBehaviorCountsWithPercent,
  calculateStreak,
  calculateLongestStreak,
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
} from '@/lib/core/statistics';

describe('aggregateBehaviorCounts', () => {
  it('aggregates multiple logs for same behavior', () => {
    const logs = [
      { behaviorId: 'b1', behavior: { name: 'Upsell' } },
      { behaviorId: 'b1', behavior: { name: 'Upsell' } },
      { behaviorId: 'b2', behavior: { name: 'Dessert' } },
    ];

    const result = aggregateBehaviorCounts(logs);

    expect(result).toHaveLength(2);
    expect(result.find((r) => r.behaviorId === 'b1')?.count).toBe(2);
    expect(result.find((r) => r.behaviorId === 'b2')?.count).toBe(1);
  });

  it('returns empty array for no logs', () => {
    expect(aggregateBehaviorCounts([])).toEqual([]);
  });

  it('sorts by count descending', () => {
    const logs = [
      { behaviorId: 'b1', behavior: { name: 'A' } },
      { behaviorId: 'b2', behavior: { name: 'B' } },
      { behaviorId: 'b2', behavior: { name: 'B' } },
      { behaviorId: 'b2', behavior: { name: 'B' } },
    ];

    const result = aggregateBehaviorCounts(logs);

    expect(result[0].behaviorId).toBe('b2');
    expect(result[0].count).toBe(3);
    expect(result[1].behaviorId).toBe('b1');
    expect(result[1].count).toBe(1);
  });

  it('preserves behavior name', () => {
    const logs = [{ behaviorId: 'b1', behavior: { name: 'Upsell Wine' } }];

    const result = aggregateBehaviorCounts(logs);

    expect(result[0].behaviorName).toBe('Upsell Wine');
  });
});

describe('aggregateBehaviorCountsWithPercent', () => {
  it('includes percentage of total', () => {
    const logs = [
      { behaviorId: 'b1', behavior: { name: 'A' } },
      { behaviorId: 'b1', behavior: { name: 'A' } },
      { behaviorId: 'b2', behavior: { name: 'B' } },
      { behaviorId: 'b2', behavior: { name: 'B' } },
    ];

    const result = aggregateBehaviorCountsWithPercent(logs);

    expect(result[0].percent).toBe(50);
    expect(result[1].percent).toBe(50);
  });

  it('handles empty logs', () => {
    const result = aggregateBehaviorCountsWithPercent([]);
    expect(result).toEqual([]);
  });
});

describe('calculateStreak', () => {
  it('returns 0 for no activity today', () => {
    const dates = new Set(['2024-01-01', '2024-01-02']);
    expect(calculateStreak(dates, '2024-01-05')).toBe(0);
  });

  it('returns consecutive days', () => {
    const dates = new Set(['2024-01-03', '2024-01-04', '2024-01-05']);
    expect(calculateStreak(dates, '2024-01-05')).toBe(3);
  });

  it('stops at gap', () => {
    const dates = new Set(['2024-01-01', '2024-01-03', '2024-01-04', '2024-01-05']);
    expect(calculateStreak(dates, '2024-01-05')).toBe(3);
  });

  it('handles single day', () => {
    const dates = new Set(['2024-01-05']);
    expect(calculateStreak(dates, '2024-01-05')).toBe(1);
  });

  it('handles empty set', () => {
    expect(calculateStreak(new Set(), '2024-01-05')).toBe(0);
  });
});

describe('calculateLongestStreak', () => {
  it('finds longest streak', () => {
    const dates = new Set([
      '2024-01-01',
      '2024-01-02',
      '2024-01-05', // Gap
      '2024-01-06',
      '2024-01-07',
      '2024-01-08',
    ]);
    expect(calculateLongestStreak(dates)).toBe(4); // Jan 5-8
  });

  it('handles single day', () => {
    const dates = new Set(['2024-01-01']);
    expect(calculateLongestStreak(dates)).toBe(1);
  });

  it('handles empty set', () => {
    expect(calculateLongestStreak(new Set())).toBe(0);
  });

  it('handles all consecutive days', () => {
    const dates = new Set(['2024-01-01', '2024-01-02', '2024-01-03']);
    expect(calculateLongestStreak(dates)).toBe(3);
  });
});

describe('generateDailyTrend', () => {
  it('counts logs per day', () => {
    const logs = [
      { createdAt: new Date('2024-01-01T10:00:00') },
      { createdAt: new Date('2024-01-01T14:00:00') },
      { createdAt: new Date('2024-01-02T09:00:00') },
    ];

    const result = generateDailyTrend(logs);

    expect(result).toHaveLength(2);
    expect(result.find((r) => r.date === '2024-01-01')?.count).toBe(2);
    expect(result.find((r) => r.date === '2024-01-02')?.count).toBe(1);
  });

  it('sorts by date ascending', () => {
    const logs = [
      { createdAt: new Date('2024-01-03T10:00:00') },
      { createdAt: new Date('2024-01-01T10:00:00') },
      { createdAt: new Date('2024-01-02T10:00:00') },
    ];

    const result = generateDailyTrend(logs);

    expect(result[0].date).toBe('2024-01-01');
    expect(result[1].date).toBe('2024-01-02');
    expect(result[2].date).toBe('2024-01-03');
  });

  it('handles empty logs', () => {
    expect(generateDailyTrend([])).toEqual([]);
  });
});

describe('fillDailyTrendGaps', () => {
  it('fills gaps with zeros', () => {
    const trend = [
      { date: '2024-01-01', count: 5 },
      { date: '2024-01-03', count: 3 },
    ];

    const result = fillDailyTrendGaps(trend, '2024-01-01', '2024-01-03');

    expect(result).toHaveLength(3);
    expect(result[1]).toEqual({ date: '2024-01-02', count: 0 });
  });

  it('handles empty trend', () => {
    const result = fillDailyTrendGaps([], '2024-01-01', '2024-01-03');
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.count === 0)).toBe(true);
  });
});

describe('calculateVerificationRate', () => {
  it('calculates percentage correctly', () => {
    expect(calculateVerificationRate(75, 100)).toBe(75);
  });

  it('handles zero total (returns 0)', () => {
    expect(calculateVerificationRate(0, 0)).toBe(0);
  });

  it('handles 100% verification', () => {
    expect(calculateVerificationRate(50, 50)).toBe(100);
  });

  it('handles fractional percentages', () => {
    expect(calculateVerificationRate(33, 100)).toBe(33);
  });
});

describe('calculateAttendanceRate', () => {
  it('calculates attendance percentage', () => {
    expect(calculateAttendanceRate(45, 50)).toBe(90);
  });

  it('handles zero total', () => {
    expect(calculateAttendanceRate(0, 0)).toBe(0);
  });

  it('handles 100% attendance', () => {
    expect(calculateAttendanceRate(50, 50)).toBe(100);
  });
});

describe('calculateCompletionRate', () => {
  it('calculates completion percentage', () => {
    expect(calculateCompletionRate(8, 10)).toBe(80);
  });

  it('handles zero total', () => {
    expect(calculateCompletionRate(0, 0)).toBe(0);
  });
});

describe('calculateAveragePerDay', () => {
  it('calculates average correctly', () => {
    expect(calculateAveragePerDay(70, 7)).toBe(10);
  });

  it('handles zero days', () => {
    expect(calculateAveragePerDay(70, 0)).toBe(0);
  });

  it('rounds to 1 decimal', () => {
    expect(calculateAveragePerDay(10, 3)).toBe(3.3);
  });
});

describe('calculateMovingAverage', () => {
  it('calculates moving average correctly', () => {
    const values = [10, 20, 30, 40, 50];
    const result = calculateMovingAverage(values, 3);

    expect(result).toHaveLength(3);
    expect(result[0]).toBe(20); // (10+20+30)/3
    expect(result[1]).toBe(30); // (20+30+40)/3
    expect(result[2]).toBe(40); // (30+40+50)/3
  });

  it('returns empty for insufficient values', () => {
    expect(calculateMovingAverage([10, 20], 3)).toEqual([]);
  });
});

describe('getTopPerformers', () => {
  it('returns top performers sorted by count', () => {
    const users = [
      { userId: 'u1', userName: 'Alice', count: 50 },
      { userId: 'u2', userName: 'Bob', count: 30 },
      { userId: 'u3', userName: 'Carol', count: 40 },
    ];

    const result = getTopPerformers(users, 2);

    expect(result).toHaveLength(2);
    expect(result[0].userName).toBe('Alice');
    expect(result[1].userName).toBe('Carol');
  });

  it('handles empty array', () => {
    expect(getTopPerformers([])).toEqual([]);
  });

  it('returns all if limit exceeds length', () => {
    const users = [{ userId: 'u1', userName: 'Alice', count: 50 }];
    expect(getTopPerformers(users, 5)).toHaveLength(1);
  });
});

describe('getBottomPerformers', () => {
  it('returns bottom performers sorted by count', () => {
    const users = [
      { userId: 'u1', userName: 'Alice', count: 50 },
      { userId: 'u2', userName: 'Bob', count: 10 },
      { userId: 'u3', userName: 'Carol', count: 30 },
    ];

    const result = getBottomPerformers(users, 2);

    expect(result).toHaveLength(2);
    expect(result[0].userName).toBe('Bob');
    expect(result[1].userName).toBe('Carol');
  });
});

describe('calculateStandardDeviation', () => {
  it('calculates standard deviation correctly', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const stdDev = calculateStandardDeviation(values);
    expect(stdDev).toBeCloseTo(2, 0);
  });

  it('returns 0 for empty array', () => {
    expect(calculateStandardDeviation([])).toBe(0);
  });

  it('returns 0 for single value', () => {
    expect(calculateStandardDeviation([5])).toBe(0);
  });

  it('returns 0 for identical values', () => {
    expect(calculateStandardDeviation([5, 5, 5, 5])).toBe(0);
  });
});

describe('calculateCoefficientOfVariation', () => {
  it('calculates CV correctly', () => {
    const values = [10, 20, 30];
    // Mean = 20, StdDev ≈ 8.16, CV ≈ 40.8%
    const cv = calculateCoefficientOfVariation(values);
    expect(cv).toBeCloseTo(40.8, 0);
  });

  it('returns 0 for empty array', () => {
    expect(calculateCoefficientOfVariation([])).toBe(0);
  });

  it('returns 0 when mean is 0', () => {
    expect(calculateCoefficientOfVariation([0, 0, 0])).toBe(0);
  });
});

describe('calculateMedian', () => {
  it('calculates median for odd count', () => {
    expect(calculateMedian([1, 3, 5])).toBe(3);
  });

  it('calculates median for even count', () => {
    expect(calculateMedian([1, 2, 3, 4])).toBe(2.5);
  });

  it('handles unsorted input', () => {
    expect(calculateMedian([5, 1, 3])).toBe(3);
  });

  it('returns 0 for empty array', () => {
    expect(calculateMedian([])).toBe(0);
  });

  it('handles single value', () => {
    expect(calculateMedian([5])).toBe(5);
  });
});

describe('calculatePercentileValue', () => {
  it('calculates percentile value correctly', () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    expect(calculatePercentileValue(values, 50)).toBe(50);
    expect(calculatePercentileValue(values, 90)).toBe(90);
  });

  it('returns 0 for empty array', () => {
    expect(calculatePercentileValue([], 50)).toBe(0);
  });

  it('handles 0th percentile', () => {
    expect(calculatePercentileValue([10, 20, 30], 0)).toBe(10);
  });

  it('handles 100th percentile', () => {
    expect(calculatePercentileValue([10, 20, 30], 100)).toBe(30);
  });
});
