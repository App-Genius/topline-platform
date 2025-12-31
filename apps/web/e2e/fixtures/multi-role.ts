/**
 * Multi-Role Fixtures for E2E Testing
 *
 * Provides staffPage, managerPage, adminPage fixtures for testing
 * multi-role workflows like "Staff logs → Manager verifies → Staff sees result"
 *
 * Each role gets an isolated browser context with proper session tokens.
 * Uses actual database IDs from the seeded test database.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/multi-role';
 *
 *   test('multi-role flow', async ({ staffPage, managerPage }) => {
 *     await staffPage.goto('/staff');
 *     await managerPage.goto('/manager/verification');
 *   });
 */

import { test as base, expect, Page, BrowserContext } from "@playwright/test";
import { SignJWT } from "jose";
import { CLICK_VISUALIZER_SCRIPT } from "../utils/click-visualizer";

// Session secret - must match lib/auth/session.ts
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "topline-dev-secret-change-in-production-min-32-chars"
);
const SESSION_COOKIE = "topline_session";

// Helper to create a test session token
async function createTestSessionToken(payload: {
  userId: string;
  email: string;
  orgId: string;
  roleType: string;
  permissions: string[];
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SESSION_SECRET);
}

// ════════════════════════════════════════════════════════════════════════════
// TEST USERS - From AC Hotel seed (npm run db:seed:ac-hotel)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Organization: AC Hotel
 * These IDs are stable from the seed - if you re-seed, they regenerate.
 * For CI, ensure database is seeded before running tests.
 */
const AC_HOTEL_ORG = {
  id: "cmjtia41t0000p4ag1ylq1zrw",
  name: "AC Hotel",
};

/**
 * Staff User - Server role with basic permissions
 * Can log behaviors, view own stats
 */
export const staffUser = {
  id: "cmjtia4al000np4ag3j61vq4c", // Sam Server from AC Hotel seed
  email: "sam@achotel.com",
  name: "Sam Server",
  roleType: "SERVER",
  permissions: ["read:own", "write:behaviors"],
  orgId: AC_HOTEL_ORG.id,
};

/**
 * Manager User - Can verify behaviors, run briefings, manage staff
 * This is Sarah Manager from the original fixtures
 */
export const managerUser = {
  id: "cmjtia4ak000mp4agzwakylgo",
  email: "sarah@achotel.com",
  name: "Sarah Manager",
  roleType: "MANAGER",
  permissions: ["read", "write", "manage", "verify:behaviors"],
  orgId: AC_HOTEL_ORG.id,
};

/**
 * Admin User - Full permissions, can configure organization
 */
export const adminUser = {
  id: "cmjtia4aj000lp4agb2k8n9f3", // Admin from AC Hotel seed
  email: "admin@achotel.com",
  name: "AC Admin",
  roleType: "ADMIN",
  permissions: ["*"],
  orgId: AC_HOTEL_ORG.id,
};

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Create authenticated page for a role
// ════════════════════════════════════════════════════════════════════════════

interface RoleUser {
  id: string;
  email: string;
  name: string;
  roleType: string;
  permissions: string[];
  orgId: string;
}

async function createAuthenticatedPage(
  context: BrowserContext,
  user: RoleUser
): Promise<Page> {
  const page = await context.newPage();

  // Inject click visualizer for visual test recordings
  await page.addInitScript(CLICK_VISUALIZER_SCRIPT);

  // Create session token for this user
  const sessionToken = await createTestSessionToken({
    userId: user.id,
    email: user.email,
    orgId: user.orgId,
    roleType: user.roleType,
    permissions: user.permissions,
  });

  // Set session cookie
  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  return page;
}

// ════════════════════════════════════════════════════════════════════════════
// MULTI-ROLE FIXTURES
// ════════════════════════════════════════════════════════════════════════════

type MultiRoleFixtures = {
  staffPage: Page;
  managerPage: Page;
  adminPage: Page;
  staffContext: BrowserContext;
  managerContext: BrowserContext;
  adminContext: BrowserContext;
};

/**
 * Extended test with multi-role fixtures.
 *
 * Each role gets its own browser context (isolated cookies/session).
 * This allows testing workflows that span multiple user roles.
 *
 * Example:
 *   test('staff logs, manager verifies', async ({ staffPage, managerPage }) => {
 *     // Staff logs a behavior
 *     await staffPage.goto('/staff');
 *     await staffPage.click('[data-testid="log-behavior"]');
 *
 *     // Manager verifies it
 *     await managerPage.goto('/manager/verification');
 *     await managerPage.click('[data-testid="verify-button"]');
 *
 *     // Staff sees it verified
 *     await staffPage.reload();
 *     await expect(staffPage.locator('[data-testid="verified-badge"]')).toBeVisible();
 *   });
 */
export const test = base.extend<MultiRoleFixtures>({
  // Staff context - isolated session for staff user
  staffContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  // Manager context - isolated session for manager user
  managerContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  // Admin context - isolated session for admin user
  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  // Staff page with authentication
  staffPage: async ({ staffContext }, use) => {
    const page = await createAuthenticatedPage(staffContext, staffUser);
    await use(page);
  },

  // Manager page with authentication
  managerPage: async ({ managerContext }, use) => {
    const page = await createAuthenticatedPage(managerContext, managerUser);
    await use(page);
  },

  // Admin page with authentication
  adminPage: async ({ adminContext }, use) => {
    const page = await createAuthenticatedPage(adminContext, adminUser);
    await use(page);
  },
});

export { expect };

// Re-export users for use in specs/verifiers
export { AC_HOTEL_ORG };
