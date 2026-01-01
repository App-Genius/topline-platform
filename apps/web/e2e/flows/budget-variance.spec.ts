/**
 * Budget Variance Flow
 *
 * Admin reviews budget vs actual spending and revenue
 *
 * Generated from: specs/budget-variance.yaml
 * Priority: p1
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("budget-variance");

test.describe("Budget Variance Flow", () => {
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

  test("budget-variance: Admin reviews budget vs actual spending and revenue", async ({
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
        const targets = ["a[href='/admin/budget']","text=Budget"];
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
          logger.assertPass("Element visible: a[href='/admin/budget']");
        } else {
          logger.assertFail("Element not found: a[href='/admin/budget']");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      // Business logic verification
      verifier.verify(
        "isAdminRole",
        {"role":"ADMIN"},
        true
      );
      verifier.verify(
        "canAccessAdmin",
        {"role":"ADMIN"},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await adminPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Admin clicks on Budget in the sidebar
    // Role: ADMIN
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Admin clicks on Budget in the sidebar");
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
        const targets = ["a[href='/admin/budget']","text=Budget"];
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
      logger.click("a[href='/admin/budget']");
      await page.waitForTimeout(2000);
      await page.waitForTimeout(500);

      await expect(page.getByText(/Budget Dashboard/i)).toBeVisible({ timeout: 10000 });
      logger.assertPass("Text 'Budget Dashboard' visible");

      // Assertions
      await expect(page.locator("text=Budget Dashboard")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Budget Dashboard");

      // Business logic verification
      verifier.verify(
        "calculateVariance",
        {"actual":100000,"target":95000},
        5.26
      );
      verifier.verify(
        "calculateProgress",
        {"current":75000,"target":100000},
        75
      );

    }

    // Brief pause to see step result before next role switch
    await adminPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Admin sees the admin sidebar navigation options
    // Role: ADMIN
    // ═══════════════════════════════════════════════════════════════
    const step3Duration = await narrator.step(3);
    logger.stepStart(3, "Admin sees the admin sidebar navigation options");
    logger.log({ type: "action", description: "Role: ADMIN", status: "info" });

    {
      const page = adminPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Users/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Users' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      { // Assert visible with fallback
        const targets = ["a[href='/admin/users']","text=Users"];
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
          logger.assertPass("Element visible: a[href='/admin/users']");
        } else {
          logger.assertFail("Element not found: a[href='/admin/users']");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      { // Assert visible with fallback
        const targets = ["a[href='/admin/settings']","text=Settings"];
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
          logger.assertPass("Element visible: a[href='/admin/settings']");
        } else {
          logger.assertFail("Element not found: a[href='/admin/settings']");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      // Business logic verification
      verifier.verify(
        "calculateAverageCheck",
        {"revenue":10000,"covers":200},
        50
      );

    }

    // Brief pause to see step result before next role switch
    await adminPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Admin verifies role-based access control
    // Role: ADMIN
    // ═══════════════════════════════════════════════════════════════
    const step4Duration = await narrator.step(4);
    logger.stepStart(4, "Admin verifies role-based access control");
    logger.log({ type: "action", description: "Role: ADMIN", status: "info" });

    {
      const page = adminPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Settings/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'Settings' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("a[href='/admin']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: a[href='/admin']");

      await expect(page.locator("a[href='/admin/settings']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: a[href='/admin/settings']");

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
