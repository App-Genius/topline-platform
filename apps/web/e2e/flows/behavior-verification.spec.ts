/**
 * Behavior Verification Flow
 *
 * Complete multi-role flow: Staff logs behavior, Manager verifies, Staff sees verified result
 *
 * Generated from: specs/behavior-verification.yaml
 * Priority: p0
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("behavior-verification");

test.describe("Behavior Verification Flow", () => {
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

  test("behavior-verification: Complete multi-role flow: Staff logs behavior, Manager verifies, Staff sees verified result", async ({
    staffPage, managerPage,
  }) => {
    // Increase timeout if narration is enabled (audio takes time)
    if (narrator.isEnabled()) {
      test.setTimeout(120000); // 2 minutes for narrated tests
    }

    const verifier = new BusinessLogicVerifier(logger);

    // Get intro duration (will wait after first navigation)
    const introDuration = await narrator.intro();

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Staff member logs a wine pairing recommendation
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Staff member logs a wine pairing recommendation");
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

      // Interactive actions (after narration)
      { // Click with fallback
        const targets = ["text=Recommend wine pairing","[data-testid='behavior-wine-pairing']","button:has-text('wine pairing')"];
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
      logger.click("text=Recommend wine pairing");
      await page.waitForTimeout(500);
      await page.waitForTimeout(500);

      await expect(page.getByText(/Tap again/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'Tap again' visible");

      { // Click with fallback
        const targets = ["text=Tap again","text=Confirm"];
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
      logger.click("text=Tap again");
      await page.waitForTimeout(1000);
      await page.waitForTimeout(500);

      // Assertions
      await expect(page.locator("text=My Actions")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=My Actions");

      // Business logic verification
      verifier.verify(
        "canStaffDeleteLog",
        {"isStaff":true,"isLogOwner":true,"isVerified":false},
        {"canDelete":true}
      );
      verifier.verify(
        "canVerifyLogs",
        {"role":"SERVER"},
        false
      );
      verifier.verify(
        "isStaffRole",
        {"role":"SERVER"},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await staffPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Manager navigates to verification page and sees pending logs
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Manager navigates to verification page and sees pending logs");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      // Setup: Load page and wait for readiness
      await page.goto("/manager/verification");
      logger.navigate("/manager/verification");

      await expect(page.getByText(/Behavior Verification/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Behavior Verification' visible");

      await expect(page.getByText(/pending verifications/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'pending verifications' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("text=pending verifications")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=pending verifications");

      // Business logic verification
      verifier.verify(
        "canVerifyLogs",
        {"role":"MANAGER"},
        true
      );
      verifier.verify(
        "isManagerRole",
        {"role":"MANAGER"},
        true
      );
      verifier.verify(
        "canAccessFeature",
        {"role":"MANAGER","feature":"verification"},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await managerPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Manager bulk verifies all pending behaviors
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step3Duration = await narrator.step(3);
    logger.stepStart(3, "Manager bulk verifies all pending behaviors");
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
        const targets = ["button:has-text('Select All')","[data-testid='select-all']"];
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
      logger.click("button:has-text('Select All')");
      await page.waitForTimeout(500);
      await page.waitForTimeout(500);

      { // Click with fallback
        const targets = ["button:has-text('Verify Selected')","[data-testid='verify-selected']"];
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
      logger.click("button:has-text('Verify Selected')");
      await page.waitForTimeout(2000);
      await page.waitForTimeout(500);

      await expect(page.getByText(/All caught up/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'All caught up' visible");

      // Assertions
      await expect(page.locator("text=All caught up")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=All caught up");

      // Business logic verification
      verifier.verify(
        "canStaffDeleteLog",
        {"isStaff":true,"isLogOwner":true,"isVerified":true},
        {"canDelete":false,"reason":"Cannot delete verified logs"}
      );

    }

    // Brief pause to see step result before next role switch
    await managerPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Staff navigates back to check their stats
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step4Duration = await narrator.step(4);
    logger.stepStart(4, "Staff navigates back to check their stats");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Setup: Load page and wait for readiness
      await page.goto("/staff");
      logger.navigate("/staff");

      await expect(page.getByText(/My Actions/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'My Actions' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("text=My Actions")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=My Actions");

      await expect(page.locator("text=verified")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=verified");

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
