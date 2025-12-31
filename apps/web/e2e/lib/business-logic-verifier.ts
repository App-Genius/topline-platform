/**
 * Business Logic Verifier for E2E Tests
 *
 * This module calls pure functions from lib/core during E2E tests
 * to verify business logic is correct alongside UI verification.
 *
 * Why: E2E tests should verify both:
 *   1. UI shows the right things (Playwright assertions)
 *   2. Business rules are enforced (this verifier)
 *
 * Usage:
 *   import { BusinessLogicVerifier } from '../lib/business-logic-verifier';
 *   const verifier = new BusinessLogicVerifier(logger);
 *
 *   // In test step
 *   await verifier.verify('canVerifyLogs', { role: 'MANAGER' }, true);
 *   await verifier.verify('canStaffDeleteLog', { isStaff: true, isLogOwner: true, isVerified: false }, { canDelete: true });
 */

import { VerificationLogger } from '../utils/verification-logger';

// Import all business logic from lib/core
import * as core from '../../lib/core';

// Type for role (matching lib/core/types.ts)
type RoleType = 'ADMIN' | 'MANAGER' | 'SERVER' | 'HOST' | 'BARTENDER' | 'BUSSER' | 'CHEF' | 'FRONT_DESK' | 'HOUSEKEEPING' | 'PURCHASER' | 'ACCOUNTANT' | 'FACILITIES';

// ════════════════════════════════════════════════════════════════════════════
// FUNCTION MAP
// ════════════════════════════════════════════════════════════════════════════

/**
 * Maps spec function names to lib/core functions with typed wrappers.
 *
 * Each entry provides:
 * - name: Spec-friendly function name
 * - fn: The actual lib/core function call
 *
 * Add new functions here as specs need them.
 */
export const FUNCTION_MAP = {
  // RBAC Functions
  canVerifyLogs: (args: { role: RoleType }) => core.canVerifyLogs(args.role),

  canStaffDeleteLog: (args: { isStaff: boolean; isLogOwner: boolean; isVerified: boolean }) =>
    core.canStaffDeleteLog(args.isStaff, args.isLogOwner, args.isVerified),

  isManagerRole: (args: { role: RoleType }) => core.isManagerRole(args.role),

  isStaffRole: (args: { role: RoleType }) => core.isStaffRole(args.role),

  isAdminRole: (args: { role: RoleType }) => core.isAdminRole(args.role),

  canAccessManager: (args: { role: RoleType }) => core.canAccessManager(args.role),

  canAccessAdmin: (args: { role: RoleType }) => core.canAccessAdmin(args.role),

  canAccessFeature: (args: { role: RoleType; feature: 'briefings' | 'verification' | 'analytics' | 'settings' | 'users' | 'roles' }) =>
    core.canAccessFeature(args.role, args.feature),

  canViewAllUsers: (args: { role: RoleType }) => core.canViewAllUsers(args.role),

  canEditUserProfile: (args: { role: RoleType; isOwnProfile: boolean }) =>
    core.canEditUserProfile(args.role, args.isOwnProfile),

  getEffectiveUserId: (args: { requestingUserRole: RoleType; requestingUserId: string; requestedUserId?: string }) =>
    core.getEffectiveUserId(args.requestingUserRole, args.requestingUserId, args.requestedUserId),

  canAccessOrganization: (args: { userOrgId: string; resourceOrgId: string }) =>
    core.canAccessOrganization(args.userOrgId, args.resourceOrgId),

  // Statistics Functions
  calculateVerificationRate: (args: { verified: number; total: number }) =>
    core.calculateVerificationRate(args.verified, args.total),

  calculateAttendanceRate: (args: { present: number; total: number }) =>
    core.calculateAttendanceRate(args.present, args.total),

  calculateCompletionRate: (args: { completed: number; total: number }) =>
    core.calculateCompletionRate(args.completed, args.total),

  calculateAveragePerDay: (args: { total: number; days: number }) =>
    core.calculateAveragePerDay(args.total, args.days),

  // KPI Functions
  calculateAverageCheck: (args: { revenue: number; covers: number }) =>
    core.calculateAverageCheck(args.revenue, args.covers),

  calculateTrend: (args: { current: number; previous: number }) =>
    core.calculateTrend(args.current, args.previous),

  calculateVariance: (args: { actual: number; target: number }) =>
    core.calculateVariance(args.actual, args.target),

  calculateProgress: (args: { current: number; target: number }) =>
    core.calculateProgress(args.current, args.target),

  // Game State Functions
  determineGameState: (args: { actual: number; target: number }) =>
    core.determineGameState(args.actual, args.target),

  calculateProgressPercent: (args: { current: number; target: number }) =>
    core.calculateProgressPercent(args.current, args.target),

  // Leaderboard Functions
  calculateRank: (args: { scores: number[]; score: number }) =>
    core.calculateRank(args.scores, args.score),

  getMedalType: (args: { rank: number }) =>
    core.getMedalType(args.rank),

  // Utility Functions
  safeDivide: (args: { numerator: number; denominator: number; fallback?: number }) =>
    core.safeDivide(args.numerator, args.denominator, args.fallback),

  clamp: (args: { value: number; min: number; max: number }) =>
    core.clamp(args.value, args.min, args.max),

  formatCurrency: (args: { value: number; decimals?: number }) =>
    core.formatCurrency(args.value, args.decimals),

  formatPercent: (args: { value: number; decimals?: number }) =>
    core.formatPercent(args.value, args.decimals),
} as const;

