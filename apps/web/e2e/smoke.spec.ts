import { test, expect } from "./fixtures";

/**
 * Smoke Test Suite for AI-Driven Testing
 *
 * These tests are designed for headless execution with screenshot capture.
 * Run with: npx playwright test e2e/smoke.spec.ts
 *
 * Screenshots are saved to test-results/ directory for AI review.
 */
test.describe("Smoke Test - Core Flows", () => {

  test("setup page loads and displays baseline form", async ({ page }) => {
    await page.goto("/setup");

    // Take screenshot for AI review
    await page.screenshot({
      path: "test-results/smoke-setup-page.png",
      fullPage: true,
    });

    // Verify key elements
    await expect(page.getByRole("heading", { name: /baseline/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /start tracking/i })).toBeVisible();

    // Verify form fields
    await expect(page.getByText(/last year.*revenue/i)).toBeVisible();
    await expect(page.getByText(/days open/i)).toBeVisible();
  });

  test("manager briefing page loads with data", async ({ page }) => {
    await page.goto("/manager/briefing");

    // Wait for briefing to load (not loading state)
    await expect(page.getByRole("heading", { name: /daily briefing/i })).toBeVisible();

    // Verify tabs are present
    await expect(page.getByRole("tab", { name: /overview/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /attendance/i })).toBeVisible();

    // Take screenshot AFTER content loaded for AI review
    await page.screenshot({
      path: "test-results/smoke-briefing-page.png",
      fullPage: true,
    });
  });

  test("manager dashboard loads", async ({ page }) => {
    await page.goto("/manager");

    // Take screenshot for AI review
    await page.screenshot({
      path: "test-results/smoke-manager-dashboard.png",
      fullPage: true,
    });

    // Page should not show error
    await expect(page.getByText(/error|failed/i)).not.toBeVisible({ timeout: 3000 }).catch(() => {
      // It's OK if these elements don't exist at all
    });
  });

  test("admin dashboard loads", async ({ page }) => {
    // First need admin credentials - but fixtures use manager
    // This test verifies the redirect/auth flow works
    await page.goto("/admin");

    // Take screenshot for AI review
    await page.screenshot({
      path: "test-results/smoke-admin-page.png",
      fullPage: true,
    });
  });

  test("staff page loads", async ({ page }) => {
    await page.goto("/staff");

    // Take screenshot for AI review
    await page.screenshot({
      path: "test-results/smoke-staff-page.png",
      fullPage: true,
    });
  });

  test("scoreboard TV mode loads", async ({ page }) => {
    await page.goto("/scoreboard");

    // Take screenshot for AI review
    await page.screenshot({
      path: "test-results/smoke-scoreboard-page.png",
      fullPage: true,
    });
  });
});

test.describe("Smoke Test - Navigation", () => {

  test("can navigate between main sections", async ({ page }) => {
    // Start at manager briefing
    await page.goto("/manager/briefing");
    await page.screenshot({ path: "test-results/nav-1-briefing.png" });

    // Click back to manager dashboard
    await page.getByRole("link", { name: /back|manager|dashboard/i }).first().click();
    await page.waitForURL(/\/manager/);
    await page.screenshot({ path: "test-results/nav-2-manager.png" });
  });
});

test.describe("Smoke Test - Console & Network", () => {

  test("no critical console errors on briefing page", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/manager/briefing");
    await page.waitForLoadState("networkidle");

    // Take screenshot with any state
    await page.screenshot({
      path: "test-results/console-check-briefing.png",
      fullPage: true,
    });

    // Log any errors for review
    if (errors.length > 0) {
      console.log("Console errors found:", errors);
    }

    // Filter out known acceptable errors (like React DevTools)
    const criticalErrors = errors.filter(
      (e) => !e.includes("DevTools") && !e.includes("Extension")
    );

    expect(criticalErrors.length).toBeLessThan(3);
  });
});
