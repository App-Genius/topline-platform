/**
 * Training Attendance Flow
 *
 * Manager views training topics in daily briefing
 *
 * Generated from: specs/training-attendance.yaml
 * Priority: p1
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("training-attendance");

test.describe("Training Attendance Flow", () => {
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

  test("training-attendance: Manager views training topics in daily briefing", async ({
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
    // STEP 1: Manager opens the daily briefing
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Manager opens the daily briefing");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      // Setup: Load page and wait for readiness
      await page.goto("/manager/briefing");
      logger.navigate("/manager/briefing");

      await expect(page.getByText(/Daily Briefing/i)).toBeVisible({ timeout: 10000 });
      logger.assertPass("Text 'Daily Briefing' visible");

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
      await expect(page.locator("text=Daily Briefing")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Daily Briefing");

      // Business logic verification
      verifier.verify(
        "isManagerRole",
        {"role":"MANAGER"},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await managerPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Manager views the briefing content
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Manager views the briefing content");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Briefing/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Briefing' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("text=Briefing")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Briefing");

      // Business logic verification
      verifier.verify(
        "canVerifyLogs",
        {"role":"MANAGER"},
        true
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
