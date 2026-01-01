/**
 * Permission Denied Flow
 *
 * Staff cannot access manager or admin areas
 *
 * Generated from: specs/permission-denied.yaml
 * Priority: p1
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("permission-denied");

test.describe("Permission Denied Flow", () => {
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

  test("permission-denied: Staff cannot access manager or admin areas", async ({
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
    // STEP 1: Staff opens their dashboard
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Staff opens their dashboard");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Setup: Load page and wait for readiness
      await page.goto("/staff");
      logger.navigate("/staff");

      await expect(page.getByText(/Log Behavior/i)).toBeVisible({ timeout: 10000 });
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
      await expect(page.locator("text=Log Behavior")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Log Behavior");

      // Business logic verification
      verifier.verify(
        "isStaffRole",
        {"role":"SERVER"},
        true
      );
      verifier.verify(
        "canAccessAdmin",
        {"role":"SERVER"},
        false
      );

    }

    // Brief pause to see step result before next role switch
    await staffPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Staff page shows limited options
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Staff page shows limited options");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Recommend wine pairing/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Recommend wine pairing' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("button:has-text('Recommend wine pairing')")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: button:has-text('Recommend wine pairing')");

      // Business logic verification
      verifier.verify(
        "canVerifyLogs",
        {"role":"SERVER"},
        false
      );
      verifier.verify(
        "isManagerRole",
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
