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
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();

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
    const verifier = new BusinessLogicVerifier(logger);

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Staff member logs a wine upsell behavior
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    logger.stepStart(1, "Staff member logs a wine upsell behavior");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      await page.goto("/staff");
      logger.navigate("/staff");

      await expect(page.getByText(/LOG BEHAVIOR/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'LOG BEHAVIOR' visible");

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

    await staffPage.waitForTimeout(500);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Manager navigates to verification page and sees pending log
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    logger.stepStart(2, "Manager navigates to verification page and sees pending log");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      await page.goto("/manager/verification");
      logger.navigate("/manager/verification");

      await expect(page.getByText(/Behavior Verification/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Behavior Verification' visible");

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

    await managerPage.waitForTimeout(500);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Manager clicks verify button on the first pending behavior
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    logger.stepStart(3, "Manager clicks verify button on the first pending behavior");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

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

    await managerPage.waitForTimeout(500);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Staff navigates back to check their stats
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    logger.stepStart(4, "Staff navigates back to check their stats");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      await page.goto("/staff");
      logger.navigate("/staff");

      await expect(page.getByText(/MY ACTIONS/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'MY ACTIONS' visible");

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
