import { describe, it, expect } from 'vitest';
import {
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
} from '@/lib/core/game-state';

describe('GAME_THRESHOLDS', () => {
  it('has correct winning threshold (5% above)', () => {
    expect(GAME_THRESHOLDS.WINNING).toBe(1.05);
  });

  it('has correct losing threshold (5% below)', () => {
    expect(GAME_THRESHOLDS.LOSING).toBe(0.95);
  });
});

describe('determineGameState', () => {
  it('returns winning when 5% above target', () => {
    expect(
      determineGameState({ ytdRevenue: 1050, targetToDate: 1000, yearlyTarget: 10000 })
    ).toBe('winning');
  });

  it('returns winning when well above target', () => {
    expect(
      determineGameState({ ytdRevenue: 1200, targetToDate: 1000, yearlyTarget: 10000 })
    ).toBe('winning');
  });

  it('returns losing when 5% below target', () => {
    expect(
      determineGameState({ ytdRevenue: 950, targetToDate: 1000, yearlyTarget: 10000 })
    ).toBe('losing');
  });

  it('returns losing when well below target', () => {
    expect(
      determineGameState({ ytdRevenue: 800, targetToDate: 1000, yearlyTarget: 10000 })
    ).toBe('losing');
  });

  it('returns neutral when within threshold', () => {
    expect(
      determineGameState({ ytdRevenue: 1000, targetToDate: 1000, yearlyTarget: 10000 })
    ).toBe('neutral');
  });

  it('returns neutral when slightly above but below winning threshold', () => {
    expect(
      determineGameState({ ytdRevenue: 1040, targetToDate: 1000, yearlyTarget: 10000 })
    ).toBe('neutral');
  });

  it('returns neutral when slightly below but above losing threshold', () => {
    expect(
      determineGameState({ ytdRevenue: 960, targetToDate: 1000, yearlyTarget: 10000 })
    ).toBe('neutral');
  });

  it('returns celebrating when yearly target achieved', () => {
    expect(
      determineGameState({ ytdRevenue: 10000, targetToDate: 1000, yearlyTarget: 10000 })
    ).toBe('celebrating');
  });

  it('returns celebrating when yearly target exceeded', () => {
    expect(
      determineGameState({ ytdRevenue: 12000, targetToDate: 1000, yearlyTarget: 10000 })
    ).toBe('celebrating');
  });

  it('returns neutral when targetToDate is 0', () => {
    expect(
      determineGameState({ ytdRevenue: 1000, targetToDate: 0, yearlyTarget: 10000 })
    ).toBe('neutral');
  });

  it('returns neutral when yearlyTarget is 0', () => {
    expect(
      determineGameState({ ytdRevenue: 1000, targetToDate: 1000, yearlyTarget: 0 })
    ).toBe('neutral');
  });

  it('returns neutral when both targets are 0', () => {
    expect(
      determineGameState({ ytdRevenue: 1000, targetToDate: 0, yearlyTarget: 0 })
    ).toBe('neutral');
  });
});

describe('determineGameStateCustom', () => {
  it('uses custom winning threshold', () => {
    // 10% threshold instead of 5%
    expect(
      determineGameStateCustom(
        { ytdRevenue: 1050, targetToDate: 1000, yearlyTarget: 10000 },
        1.10,
        0.90
      )
    ).toBe('neutral'); // 5% is not enough for 10% threshold

    expect(
      determineGameStateCustom(
        { ytdRevenue: 1100, targetToDate: 1000, yearlyTarget: 10000 },
        1.10,
        0.90
      )
    ).toBe('winning'); // 10% is enough
  });

  it('uses custom losing threshold', () => {
    expect(
      determineGameStateCustom(
        { ytdRevenue: 950, targetToDate: 1000, yearlyTarget: 10000 },
        1.10,
        0.90
      )
    ).toBe('neutral'); // 5% below is not enough for 10% threshold

    expect(
      determineGameStateCustom(
        { ytdRevenue: 900, targetToDate: 1000, yearlyTarget: 10000 },
        1.10,
        0.90
      )
    ).toBe('losing'); // 10% below triggers losing
  });
});

