import { describe, it, expect } from 'vitest';
import {
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
} from '@/lib/core/kpi';

describe('calculateAverageCheck', () => {
  it('calculates revenue / covers correctly', () => {
    expect(calculateAverageCheck(5000, 100)).toBe(50);
  });

  it('handles zero covers (returns 0)', () => {
    expect(calculateAverageCheck(5000, 0)).toBe(0);
  });

  it('handles negative covers (returns 0)', () => {
    expect(calculateAverageCheck(5000, -10)).toBe(0);
  });

  it('handles fractional results with rounding to 2 decimals', () => {
    expect(calculateAverageCheck(333, 7)).toBe(47.57);
  });

  it('handles zero revenue', () => {
    expect(calculateAverageCheck(0, 100)).toBe(0);
  });

  it('handles large numbers', () => {
    expect(calculateAverageCheck(1000000, 5000)).toBe(200);
  });

  it('handles small decimal values', () => {
    expect(calculateAverageCheck(1.5, 3)).toBe(0.5);
  });
});

describe('calculateTrend', () => {
  it('calculates positive trend', () => {
    expect(calculateTrend(110, 100)).toBe(10);
  });

  it('calculates negative trend', () => {
    expect(calculateTrend(90, 100)).toBe(-10);
  });

  it('handles zero previous (returns 0)', () => {
    expect(calculateTrend(100, 0)).toBe(0);
  });

  it('handles no change', () => {
    expect(calculateTrend(100, 100)).toBe(0);
  });

  it('handles doubling (100% increase)', () => {
    expect(calculateTrend(200, 100)).toBe(100);
  });

  it('handles halving (50% decrease)', () => {
    expect(calculateTrend(50, 100)).toBe(-50);
  });

  it('handles small changes with precision', () => {
    expect(calculateTrend(101, 100)).toBe(1);
  });

  it('handles large percentage increases', () => {
    expect(calculateTrend(1000, 100)).toBe(900);
  });
});

describe('calculateVariance', () => {
  it('calculates positive variance (over budget)', () => {
    expect(calculateVariance(11000, 10000)).toBe(10);
  });

  it('calculates negative variance (under budget)', () => {
    expect(calculateVariance(9000, 10000)).toBe(-10);
  });

  it('handles zero budget (returns 0)', () => {
    expect(calculateVariance(5000, 0)).toBe(0);
  });

  it('handles on-target (no variance)', () => {
    expect(calculateVariance(10000, 10000)).toBe(0);
  });

  it('handles small variances with precision', () => {
    expect(calculateVariance(10050, 10000)).toBe(0.5);
  });
});

describe('calculateCostPercent', () => {
  it('calculates cost as percentage of revenue', () => {
    expect(calculateCostPercent(3000, 10000)).toBe(30);
  });

  it('handles zero cost', () => {
    expect(calculateCostPercent(0, 10000)).toBe(0);
  });

  it('handles zero revenue (returns 0)', () => {
    expect(calculateCostPercent(3000, 0)).toBe(0);
  });

  it('handles 100% cost', () => {
    expect(calculateCostPercent(10000, 10000)).toBe(100);
  });

  it('handles cost exceeding revenue', () => {
    expect(calculateCostPercent(15000, 10000)).toBe(150);
  });
});

