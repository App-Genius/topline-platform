import { test, expect } from "../fixtures";
import { VerificationLogger } from "../utils/verification-logger";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Daily Briefing Flow - Complete User Journey with Verification Logging
 *
 * This test captures the entire manager briefing flow with:
 * - 1080p video recording (use --project=hq-recording)
 * - Visual click indicators (cursor + ripple effects)
 * - Verification logging (timestamps synced with video)
 *
 * Run with: npx playwright test e2e/flows/ --project=hq-recording
 */

const logger = new VerificationLogger();

test.describe("Daily Briefing Flow - High Quality Recording", () => {
  test.beforeEach(async () => {
    logger.start();
  });

  test.afterEach(async ({}, testInfo) => {
    // Save verification log alongside video
    const outputDir = testInfo.outputDir;
    const logPath = path.join(outputDir, "verifications.json");

    try {
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(logPath, logger.toJSON());
    } catch (error) {
      console.warn("Could not save verification log:", error);
    }
  });

  test("complete briefing journey: overview → VIP → kitchen → upsell → training → attendance", async ({
    page,
  }) => {
    // Navigate to briefing page
    await page.goto("/manager/briefing");
    logger.navigate("/manager/briefing");

    // Wait for content to load
    await expect(page.getByRole("heading", { name: /daily briefing/i })).toBeVisible();
    logger.assertPass("Daily Briefing heading is visible");
    await page.waitForTimeout(1500);

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: OVERVIEW
    // ═══════════════════════════════════════════════════════════════
    logger.stepStart(1, "Overview");

    await expect(page.getByRole("tab", { name: /overview/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    logger.assertPass("Overview tab is selected by default");

    await expect(page.getByText(/today at a glance/i)).toBeVisible();
    logger.assertPass("'Today at a Glance' content visible");

    await expect(page.getByText(/reservations/i)).toBeVisible();
    logger.assertPass("Reservations section visible");
    await page.waitForTimeout(2000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: VIP GUESTS
    // ═══════════════════════════════════════════════════════════════
    logger.stepStart(2, "VIP Guests");

    await page.getByRole("tab", { name: /vip/i }).click();
    logger.click("VIP Guests tab");
    await page.waitForTimeout(500);

    await expect(page.getByRole("tab", { name: /vip/i })).toHaveAttribute("aria-selected", "true");
    logger.assertPass("VIP tab is now selected");

    await expect(page.getByRole("tabpanel")).toBeVisible();
    logger.assertPass("VIP Guests panel is displayed");
    await page.waitForTimeout(2000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: KITCHEN UPDATES
    // ═══════════════════════════════════════════════════════════════
    logger.stepStart(3, "Kitchen Updates");

    await page.getByRole("tab", { name: /kitchen/i }).click();
    logger.click("Kitchen Updates tab");
    await page.waitForTimeout(500);

    await expect(page.getByRole("tab", { name: /kitchen/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    logger.assertPass("Kitchen tab is now selected");

    await expect(page.getByRole("tabpanel")).toBeVisible();
    logger.assertPass("Kitchen Updates panel is displayed");
    await page.waitForTimeout(2000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: UPSELL FOCUS
    // ═══════════════════════════════════════════════════════════════
    logger.stepStart(4, "Upsell Focus");

    await page.getByRole("tab", { name: /upsell/i }).click();
    logger.click("Upsell Focus tab");
    await page.waitForTimeout(500);

    await expect(page.getByRole("tab", { name: /upsell/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    logger.assertPass("Upsell tab is now selected");

    await expect(page.getByRole("tabpanel")).toBeVisible();
    logger.assertPass("Upsell Focus panel is displayed");
    await page.waitForTimeout(2000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: TRAINING TOPIC
    // ═══════════════════════════════════════════════════════════════
    logger.stepStart(5, "Training Topic");

    await page.getByRole("tab", { name: /training/i }).click();
    logger.click("Training Topic tab");
    await page.waitForTimeout(500);

    await expect(page.getByRole("tab", { name: /training/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    logger.assertPass("Training tab is now selected");

    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
    logger.assertPass("Training topic heading is visible");
    await page.waitForTimeout(2000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 6: ATTENDANCE
    // ═══════════════════════════════════════════════════════════════
    logger.stepStart(6, "Attendance");

    await page.getByRole("tab", { name: /attendance/i }).click();
    logger.click("Attendance tab");
    await page.waitForTimeout(500);

    await expect(page.getByRole("tab", { name: /attendance/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    logger.assertPass("Attendance tab is now selected");

    await expect(page.getByRole("heading", { name: /attendance|team/i })).toBeVisible();
    logger.assertPass("Attendance heading is visible");
    await page.waitForTimeout(1000);

    // Mark team members present
    const checkboxes = page.locator('[role="checkbox"], input[type="checkbox"]');
    const count = await checkboxes.count();
    logger.log({
      type: "assertion",
      description: `Found ${count} team member checkboxes`,
      status: "info",
    });

    for (let i = 0; i < Math.min(3, count); i++) {
      await checkboxes.nth(i).click();
      logger.click(`Team member ${i + 1} checkbox`);
      await page.waitForTimeout(400);
    }

    logger.assertPass("Marked team members as present");
    await page.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // COMPLETE BRIEFING
    // ═══════════════════════════════════════════════════════════════
    logger.log({
      type: "step",
      description: "Final: Complete Briefing",
      status: "info",
    });

    const completeButton = page.getByRole("button", { name: /complete briefing/i });
    await expect(completeButton).toBeEnabled();
    logger.assertPass("Complete Briefing button is enabled");
    await page.waitForTimeout(500);

    await completeButton.click();
    logger.click("Complete Briefing button");

    // Wait for completion confirmation
    await expect(page.getByText(/briefing complete|completed|success/i)).toBeVisible();
    logger.assertPass("Success confirmation displayed");
    await page.waitForTimeout(2500);

    // Log final summary
    const summary = logger.getSummary();
    console.log(
      `\n[Verification Summary] Total: ${summary.total}, Passed: ${summary.passed}, Duration: ${summary.duration}ms\n`
    );
  });
});

test.describe("Setup Flow - High Quality Recording", () => {
  test.beforeEach(async () => {
    logger.start();
  });

  test.afterEach(async ({}, testInfo) => {
    const outputDir = testInfo.outputDir;
    const logPath = path.join(outputDir, "verifications.json");

    try {
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(logPath, logger.toJSON());
    } catch (error) {
      console.warn("Could not save verification log:", error);
    }
  });

  test("baseline setup form interaction", async ({ page }) => {
    await page.goto("/setup");
    logger.navigate("/setup");
    await page.waitForTimeout(1000);

    await expect(page.getByRole("heading", { name: /baseline/i })).toBeVisible();
    logger.assertPass("Baseline heading is visible");

    // Find form fields
    const revenueInput = page.getByLabel(/revenue/i).or(page.locator('input[name*="revenue"]'));
    const daysInput = page.getByLabel(/days/i).or(page.locator('input[name*="days"]'));

    // Fill in baseline data (if inputs exist)
    if ((await revenueInput.count()) > 0) {
      await revenueInput.first().fill("1200000");
      logger.log({
        type: "action",
        description: "Entered revenue: $1,200,000",
        status: "info",
      });
      await page.waitForTimeout(300);
    }

    if ((await daysInput.count()) > 0) {
      await daysInput.first().fill("365");
      logger.log({
        type: "action",
        description: "Entered days open: 365",
        status: "info",
      });
      await page.waitForTimeout(300);
    }

    await page.waitForTimeout(1500);

    const startButton = page.getByRole("button", { name: /start tracking/i });
    await expect(startButton).toBeVisible();
    logger.assertPass("Start Tracking button is visible");
    await page.waitForTimeout(1000);
  });
});

