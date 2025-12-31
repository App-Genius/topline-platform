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
    // STEP 1: Staff member logs a wine upsell behavior
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Staff member logs a wine upsell behavior");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Setup: Load page and wait for readiness
      await page.goto("/staff");
      logger.navigate("/staff");

      await expect(page.getByText(/LOG BEHAVIOR/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'LOG BEHAVIOR' visible");

      // Wait for intro narration (user sees page while intro plays)
      const introMs = 7025;
      if (introMs > 0) {
        await page.waitForTimeout(introMs);
      }

      // Execute actions at cue point timestamps (synchronized with narration)
      const stepStartTime = Date.now();
      const stepDurationMs = 9375;

      // Cue point [5.34s]: "taps the Upsell Wine"
      {
        const targetMs = 5340;
        const elapsed = Date.now() - stepStartTime;
        if (elapsed < targetMs) {
          await page.waitForTimeout(targetMs - elapsed);
        }
        { // Click with fallback
          const targets = ["text=Upsell Wine","[data-testid='behavior-upsell-wine']","button:has-text('Upsell Wine')"];
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
        logger.click("text=Upsell Wine");
        await page.waitForTimeout(500);
        await page.waitForTimeout(300); // Brief pause to see action
      }

      // Cue point [7.53s]: "confirms with a second tap"
      {
        const targetMs = 7530;
        const elapsed = Date.now() - stepStartTime;
        if (elapsed < targetMs) {
          await page.waitForTimeout(targetMs - elapsed);
        }
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
        await page.waitForTimeout(300); // Brief pause to see action
      }

      // Wait for remaining narration
      {
        const elapsed = Date.now() - stepStartTime;
        const remaining = stepDurationMs - elapsed;
        if (remaining > 0) await page.waitForTimeout(remaining);
      }

      // Assertions
      await expect(page.locator("text=MY ACTIONS")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=MY ACTIONS");

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
    // STEP 2: Manager navigates to verification page and sees pending log
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Manager navigates to verification page and sees pending log");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      // Setup: Load page and wait for readiness
      await page.goto("/manager/verification");
      logger.navigate("/manager/verification");

      await expect(page.getByText(/Behavior Verification/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Behavior Verification' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 7525;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      { // Assert visible with fallback
        const targets = ["text=pending verifications","text=pending"];
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
          logger.assertPass("Element visible: text=pending verifications");
        } else {
          logger.assertFail("Element not found: text=pending verifications");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

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
    // STEP 3: Manager clicks verify button on the first pending behavior
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step3Duration = await narrator.step(3);
    logger.stepStart(3, "Manager clicks verify button on the first pending behavior");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      // Execute actions at cue point timestamps (synchronized with narration)
      const stepStartTime = Date.now();
      const stepDurationMs = 7150;

      // Cue point [2.15s]: "[estimated: button[title='Verify']]"
      {
        const targetMs = 2150;
        const elapsed = Date.now() - stepStartTime;
        if (elapsed < targetMs) {
          await page.waitForTimeout(targetMs - elapsed);
        }
        { // Click with fallback
          const targets = ["button[title='Verify']","button.bg-emerald-100","[title='Verify']"];
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
        logger.click("button[title='Verify']");
        await page.waitForTimeout(1000);
        await page.waitForTimeout(300); // Brief pause to see action
      }

      // Wait for remaining narration
      {
        const elapsed = Date.now() - stepStartTime;
        const remaining = stepDurationMs - elapsed;
        if (remaining > 0) await page.waitForTimeout(remaining);
      }

      // Assertions
      await expect(page.locator("text=Behavior Verification")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Behavior Verification");

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

      await expect(page.getByText(/MY ACTIONS/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'MY ACTIONS' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 8200;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("text=MY ACTIONS")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=MY ACTIONS");

      await expect(page.locator("text=AVG CHECK")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=AVG CHECK");

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
