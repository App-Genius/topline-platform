/**
 * Behavior Rejection Flow
 *
 * Staff logs behavior that manager rejects
 *
 * Generated from: specs/behavior-rejection.yaml
 * Priority: p0
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("behavior-rejection");

test.describe("Behavior Rejection Flow", () => {
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

  test("behavior-rejection: Staff logs behavior that manager rejects", async ({
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
    // STEP 1: Staff logs a behavior that will be rejected
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Staff logs a behavior that will be rejected");
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

      await page.locator("text=Tap again to Confirm").click();
      logger.click("text=Tap again to Confirm");
      await page.waitForTimeout(1000);
      await page.waitForTimeout(500);

      await expect(page.getByText(/LOGGED/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'LOGGED' visible");

      // Assertions
      await expect(page.locator("text=LOGGED")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=LOGGED");

      // Business logic verification
      verifier.verify(
        "isStaffRole",
        {"role":"SERVER"},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await staffPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Manager opens the verification queue
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Manager opens the verification queue");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      // Setup: Load page and wait for readiness
      await page.goto("/manager/verification");
      logger.navigate("/manager/verification");

      await expect(page.getByText(/Behavior Verification/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Behavior Verification' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("text=Behavior Verification")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Behavior Verification");

      { // Assert visible with fallback
        const targets = ["text=pending","text=Pending"];
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

      // Business logic verification
      verifier.verify(
        "canVerifyLogs",
        {"role":"MANAGER"},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await managerPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Manager rejects the behavior
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step3Duration = await narrator.step(3);
    logger.stepStart(3, "Manager rejects the behavior");
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
        const targets = ["button:has-text('Reject Selected')","[data-testid='reject-selected']","text=Reject"];
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
      logger.click("button:has-text('Reject Selected')");
      await page.waitForTimeout(1000);
      await page.waitForTimeout(500);

      await expect(page.getByText(/rejected/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'rejected' visible");

      // Assertions
      { // Assert visible with fallback
        const targets = ["text=rejected","text=All caught up","text=0 pending"];
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
          logger.assertPass("Element visible: text=rejected");
        } else {
          logger.assertFail("Element not found: text=rejected");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      // Business logic verification
      verifier.verify(
        "canStaffDeleteLog",
        {"isStaff":true,"isLogOwner":true,"isVerified":true},
        {"canDelete":false,"reason":"Cannot delete verified logs"}
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
