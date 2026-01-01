/**
 * Quick Behavior Log Flow
 *
 * Staff quickly logs multiple behaviors in succession on mobile
 *
 * Generated from: specs/quick-behavior-log.yaml
 * Priority: p0
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("quick-behavior-log");

test.describe("Quick Behavior Log Flow", () => {
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

  test("quick-behavior-log: Staff quickly logs multiple behaviors in succession on mobile", async ({
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
    // STEP 1: Staff opens dashboard on mobile viewport
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Staff opens dashboard on mobile viewport");
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
        "canAccessFeature",
        {"role":"SERVER","feature":"behavior-logging"},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await staffPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Staff logs wine recommendation with two-tap confirmation
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Staff logs wine recommendation with two-tap confirmation");
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
        const targets = ["button:has-text('Recommend wine pairing')","text=Recommend wine pairing","button:has-text('wine pairing')"];
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
      { // Assert visible with fallback
        const targets = ["text=LOGGED","text=Logged","[data-testid='success-toast']"];
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
          logger.assertPass("Element visible: text=LOGGED");
        } else {
          logger.assertFail("Element not found: text=LOGGED");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

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
    // STEP 3: Staff quickly logs another behavior
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step3Duration = await narrator.step(3);
    logger.stepStart(3, "Staff quickly logs another behavior");
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

      // Interactive actions (after narration)
      { // Click with fallback
        const targets = ["button:has-text('Offer dessert')","text=Offer dessert","button:has-text('dessert')"];
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
      logger.click("button:has-text('Offer dessert')");
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
    // STEP 4: Staff logs a third behavior in quick succession
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step4Duration = await narrator.step(4);
    logger.stepStart(4, "Staff logs a third behavior in quick succession");
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

      // Interactive actions (after narration)
      { // Click with fallback
        const targets = ["button:has-text('Suggest appetizer')","text=Suggest appetizer","button:has-text('appetizer')"];
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
      logger.click("button:has-text('Suggest appetizer')");
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
    // STEP 5: Staff verifies their action count has increased
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step5Duration = await narrator.step(5);
    logger.stepStart(5, "Staff verifies their action count has increased");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/My Actions/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'My Actions' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
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

      { // Assert visible with fallback
        const targets = ["text=pending","text=Pending","text=verified"];
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
        "canStaffDeleteLog",
        {"isStaff":true,"isLogOwner":true,"isVerified":false},
        {"canDelete":true}
      );
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