describe('calculatePaginationMeta', () => {
  it('calculates first page correctly', () => {
    const result = calculatePaginationMeta(100, 1, 10);
    expect(result).toEqual({
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
      hasNext: true,
      hasPrev: false,
    });
  });

  it('calculates middle page correctly', () => {
    const result = calculatePaginationMeta(100, 5, 10);
    expect(result).toEqual({
      total: 100,
      page: 5,
      limit: 10,
      totalPages: 10,
      hasNext: true,
      hasPrev: true,
    });
  });

  it('calculates last page correctly', () => {
    const result = calculatePaginationMeta(100, 10, 10);
    expect(result).toEqual({
      total: 100,
      page: 10,
      limit: 10,
      totalPages: 10,
      hasNext: false,
      hasPrev: true,
    });
  });

  it('handles partial last page', () => {
    const result = calculatePaginationMeta(95, 10, 10);
    expect(result.totalPages).toBe(10);
  });

  it('handles single page result', () => {
    const result = calculatePaginationMeta(5, 1, 10);
    expect(result).toEqual({
      total: 5,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  it('handles zero results', () => {
    const result = calculatePaginationMeta(0, 1, 10);
    expect(result.totalPages).toBe(0);
    expect(result.hasNext).toBe(false);
  });
});

describe('calculateGrossMargin', () => {
  it('calculates gross margin correctly', () => {
    expect(calculateGrossMargin(10000, 6000)).toBe(40);
  });

  it('handles zero costs (100% margin)', () => {
    expect(calculateGrossMargin(10000, 0)).toBe(100);
  });

  it('handles zero revenue (returns 0)', () => {
    expect(calculateGrossMargin(0, 5000)).toBe(0);
  });

  it('handles break-even (0% margin)', () => {
    expect(calculateGrossMargin(10000, 10000)).toBe(0);
  });

  it('handles negative margin (cost exceeds revenue)', () => {
    expect(calculateGrossMargin(10000, 15000)).toBe(-50);
  });
});

describe('calculateCAGR', () => {
  it('calculates CAGR correctly', () => {
    // $100,000 -> $150,000 over 3 years
    const cagr = calculateCAGR(100000, 150000, 3);
    expect(cagr).toBeCloseTo(14.47, 1);
  });

  it('handles zero start value (returns 0)', () => {
    expect(calculateCAGR(0, 150000, 3)).toBe(0);
  });

  it('handles negative start value (returns 0)', () => {
    expect(calculateCAGR(-100000, 150000, 3)).toBe(0);
  });

  it('handles zero years (returns 0)', () => {
    expect(calculateCAGR(100000, 150000, 0)).toBe(0);
  });

  it('handles no growth', () => {
    expect(calculateCAGR(100000, 100000, 3)).toBe(0);
  });

  it('handles decline', () => {
    const cagr = calculateCAGR(100000, 50000, 3);
    expect(cagr).toBeLessThan(0);
  });
});

describe('calculateRevenuePerEmployee', () => {
  it('calculates revenue per employee correctly', () => {
    expect(calculateRevenuePerEmployee(500000, 10)).toBe(50000);
  });

  it('handles zero employees (returns 0)', () => {
    expect(calculateRevenuePerEmployee(500000, 0)).toBe(0);
  });

  it('handles negative employees (returns 0)', () => {
    expect(calculateRevenuePerEmployee(500000, -5)).toBe(0);
  });

  it('handles fractional results', () => {
    expect(calculateRevenuePerEmployee(100000, 3)).toBeCloseTo(33333.33, 2);
  });
});

describe('calculateAverageTransaction', () => {
  it('calculates average transaction correctly', () => {
    expect(calculateAverageTransaction(10000, 200)).toBe(50);
  });

  it('handles zero transactions (returns 0)', () => {
    expect(calculateAverageTransaction(10000, 0)).toBe(0);
  });

  it('handles fractional results', () => {
    expect(calculateAverageTransaction(10000, 3)).toBeCloseTo(3333.33, 2);
  });
});

describe('calculateProgress', () => {
  it('calculates progress percentage correctly', () => {
    expect(calculateProgress(750, 1000)).toBe(75);
  });

  it('handles zero target (returns 0)', () => {
    expect(calculateProgress(750, 0)).toBe(0);
  });

  it('handles exceeding target', () => {
    expect(calculateProgress(1200, 1000)).toBe(120);
  });

  it('handles zero progress', () => {
    expect(calculateProgress(0, 1000)).toBe(0);
  });

  it('handles exact target', () => {
    expect(calculateProgress(1000, 1000)).toBe(100);
  });
});

describe('calculateRemaining', () => {
  it('calculates remaining amount correctly', () => {
    expect(calculateRemaining(750, 1000)).toBe(250);
  });

  it('returns 0 when target exceeded', () => {
    expect(calculateRemaining(1200, 1000)).toBe(0);
  });

  it('returns 0 when exactly at target', () => {
    expect(calculateRemaining(1000, 1000)).toBe(0);
  });

  it('returns full target when no progress', () => {
    expect(calculateRemaining(0, 1000)).toBe(1000);
  });
});

describe('calculateDailyRunRate', () => {
  it('calculates required daily rate correctly', () => {
    expect(calculateDailyRunRate(5000, 10000, 10)).toBe(500);
  });

  it('handles zero days remaining (returns 0)', () => {
    expect(calculateDailyRunRate(5000, 10000, 0)).toBe(0);
  });

  it('returns 0 when target already met', () => {
    expect(calculateDailyRunRate(10000, 10000, 10)).toBe(0);
  });

  it('returns 0 when target exceeded', () => {
    expect(calculateDailyRunRate(12000, 10000, 10)).toBe(0);
  });

  it('handles fractional results', () => {
    expect(calculateDailyRunRate(0, 1000, 7)).toBeCloseTo(142.86, 2);
  });
});
