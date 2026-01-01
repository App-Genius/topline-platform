/**
 * Staff Dashboard Flow
 *
 * Staff views their stats, history, and accesses AI coaching
 *
 * Generated from: specs/staff-dashboard.yaml
 * Priority: p0
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("staff-dashboard");

test.describe("Staff Dashboard Flow", () => {
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

  test("staff-dashboard: Staff views their stats, history, and accesses AI coaching", async ({
    staffPage,
  }) => {
    // Increase timeout if narration is enabled (audio takes time)
    if (narrator.isEnabled()) {
      test.setTimeout(120000); // 2 minutes for narrated tests
    }

    const verifier = new BusinessLogicVerifier(logger);

    // Get intro duration (will wait after first navigation)
    const introDuration = await narrator.intro();

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Staff opens their personal dashboard
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Staff opens their personal dashboard");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Setup: Load page and wait for readiness
      await page.goto("/staff");
      logger.navigate("/staff");

      await expect(page.getByText(/Log Behavior/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Log Behavior' visible");

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
        const targets = ["text=Sam Server","[data-testid='user-header']","text=Sam"];
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
          logger.assertPass("Element visible: text=Sam Server");
        } else {
          logger.assertFail("Element not found: text=Sam Server");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      { // Assert visible with fallback
        const targets = ["text=My Actions","text=MY ACTIONS"];
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
          logger.assertPass("Element visible: text=My Actions");
        } else {
          logger.assertFail("Element not found: text=My Actions");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      // Business logic verification
      verifier.verify(
        "isStaffRole",
        {"role":"SERVER"},
        true
      );
      verifier.verify(
        "canAccessFeature",
        {"role":"SERVER","feature":"behavior-logging"},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await staffPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Staff reviews their personal statistics
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Staff reviews their personal statistics");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/My Actions/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'My Actions' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("text=My Actions")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=My Actions");

      await expect(page.locator("text=Streak")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Streak");

      { // Assert visible with fallback
        const targets = ["text=Avg Check","text=AVG CHECK"];
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
          logger.assertPass("Element visible: text=Avg Check");
        } else {
          logger.assertFail("Element not found: text=Avg Check");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      // Business logic verification
      verifier.verify(
        "isManagerRole",
        {"role":"SERVER"},
        false
      );
      verifier.verify(
        "isAdminRole",
        {"role":"SERVER"},
        false
      );

    }

    // Brief pause to see step result before next role switch
    await staffPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Staff notices the AI coach tip banner
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step3Duration = await narrator.step(3);
    logger.stepStart(3, "Staff notices the AI coach tip banner");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/AI Coach Tip/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'AI Coach Tip' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      { // Assert visible with fallback
        const targets = ["text=AI Coach Tip","text=AI Coach"];
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
          logger.assertPass("Element visible: text=AI Coach Tip");
        } else {
          logger.assertFail("Element not found: text=AI Coach Tip");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      { // Assert visible with fallback
        const targets = ["text=Tap for more tips","text=more tips"];
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
          logger.assertPass("Element visible: text=Tap for more tips");
        } else {
          logger.assertFail("Element not found: text=Tap for more tips");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

    }

    // Brief pause to see step result before next role switch
    await staffPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Staff taps to open full AI coach view
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step4Duration = await narrator.step(4);
    logger.stepStart(4, "Staff taps to open full AI coach view");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Interactive actions (after narration)
      { // Click with fallback
        const targets = ["text=Tap for more tips","[data-testid='ai-coach-banner']","text=AI Coach Tip"];
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
      logger.click("text=Tap for more tips");
      await page.waitForTimeout(500);
      await page.waitForTimeout(500);

      await expect(page.getByText(/AI Coach/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'AI Coach' visible");

      // Assertions
      { // Assert visible with fallback
        const targets = ["text=Focus for Today","text=Today"];
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
          logger.assertPass("Element visible: text=Focus for Today");
        } else {
          logger.assertFail("Element not found: text=Focus for Today");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      { // Assert visible with fallback
        const targets = ["text=Micro-Training","text=Training"];
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
          logger.assertPass("Element visible: text=Micro-Training");
        } else {
          logger.assertFail("Element not found: text=Micro-Training");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      await expect(page.locator("text=Close")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Close");

    }

    // Brief pause to see step result before next role switch
    await staffPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Staff closes AI coach and returns to dashboard
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step5Duration = await narrator.step(5);
    logger.stepStart(5, "Staff closes AI coach and returns to dashboard");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Interactive actions (after narration)
      await page.locator("text=Close").click();
      logger.click("text=Close");
      await page.waitForTimeout(500);
      await page.waitForTimeout(500);

      await expect(page.getByText(/Log Behavior/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'Log Behavior' visible");

      // Assertions
      await expect(page.locator("text=Log Behavior")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Log Behavior");

      await expect(page.locator("text=My Actions")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=My Actions");

      // Business logic verification
      verifier.verify(
        "canAccessFeature",
        {"role":"SERVER","feature":"behavior-logging"},
        true
      );
      verifier.verify(
        "canAccessFeature",
        {"role":"SERVER","feature":"admin"},
        false
      );
      verifier.verify(
        "canAccessFeature",
        {"role":"SERVER","feature":"settings"},
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