export type FunctionName = keyof typeof FUNCTION_MAP;

// ════════════════════════════════════════════════════════════════════════════
// VERIFIER CLASS
// ════════════════════════════════════════════════════════════════════════════

export interface VerificationResult {
  function: string;
  args: Record<string, unknown>;
  expected: unknown;
  actual: unknown;
  passed: boolean;
  error?: string;
}

/**
 * Business Logic Verifier
 *
 * Runs lib/core functions during E2E tests and logs results
 * to the VerificationLogger for synchronized display with video.
 */
export class BusinessLogicVerifier {
  private logger: VerificationLogger;
  private results: VerificationResult[] = [];

  constructor(logger: VerificationLogger) {
    this.logger = logger;
  }

  /**
   * Verify a business logic function returns expected result
   *
   * @param functionName - Name of function from FUNCTION_MAP
   * @param args - Arguments to pass to the function
   * @param expected - Expected return value
   * @returns true if verification passed
   *
   * @example
   * await verifier.verify('canVerifyLogs', { role: 'MANAGER' }, true);
   * await verifier.verify('canStaffDeleteLog',
   *   { isStaff: true, isLogOwner: true, isVerified: false },
   *   { canDelete: true }
   * );
   */
  verify<T extends FunctionName>(
    functionName: T,
    args: Parameters<(typeof FUNCTION_MAP)[T]>[0],
    expected: ReturnType<(typeof FUNCTION_MAP)[T]>
  ): boolean {
    const fn = FUNCTION_MAP[functionName];
    if (!fn) {
      const error = `Unknown function: ${functionName}`;
      this.logger.assertFail(`BusinessLogic: ${error}`);
      this.results.push({
        function: functionName,
        args: args as Record<string, unknown>,
        expected,
        actual: undefined,
        passed: false,
        error,
      });
      return false;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actual = fn(args as any);
      const passed = this.deepEqual(actual, expected);

      const result: VerificationResult = {
        function: functionName,
        args: args as Record<string, unknown>,
        expected,
        actual,
        passed,
      };
      this.results.push(result);

      if (passed) {
        this.logger.assertPass(`BusinessLogic: ${functionName}() = ${this.stringify(actual)}`);
      } else {
        this.logger.assertFail(
          `BusinessLogic: ${functionName}() expected ${this.stringify(expected)}, got ${this.stringify(actual)}`
        );
      }

      return passed;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.assertFail(`BusinessLogic: ${functionName}() threw: ${errorMsg}`);
      this.results.push({
        function: functionName,
        args: args as Record<string, unknown>,
        expected,
        actual: undefined,
        passed: false,
        error: errorMsg,
      });
      return false;
    }
  }

  /**
   * Verify multiple business logic checks at once
   *
   * @param checks - Array of { function, args, expected }
   * @returns true if all verifications passed
   */
  verifyAll(
    checks: Array<{
      function: FunctionName;
      args: Record<string, unknown>;
      expected: unknown;
    }>
  ): boolean {
    let allPassed = true;
    for (const check of checks) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const passed = this.verify(check.function, check.args as any, check.expected as any);
      if (!passed) allPassed = false;
    }
    return allPassed;
  }

  /**
   * Get all verification results
   */
  getResults(): VerificationResult[] {
    return [...this.results];
  }

  /**
   * Get summary of verification results
   */
  getSummary(): { total: number; passed: number; failed: number } {
    return {
      total: this.results.length,
      passed: this.results.filter((r) => r.passed).length,
      failed: this.results.filter((r) => !r.passed).length,
    };
  }

  /**
   * Reset results for a new test
   */
  reset(): void {
    this.results = [];
  }

  /**
   * Deep equality check for comparing results
   */
  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return a === b;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object' && typeof b === 'object') {
      const aKeys = Object.keys(a as Record<string, unknown>);
      const bKeys = Object.keys(b as Record<string, unknown>);
      if (aKeys.length !== bKeys.length) return false;

      for (const key of aKeys) {
        if (
          !this.deepEqual(
            (a as Record<string, unknown>)[key],
            (b as Record<string, unknown>)[key]
          )
        ) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Stringify a value for logging
   */
  private stringify(value: unknown): string {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }
}

/**
 * Create a pre-configured verifier with a logger
 */
export function createVerifier(logger: VerificationLogger): BusinessLogicVerifier {
  return new BusinessLogicVerifier(logger);
}

// ════════════════════════════════════════════════════════════════════════════
// SPEC HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Parse business logic checks from YAML spec format
 *
 * YAML format:
 *   businessLogic:
 *     - function: canVerifyLogs
 *       args: { role: "MANAGER" }
 *       expected: true
 *
 * @param spec - Parsed YAML businessLogic array
 * @returns Array of checks for verifyAll()
 */
export function parseSpecChecks(
  spec: Array<{
    function: string;
    args: Record<string, unknown>;
    expected: unknown;
  }>
): Array<{
  function: FunctionName;
  args: Record<string, unknown>;
  expected: unknown;
}> {
  return spec.map((check) => ({
    function: check.function as FunctionName,
    args: check.args,
    expected: check.expected,
  }));
}
