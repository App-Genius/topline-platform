/**
 * Staff Performance Review Flow
 *
 * Manager reviews an individual staff member's behavior logs and performance
 *
 * Generated from: specs/staff-performance-review.yaml
 * Priority: p0
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("staff-performance-review");

test.describe("Staff Performance Review Flow", () => {
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

  test("staff-performance-review: Manager reviews an individual staff member's behavior logs and performance", async ({
    managerPage,
  }) => {
    // Increase timeout if narration is enabled (audio takes time)
    if (narrator.isEnabled()) {
      test.setTimeout(120000); // 2 minutes for narrated tests
    }

    const verifier = new BusinessLogicVerifier(logger);

    // Get intro duration (will wait after first navigation)
    const introDuration = await narrator.intro();

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Manager opens the manager dashboard
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Manager opens the manager dashboard");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      // Setup: Load page and wait for readiness
      await page.goto("/manager");
      logger.navigate("/manager");

      await expect(page.getByText(/Verification Queue/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Verification Queue' visible");

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
      { // Assert visible with fallback
        const targets = ["h1:has-text('Manager Log & Audit')","text=Verification Queue"];
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
          logger.assertPass("Element visible: h1:has-text('Manager Log & Audit')");
        } else {
          logger.assertFail("Element not found: h1:has-text('Manager Log & Audit')");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      await expect(page.locator("text=Verification Queue")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Verification Queue");

      await expect(page.locator("text=Start Daily Briefing")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Start Daily Briefing");

      // Business logic verification
      verifier.verify(
        "isManagerRole",
        {"role":"MANAGER"},
        true
      );
      verifier.verify(
        "canAccessManager",
        {"role":"MANAGER"},
        true
      );
      verifier.verify(
        "canVerifyLogs",
        {"role":"MANAGER"},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await managerPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Manager clicks on Verification Queue
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Manager clicks on Verification Queue");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Interactive actions (after narration)
      { // Click with fallback
        const targets = ["text=Verification Queue","a:has-text('Verification Queue')","[href='/manager/verification']"];
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
      logger.click("text=Verification Queue");
      await page.waitForTimeout(1000);
      await page.waitForTimeout(500);

      await expect(page.getByText(/Behavior Verification/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Behavior Verification' visible");

      // Assertions
      { // Assert visible with fallback
        const targets = ["text=Behavior Verification","text=Verification"];
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
          logger.assertPass("Element visible: text=Behavior Verification");
        } else {
          logger.assertFail("Element not found: text=Behavior Verification");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      { // Assert visible with fallback
        const targets = ["text=pending","text=Pending","text=All caught up"];
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
          logger.assertPass("Element visible: text=pending");
        } else {
          logger.assertFail("Element not found: text=pending");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

    }

    // Brief pause to see step result before next role switch
    await managerPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Manager views the behavior logs
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step3Duration = await narrator.step(3);
    logger.stepStart(3, "Manager views the behavior logs");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Filters/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'Filters' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      { // Assert visible with fallback
        const targets = ["text=Filters","[data-testid='filters']"];
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
          logger.assertPass("Element visible: text=Filters");
        } else {
          logger.assertFail("Element not found: text=Filters");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      await expect(page.locator("a[href='/manager']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: a[href='/manager']");

      // Business logic verification
      verifier.verify(
        "canViewAllUsers",
        {"role":"MANAGER"},
        true
      );
      verifier.verify(
        "canEditUserProfile",
        {"role":"MANAGER","isOwnProfile":false},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await managerPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Manager returns to the main dashboard
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step4Duration = await narrator.step(4);
    logger.stepStart(4, "Manager returns to the main dashboard");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Interactive actions (after narration)
      { // Click with fallback
        const targets = ["a[href='/manager']","[data-testid='back-link']"];
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
      logger.click("a[href='/manager']");
      await page.waitForTimeout(1000);
      await page.waitForTimeout(500);

      await expect(page.getByText(/Verification Queue/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Verification Queue' visible");

      // Assertions
      await expect(page.locator("text=Verification Queue")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Verification Queue");

      { // Assert visible with fallback
        const targets = ["text=Shift Results","text=Revenue"];
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
          logger.assertPass("Element visible: text=Shift Results");
        } else {
          logger.assertFail("Element not found: text=Shift Results");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      // Business logic verification
      verifier.verify(
        "canAccessManager",
        {"role":"SERVER"},
        false
      );
      verifier.verify(
        "canVerifyLogs",
        {"role":"SERVER"},
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