describe('getDayOfYear', () => {
  // Use local dates to avoid timezone issues
  const createLocalDate = (year: number, month: number, day: number) =>
    new Date(year, month - 1, day);

  it('returns 1 for Jan 1', () => {
    expect(getDayOfYear(createLocalDate(2024, 1, 1))).toBe(1);
  });

  it('returns 32 for Feb 1 (Jan has 31 days)', () => {
    expect(getDayOfYear(createLocalDate(2024, 2, 1))).toBe(32);
  });

  it('returns 366 for Dec 31 in leap year', () => {
    expect(getDayOfYear(createLocalDate(2024, 12, 31))).toBe(366);
  });

  it('returns 365 for Dec 31 in non-leap year', () => {
    expect(getDayOfYear(createLocalDate(2023, 12, 31))).toBe(365);
  });

  it('handles mid-year dates', () => {
    // July 1 in a leap year (31 + 29 + 31 + 30 + 31 + 30 + 1 = 183)
    expect(getDayOfYear(createLocalDate(2024, 7, 1))).toBe(183);
  });
});

describe('getDaysRemaining', () => {
  // Use local dates to avoid timezone issues
  const createLocalDate = (year: number, month: number, day: number) =>
    new Date(year, month - 1, day);

  it('returns 364 on Jan 1 of non-leap year', () => {
    expect(getDaysRemaining(createLocalDate(2023, 1, 1))).toBe(364);
  });

  it('returns 0 on Dec 31', () => {
    expect(getDaysRemaining(createLocalDate(2023, 12, 31))).toBe(0);
  });

  it('handles leap year correctly', () => {
    expect(getDaysRemaining(createLocalDate(2024, 12, 31))).toBe(0);
    expect(getDaysRemaining(createLocalDate(2024, 12, 30))).toBe(1);
  });

  it('handles mid-year', () => {
    // July 1, 2024 (leap year) - day 183, 183 remaining
    expect(getDaysRemaining(createLocalDate(2024, 7, 1))).toBe(183);
  });
});

describe('isLeapYear', () => {
  it('returns true for divisible by 4', () => {
    expect(isLeapYear(2024)).toBe(true);
  });

  it('returns false for non-leap year', () => {
    expect(isLeapYear(2023)).toBe(false);
  });

  it('returns false for century years not divisible by 400', () => {
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2100)).toBe(false);
  });

  it('returns true for century years divisible by 400', () => {
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2400)).toBe(true);
  });
});

describe('getDaysInYear', () => {
  it('returns 365 for non-leap year', () => {
    expect(getDaysInYear(2023)).toBe(365);
  });

  it('returns 366 for leap year', () => {
    expect(getDaysInYear(2024)).toBe(366);
  });
});

describe('calculateProgressPercent', () => {
  it('calculates progress correctly', () => {
    expect(calculateProgressPercent(500000, 1000000)).toBe(50);
  });

  it('handles zero yearly target (returns 0)', () => {
    expect(calculateProgressPercent(500000, 0)).toBe(0);
  });

  it('handles exceeding target (> 100%)', () => {
    expect(calculateProgressPercent(1200000, 1000000)).toBe(120);
  });

  it('handles zero revenue', () => {
    expect(calculateProgressPercent(0, 1000000)).toBe(0);
  });
});

describe('calculateExpectedProgress', () => {
  // Use local dates to avoid timezone issues
  const createLocalDate = (year: number, month: number, day: number) =>
    new Date(year, month - 1, day);

  it('returns ~50% for mid-year', () => {
    const progress = calculateExpectedProgress(createLocalDate(2024, 7, 1));
    expect(progress).toBeCloseTo(50, 0);
  });

  it('returns ~0% for start of year', () => {
    const progress = calculateExpectedProgress(createLocalDate(2024, 1, 1));
    expect(progress).toBeLessThan(1);
  });

  it('returns 100% for end of year', () => {
    const progress = calculateExpectedProgress(createLocalDate(2024, 12, 31));
    expect(progress).toBe(100);
  });
});

describe('calculateTargetToDate', () => {
  // Use local dates to avoid timezone issues
  const createLocalDate = (year: number, month: number, day: number) =>
    new Date(year, month - 1, day);

  it('prorates yearly target correctly', () => {
    // Mid-year should be ~50% of target
    const target = calculateTargetToDate(1000000, createLocalDate(2024, 7, 1));
    expect(target).toBeCloseTo(500000, -4); // Within 10000
  });

  it('returns small amount for start of year', () => {
    const target = calculateTargetToDate(1000000, createLocalDate(2024, 1, 1));
    // Day 1 of 366 = 0.27% of target
    expect(target).toBeLessThan(5000);
  });

  it('returns full target for end of year', () => {
    const target = calculateTargetToDate(1000000, createLocalDate(2024, 12, 31));
    expect(target).toBe(1000000);
  });
});

