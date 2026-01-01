/**
 * Trend Analysis Flow
 *
 * Admin views performance trends over time
 *
 * Generated from: specs/trend-analysis.yaml
 * Priority: p1
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("trend-analysis");

test.describe("Trend Analysis Flow", () => {
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

  test("trend-analysis: Admin views performance trends over time", async ({
    adminPage,
  }) => {
    // Increase timeout if narration is enabled (audio takes time)
    if (narrator.isEnabled()) {
      test.setTimeout(120000); // 2 minutes for narrated tests
    }

    const verifier = new BusinessLogicVerifier(logger);

    // Get intro duration (will wait after first navigation)
    const introDuration = await narrator.intro();

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Admin opens the admin dashboard
    // Role: ADMIN
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Admin opens the admin dashboard");
    logger.log({ type: "action", description: "Role: ADMIN", status: "info" });

    {
      const page = adminPage;

      // Setup: Load page and wait for readiness
      await page.goto("/admin");
      logger.navigate("/admin");

      await expect(page.getByText(/Admin Console/i)).toBeVisible({ timeout: 15000 });
      logger.assertPass("Text 'Admin Console' visible");

      // Wait for intro narration (user sees page while intro plays)
      const introMs = 0;
      if (introMs > 0) {
        await page.waitForTimeout(introMs);
      }

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("text=Admin Console")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Admin Console");

      { // Assert visible with fallback
        const targets = ["a[href='/admin/insights']","text=Insights"];
        let found = false;
        for (const sel of targets) {
          try {
            const el = page.locator(sel);
            if (await el.count() > 0) {
              await expect(el.first()).toBeVisible({ timeout: 3000 });
              found = true;
              break;
            }
          } catch { /* try next */ }
        }
        if (found) {
          logger.assertPass("Element visible: a[href='/admin/insights']");
        } else {
          logger.assertFail("Element not found: a[href='/admin/insights']");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      // Business logic verification
      verifier.verify(
        "isAdminRole",
        {"role":"ADMIN"},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await adminPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Admin clicks on Insights in the sidebar
    // Role: ADMIN
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Admin clicks on Insights in the sidebar");
    logger.log({ type: "action", description: "Role: ADMIN", status: "info" });

    {
      const page = adminPage;

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Interactive actions (after narration)
      { // Click with fallback
        const targets = ["a[href='/admin/insights']","text=Insights"];
        let found = false;
        for (const sel of targets) {
          try {
            const el = page.locator(sel);
            if (await el.count() > 0) {
              await el.first().click();
              found = true;
              break;
            }
          } catch { /* try next */ }
        }
        if (!found) throw new Error("Could not find element to click: " + targets.join(", "));
      }
      logger.click("a[href='/admin/insights']");
      await page.waitForTimeout(2000);
      await page.waitForTimeout(500);

      await expect(page.getByText(/Overall Health Score/i)).toBeVisible({ timeout: 10000 });
      logger.assertPass("Text 'Overall Health Score' visible");

      // Assertions
      await expect(page.locator("text=Overall Health Score")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Overall Health Score");

      // Business logic verification
      verifier.verify(
        "canAccessAdmin",
        {"role":"ADMIN"},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await adminPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Admin sees the available insight categories
    // Role: ADMIN
    // ═══════════════════════════════════════════════════════════════
    const step3Duration = await narrator.step(3);
    logger.stepStart(3, "Admin sees the available insight categories");
    logger.log({ type: "action", description: "Role: ADMIN", status: "info" });

    {
      const page = adminPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Improvement Opportunities/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Improvement Opportunities' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("text=Improvement Opportunities")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Improvement Opportunities");

      await expect(page.locator("text=Recommended Actions")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Recommended Actions");

      // Business logic verification
      verifier.verify(
        "calculateProgress",
        {"current":75,"target":100},
        75
      );

    }

    // Brief pause to see step result before next role switch
    await adminPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Admin can refresh the insights
    // Role: ADMIN
    // ═══════════════════════════════════════════════════════════════
    const step4Duration = await narrator.step(4);
    logger.stepStart(4, "Admin can refresh the insights");
    logger.log({ type: "action", description: "Role: ADMIN", status: "info" });

    {
      const page = adminPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Refresh Insights/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Refresh Insights' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("button:has-text('Refresh Insights')")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: button:has-text('Refresh Insights')");

      await expect(page.locator("text=Updated")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Updated");

      // Business logic verification
      verifier.verify(
        "canAccessAdmin",
        {"role":"SERVER"},
        false
      );
      verifier.verify(
        "canAccessAdmin",
        {"role":"MANAGER"},
        false
      );

    }

    // Final summary
    const summary = logger.getSummary();
    console.log(
      `\n[Verification Summary] Total: ${summary.total}, Passed: ${summary.passed}, Duration: ${summary.duration}ms\n`
    );

    const blSummary = verifier.getSummary();
    console.log(
      `[Business Logic] Total: ${blSummary.total}, Passed: ${blSummary.passed}, Failed: ${blSummary.failed}\n`
    );
  });
});
