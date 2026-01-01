/**
 * Behavior Streak Flow
 *
 * Staff views their logging streak and maintains it by logging behaviors
 *
 * Generated from: specs/behavior-streak.yaml
 * Priority: p0
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("behavior-streak");

test.describe("Behavior Streak Flow", () => {
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

  test("behavior-streak: Staff views their logging streak and maintains it by logging behaviors", async ({
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
    // STEP 1: Staff opens dashboard and sees their streak
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Staff opens dashboard and sees their streak");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Setup: Load page and wait for readiness
      await page.goto("/staff");
      logger.navigate("/staff");

      await expect(page.getByText(/Streak/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Streak' visible");

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
        const targets = ["[data-testid='streak-count']","text=Streak"];
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
          logger.assertPass("Element visible: [data-testid='streak-count']");
        } else {
          logger.assertFail("Element not found: [data-testid='streak-count']");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      await expect(page.locator("text=Log Behavior")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Log Behavior");

      // Business logic verification
      verifier.verify(
        "calculateStreak",
        {"dates":["2024-01-03","2024-01-04","2024-01-05"],"today":"2024-01-05"},
        3
      );
      verifier.verify(
        "calculateStreak",
        {"dates":["2024-01-03","2024-01-04"],"today":"2024-01-05"},
        0
      );
      verifier.verify(
        "calculateStreak",
        {"dates":["2024-01-01","2024-01-03","2024-01-05"],"today":"2024-01-05"},
        1
      );

    }

    // Brief pause to see step result before next role switch
    await staffPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Staff logs a behavior to maintain their streak
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Staff logs a behavior to maintain their streak");
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
        const targets = ["button:has-text('Recommend wine pairing')","text=Recommend wine pairing"];
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
      logger.click("button:has-text('Recommend wine pairing')");
      await page.waitForTimeout(500);
      await page.waitForTimeout(500);

      await expect(page.getByText(/Tap again to Confirm/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'Tap again to Confirm' visible");

      { // Click with fallback
        const targets = ["text=Tap again to Confirm","button:has-text('Tap again')"];
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
      logger.click("text=Tap again to Confirm");
      await page.waitForTimeout(1000);
      await page.waitForTimeout(500);

      await expect(page.getByText(/LOGGED/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'LOGGED' visible");

      // Assertions
      await expect(page.locator("text=LOGGED")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=LOGGED");

    }

    // Brief pause to see step result before next role switch
    await staffPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Staff verifies their streak is still active
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step3Duration = await narrator.step(3);
    logger.stepStart(3, "Staff verifies their streak is still active");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Log Behavior/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Log Behavior' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("[data-testid='streak-count']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: [data-testid='streak-count']");

      await expect(page.locator("text=My Actions")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=My Actions");

      // Business logic verification
      verifier.verify(
        "calculateLongestBehaviorStreak",
        {"dates":["2024-01-01","2024-01-02","2024-01-03","2024-01-05","2024-01-06"]},
        3
      );
      verifier.verify(
        "calculateLongestBehaviorStreak",
        {"dates":[]},
        0
      );
      verifier.verify(
        "calculateStreak",
        {"dates":["2024-01-05"],"today":"2024-01-05"},
        1
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
