/**
 * Core KPI Calculations
 *
 * All functions are pure - no side effects, no database calls.
 * These functions power the business metrics throughout Topline.
 */

import type { PaginationMeta } from './types';

// =============================================================================
// Average Check Calculations
// =============================================================================

/**
 * Calculate average check (revenue per cover)
 *
 * @param revenue - Total revenue amount
 * @param covers - Number of covers (guests/tables served)
 * @returns Average check amount, rounded to 2 decimals. Returns 0 if covers <= 0.
 *
 * @example
 * calculateAverageCheck(5000, 100) // => 50.00
 * calculateAverageCheck(333, 7)    // => 47.57
 * calculateAverageCheck(5000, 0)   // => 0 (zero handling)
 */
export function calculateAverageCheck(revenue: number, covers: number): number {
  if (covers <= 0) return 0;
  return Math.round((revenue / covers) * 100) / 100;
}

// =============================================================================
// Trend Calculations
// =============================================================================

/**
 * Calculate trend percentage between two periods
 *
 * Formula: ((current - previous) / previous) * 100
 *
 * @param current - Current period value
 * @param previous - Previous period value (baseline)
 * @returns Trend percentage. Positive = improvement, negative = decline. Returns 0 if previous is 0.
 *
 * @example
 * calculateTrend(110, 100) // => 10 (10% increase)
 * calculateTrend(90, 100)  // => -10 (10% decrease)
 * calculateTrend(100, 0)   // => 0 (avoid division by zero)
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

// =============================================================================
// Variance Calculations
// =============================================================================

/**
 * Calculate variance percentage (actual vs budget/target)
 *
 * @param actual - Actual achieved value
 * @param budget - Budgeted/target value
 * @returns Variance percentage. Positive = over budget, negative = under budget.
 *
 * @example
 * calculateVariance(11000, 10000) // => 10 (10% over budget)
 * calculateVariance(9000, 10000)  // => -10 (10% under budget)
 * calculateVariance(5000, 0)      // => 0 (zero budget handling)
 */
export function calculateVariance(actual: number, budget: number): number {
  if (budget === 0) return 0;
  return Math.round(((actual - budget) / budget) * 10000) / 100;
}

// =============================================================================
// Cost Calculations
// =============================================================================

/**
 * Calculate cost as percentage of revenue
 *
 * Common use: labor cost %, food cost %, etc.
 *
 * @param cost - Cost amount
 * @param revenue - Revenue amount
 * @returns Cost percentage. Returns 0 if revenue is 0.
 *
 * @example
 * calculateCostPercent(3000, 10000) // => 30 (30% cost ratio)
 * calculateCostPercent(0, 10000)    // => 0
 * calculateCostPercent(3000, 0)     // => 0 (zero revenue handling)
 */
export function calculateCostPercent(cost: number, revenue: number): number {
  if (revenue === 0) return 0;
  return Math.round((cost / revenue) * 10000) / 100;
}

// =============================================================================
// Pagination Calculations
// =============================================================================

/**
 * Calculate pagination metadata from total count and page parameters
 *
 * @param total - Total number of items
 * @param page - Current page number (1-based)
 * @param limit - Items per page
 * @returns Pagination metadata object
 *
 * @example
 * calculatePaginationMeta(100, 1, 10)
 * // => { total: 100, page: 1, limit: 10, totalPages: 10, hasNext: true, hasPrev: false }
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// =============================================================================
// Profit Margin Calculations
// =============================================================================

/**
 * Calculate gross profit margin
 *
 * Formula: ((revenue - cost) / revenue) * 100
 *
 * @param revenue - Total revenue
 * @param cost - Total cost (COGS)
 * @returns Gross profit margin percentage
 *
 * @example
 * calculateGrossMargin(10000, 6000) // => 40 (40% margin)
 * calculateGrossMargin(10000, 0)    // => 100 (100% margin - no costs)
 * calculateGrossMargin(0, 5000)     // => 0 (no revenue)
 */
export function calculateGrossMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return Math.round(((revenue - cost) / revenue) * 10000) / 100;
}

// =============================================================================
// Growth Calculations
// =============================================================================

/**
 * Calculate compound annual growth rate (CAGR)
 *
 * Formula: ((endValue / startValue) ^ (1 / years)) - 1
 *
 * @param startValue - Beginning value
 * @param endValue - Ending value
 * @param years - Number of years
 * @returns CAGR as percentage
 *
 * @example
 * calculateCAGR(100000, 150000, 3) // => ~14.47 (14.47% annual growth)
 */
export function calculateCAGR(
  startValue: number,
  endValue: number,
  years: number
): number {
  if (startValue <= 0 || years <= 0) return 0;
  const ratio = endValue / startValue;
  const cagr = Math.pow(ratio, 1 / years) - 1;
  return Math.round(cagr * 10000) / 100;
}

// =============================================================================
// Per-Unit Calculations
// =============================================================================

/**
 * Calculate revenue per employee
 *
 * @param revenue - Total revenue
 * @param employees - Number of employees
 * @returns Revenue per employee
 *
 * @example
 * calculateRevenuePerEmployee(500000, 10) // => 50000
 */
export function calculateRevenuePerEmployee(
  revenue: number,
  employees: number
): number {
  if (employees <= 0) return 0;
  return Math.round((revenue / employees) * 100) / 100;
}

/**
 * Calculate average transaction value
 *
 * @param revenue - Total revenue
 * @param transactions - Number of transactions
 * @returns Average transaction value
 *
 * @example
 * calculateAverageTransaction(10000, 200) // => 50
 */
export function calculateAverageTransaction(
  revenue: number,
  transactions: number
): number {
  if (transactions <= 0) return 0;
  return Math.round((revenue / transactions) * 100) / 100;
}

// =============================================================================
// Target/Goal Calculations
// =============================================================================

/**
 * Calculate progress towards a target
 *
 * @param current - Current value
 * @param target - Target value
 * @returns Progress percentage (can exceed 100%)
 *
 * @example
 * calculateProgress(750, 1000) // => 75 (75% complete)
 * calculateProgress(1200, 1000) // => 120 (120% - exceeded target)
 */
export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.round((current / target) * 10000) / 100;
}

/**
 * Calculate remaining amount to reach target
 *
 * @param current - Current value
 * @param target - Target value
 * @returns Remaining amount (0 if target already met)
 *
 * @example
 * calculateRemaining(750, 1000) // => 250
 * calculateRemaining(1200, 1000) // => 0 (target exceeded)
 */
export function calculateRemaining(current: number, target: number): number {
  const remaining = target - current;
  return remaining > 0 ? remaining : 0;
}

/**
 * Calculate daily run rate needed to hit target
 *
 * @param current - Current value achieved
 * @param target - Target value
 * @param daysRemaining - Number of days left
 * @returns Required daily amount to hit target
 *
 * @example
 * calculateDailyRunRate(5000, 10000, 10) // => 500 per day needed
 */
export function calculateDailyRunRate(
  current: number,
  target: number,
  daysRemaining: number
): number {
  if (daysRemaining <= 0) return 0;
  const remaining = target - current;
  if (remaining <= 0) return 0;
  return Math.round((remaining / daysRemaining) * 100) / 100;
}
