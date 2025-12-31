import { test, expect } from "../fixtures";

/**
 * Daily Briefing Flow - Complete User Journey
 *
 * This test captures the entire manager briefing flow with video recording.
 * Videos are saved to test-results/ for visual review.
 */
test.describe("Daily Briefing Flow - Video Capture", () => {

  test("complete briefing journey: overview → VIP → kitchen → upsell → training → attendance", async ({ page }) => {
    // Start at briefing page
    await page.goto("/manager/briefing");

    // Wait for content to load
    await expect(page.getByRole("heading", { name: /daily briefing/i })).toBeVisible();
    await page.waitForTimeout(1000); // Pause for video clarity

    // Step 1: Overview
    await expect(page.getByRole("tab", { name: /overview/i })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText(/today at a glance/i)).toBeVisible();
    await page.waitForTimeout(1500);

    // Step 2: VIP Guests
    await page.getByRole("tab", { name: /vip/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole("tabpanel")).toBeVisible();
    await page.waitForTimeout(1500);

    // Step 3: Kitchen Updates
    await page.getByRole("tab", { name: /kitchen/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole("tabpanel")).toBeVisible();
    await page.waitForTimeout(1500);

    // Step 4: Upsell Focus
    await page.getByRole("tab", { name: /upsell/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole("tabpanel")).toBeVisible();
    await page.waitForTimeout(1500);

    // Step 5: Training Topic
    await page.getByRole("tab", { name: /training/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
    await page.waitForTimeout(1500);

    // Step 6: Attendance
    await page.getByRole("tab", { name: /attendance/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole("heading", { name: /attendance|team/i })).toBeVisible();
    await page.waitForTimeout(1500);

    // Mark team members present
    const checkboxes = page.locator('[role="checkbox"], input[type="checkbox"]');
    const count = await checkboxes.count();

    for (let i = 0; i < Math.min(3, count); i++) {
      await checkboxes.nth(i).click();
      await page.waitForTimeout(300);
    }

    // Complete the briefing
    const completeButton = page.getByRole("button", { name: /complete briefing/i });
    await expect(completeButton).toBeEnabled();
    await page.waitForTimeout(500);

    await completeButton.click();

    // Wait for completion confirmation
    await expect(page.getByText(/briefing complete|completed|success/i)).toBeVisible();
    await page.waitForTimeout(2000); // Hold on success state
  });

  test("manager navigation: briefing → dashboard → back", async ({ page }) => {
    // Start at manager dashboard
    await page.goto("/manager");
    await page.waitForTimeout(1000);

    // Navigate to briefing
    const briefingLink = page.getByRole("link", { name: /briefing|daily/i });
    if (await briefingLink.count() > 0) {
      await briefingLink.first().click();
      await page.waitForURL(/\/manager\/briefing/);
      await page.waitForTimeout(1500);
    } else {
      // Direct navigation
      await page.goto("/manager/briefing");
      await page.waitForTimeout(1500);
    }

    // Verify briefing loaded
    await expect(page.getByRole("heading", { name: /daily briefing/i })).toBeVisible();
    await page.waitForTimeout(1000);

    // Navigate back to manager dashboard
    const backLink = page.getByRole("link", { name: /back|manager|dashboard/i });
    if (await backLink.count() > 0) {
      await backLink.first().click();
      await page.waitForURL(/\/manager/);
      await page.waitForTimeout(1500);
    }
  });
});

test.describe("Setup Flow - Video Capture", () => {

  test("baseline setup form interaction", async ({ page }) => {
    await page.goto("/setup");
    await page.waitForTimeout(1000);

    // Verify setup page loaded
    await expect(page.getByRole("heading", { name: /baseline/i })).toBeVisible();
    await page.waitForTimeout(500);

    // Find form fields
    const revenueInput = page.getByLabel(/revenue/i).or(page.locator('input[name*="revenue"]'));
    const daysInput = page.getByLabel(/days/i).or(page.locator('input[name*="days"]'));

    // Fill in baseline data (if inputs exist)
    if (await revenueInput.count() > 0) {
      await revenueInput.first().fill("1200000");
      await page.waitForTimeout(300);
    }

    if (await daysInput.count() > 0) {
      await daysInput.first().fill("365");
      await page.waitForTimeout(300);
    }

    await page.waitForTimeout(1500);

    // Look for Start Tracking button
    const startButton = page.getByRole("button", { name: /start tracking/i });
    await expect(startButton).toBeVisible();
    await page.waitForTimeout(1000);
  });
});

test.describe("Page Tour - Video Capture", () => {

  test("tour all main pages", async ({ page }) => {
    // Setup page
    await page.goto("/setup");
    await expect(page.getByRole("heading", { name: /baseline/i })).toBeVisible();
    await page.waitForTimeout(2000);

    // Manager briefing
    await page.goto("/manager/briefing");
    await expect(page.getByRole("heading", { name: /daily briefing/i })).toBeVisible();
    await page.waitForTimeout(2000);

    // Manager dashboard
    await page.goto("/manager");
    await page.waitForTimeout(2000);

    // Admin page
    await page.goto("/admin");
    await page.waitForTimeout(2000);

    // Staff page
    await page.goto("/staff");
    await page.waitForTimeout(2000);

    // Scoreboard
    await page.goto("/scoreboard");
    await page.waitForTimeout(2000);
  });
});
