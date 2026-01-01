/**
 * Celebration Moment Flow
 *
 * Scoreboard celebrates team wins
 *
 * Generated from: specs/celebration-moment.yaml
 * Priority: p1
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("celebration-moment");

test.describe("Celebration Moment Flow", () => {
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

  test("celebration-moment: Scoreboard celebrates team wins", async ({
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
    // STEP 1: View the public scoreboard
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "View the public scoreboard");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Setup: Load page and wait for readiness
      await page.goto("/scoreboard");
      logger.navigate("/scoreboard");

      await expect(page.getByText(/Today's Revenue/i)).toBeVisible({ timeout: 10000 });
      logger.assertPass("Text 'Today's Revenue' visible");

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
      await expect(page.locator("text=Today's Revenue")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Today's Revenue");

      // Business logic verification
      verifier.verify(
        "calculateProgress",
        {"current":85,"target":100},
        85
      );

    }

    // Brief pause to see step result before next role switch
    await staffPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: View the team leaderboard
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "View the team leaderboard");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Team Behaviors/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Team Behaviors' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("text=Team Behaviors")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Team Behaviors");

      // Business logic verification
      verifier.verify(
        "calculateVariance",
        {"actual":110,"target":100},
        10
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