describe('buildGameState', () => {
  // Use local dates to avoid timezone issues
  const createLocalDate = (year: number, month: number, day: number) =>
    new Date(year, month - 1, day);

  it('builds complete game state', () => {
    const state = buildGameState(500000, 1000000, createLocalDate(2024, 7, 1));

    expect(state).toHaveProperty('status');
    expect(state).toHaveProperty('percentComplete');
    expect(state).toHaveProperty('daysRemaining');
    expect(state).toHaveProperty('currentScore');
    expect(state).toHaveProperty('targetScore');
  });

  it('calculates correct status for winning', () => {
    // Mid-year, 60% of target = winning
    const state = buildGameState(600000, 1000000, createLocalDate(2024, 7, 1));
    expect(state.status).toBe('winning');
  });

  it('calculates correct status for losing', () => {
    // Mid-year, 40% of target = losing
    const state = buildGameState(400000, 1000000, createLocalDate(2024, 7, 1));
    expect(state.status).toBe('losing');
  });

  it('includes correct current score', () => {
    const state = buildGameState(500000, 1000000, createLocalDate(2024, 7, 1));
    expect(state.currentScore).toBe(500000);
  });
});

describe('calculateWinningStreak', () => {
  it('returns 0 when most recent day is a loss', () => {
    const results = [
      { date: '2024-01-01', revenue: 1100, target: 1000 },
      { date: '2024-01-02', revenue: 1050, target: 1000 },
      { date: '2024-01-03', revenue: 900, target: 1000 }, // Lost
    ];
    expect(calculateWinningStreak(results)).toBe(0);
  });

  it('returns correct streak when winning', () => {
    const results = [
      { date: '2024-01-01', revenue: 900, target: 1000 }, // Lost
      { date: '2024-01-02', revenue: 1050, target: 1000 },
      { date: '2024-01-03', revenue: 1100, target: 1000 },
    ];
    expect(calculateWinningStreak(results)).toBe(2);
  });

  it('handles all wins', () => {
    const results = [
      { date: '2024-01-01', revenue: 1100, target: 1000 },
      { date: '2024-01-02', revenue: 1050, target: 1000 },
      { date: '2024-01-03', revenue: 1200, target: 1000 },
    ];
    expect(calculateWinningStreak(results)).toBe(3);
  });

  it('handles empty array', () => {
    expect(calculateWinningStreak([])).toBe(0);
  });

  it('includes ties as wins', () => {
    const results = [
      { date: '2024-01-01', revenue: 1000, target: 1000 }, // Tie = win
      { date: '2024-01-02', revenue: 1000, target: 1000 }, // Tie = win
    ];
    expect(calculateWinningStreak(results)).toBe(2);
  });
});

describe('calculateLongestStreak', () => {
  it('finds longest streak in middle', () => {
    const results = [
      { date: '2024-01-01', revenue: 1100, target: 1000 }, // Win
      { date: '2024-01-02', revenue: 1100, target: 1000 }, // Win
      { date: '2024-01-03', revenue: 900, target: 1000 }, // Loss
      { date: '2024-01-04', revenue: 1100, target: 1000 }, // Win
    ];
    expect(calculateLongestStreak(results)).toBe(2);
  });

  it('handles all wins', () => {
    const results = [
      { date: '2024-01-01', revenue: 1100, target: 1000 },
      { date: '2024-01-02', revenue: 1100, target: 1000 },
      { date: '2024-01-03', revenue: 1100, target: 1000 },
    ];
    expect(calculateLongestStreak(results)).toBe(3);
  });

  it('handles all losses', () => {
    const results = [
      { date: '2024-01-01', revenue: 900, target: 1000 },
      { date: '2024-01-02', revenue: 800, target: 1000 },
    ];
    expect(calculateLongestStreak(results)).toBe(0);
  });

  it('handles empty array', () => {
    expect(calculateLongestStreak([])).toBe(0);
  });
});
