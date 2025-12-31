/**
 * Staff Behavior Logging Flow
 *
 * Staff logs behaviors using two-tap confirmation pattern
 *
 * Generated from: specs/staff-behavior-logging.yaml
 * Priority: p1
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("staff-behavior-logging");

test.describe("Staff Behavior Logging Flow", () => {
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

  test("staff-behavior-logging: Staff logs behaviors using two-tap confirmation pattern", async ({
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

      await page.goto("/staff");
      logger.navigate("/staff");

      await expect(page.getByText(/LOG BEHAVIOR/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'LOG BEHAVIOR' visible");

      // Wait for intro narration (user sees page while intro plays)
      if (introDuration > 0) {
        await page.waitForTimeout(introDuration);
      }

      // Assertions
      { // Assert visible with fallback
        const targets = ["text=MY ACTIONS","text=ACTIONS"];
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
          logger.assertPass("Element visible: text=MY ACTIONS");
        } else {
          logger.assertFail("Element not found: text=MY ACTIONS");
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

    if (step1Duration > 0) {
      await staffPage.waitForTimeout(step1Duration);
    }

    await staffPage.waitForTimeout(500);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Staff logs a wine upsell behavior
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Staff logs a wine upsell behavior");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      { // Click with fallback
        const targets = ["text=Upsell Wine","[data-testid='behavior-upsell-wine']","button:has-text('Upsell Wine')","button:has-text('Wine')"];
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

      // Assertions
      await expect(page.locator("text=MY ACTIONS")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=MY ACTIONS");

      // Business logic verification
      verifier.verify(
        "canStaffDeleteLog",
        {"isStaff":true,"isLogOwner":true,"isVerified":false},
        {"canDelete":true}
      );

    }

    if (step2Duration > 0) {
      await staffPage.waitForTimeout(step2Duration);
    }

    await staffPage.waitForTimeout(500);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Staff logs a dessert suggestion
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step3Duration = await narrator.step(3);
    logger.stepStart(3, "Staff logs a dessert suggestion");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      { // Click with fallback
        const targets = ["text=Dessert","[data-testid='behavior-dessert']","button:has-text('Dessert')","button:has-text('Suggest')"];
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
      logger.click("text=Dessert");
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

      // Assertions
      await expect(page.locator("text=MY ACTIONS")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=MY ACTIONS");

    }

    if (step3Duration > 0) {
      await staffPage.waitForTimeout(step3Duration);
    }

    await staffPage.waitForTimeout(500);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Staff verifies their logged behaviors appear
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step4Duration = await narrator.step(4);
    logger.stepStart(4, "Staff verifies their logged behaviors appear");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      await expect(page.getByText(/MY ACTIONS/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'MY ACTIONS' visible");

      // Assertions
      await expect(page.locator("text=MY ACTIONS")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=MY ACTIONS");

      { // Assert visible with fallback
        const targets = ["text=AVG CHECK","text=Average","text=CHECK"];
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
          logger.assertPass("Element visible: text=AVG CHECK");
        } else {
          logger.assertFail("Element not found: text=AVG CHECK");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

    }

    if (step4Duration > 0) {
      await staffPage.waitForTimeout(step4Duration);
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
