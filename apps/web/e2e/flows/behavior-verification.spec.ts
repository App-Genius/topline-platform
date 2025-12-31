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
    // STEP 1: Staff member logs a wine pairing behavior
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    logger.stepStart(1, "Staff member logs a wine pairing behavior");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      await page.goto("/staff");
      logger.navigate("/staff");

      await expect(page.getByText(/Good Evening/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Good Evening' visible");

      { // Click with fallback
        const targets = ["[data-testid='quick-log-button']","button:has-text('Quick Log')","text=Quick Log"];
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
      logger.click("[data-testid='quick-log-button']");

      await expect(page.getByText(/Select Behaviors/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'Select Behaviors' visible");

      { // Click with fallback
        const targets = ["[data-testid='behavior-wine-pairing']","button:has-text('Wine Pairing')","text=Wine Pairing"];
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
      logger.click("[data-testid='behavior-wine-pairing']");

      await page.locator("[data-testid='behavior-wine-pairing']").click();
      logger.click("[data-testid='behavior-wine-pairing']");
      await page.waitForTimeout(500);

      { // Fill with fallback
        const targets = ["[data-testid='table-number']","input[name='tableNumber']","input[placeholder*='table']"];
        let found = false;
        for (const sel of targets) {
          try {
            const el = page.locator(sel);
            if (await el.count() > 0) {
              await el.first().fill("12");
              found = true;
              break;
            }
          } catch { /* try next */ }
        }
        if (!found) throw new Error("Could not find element to fill: " + targets.join(", "));
      }
      logger.log({ type: "action", description: "Fill: [data-testid='table-number'] = 12", status: "info" });

      { // Click with fallback
        const targets = ["[data-testid='submit-behavior']","button:has-text('Submit')","button[type='submit']"];
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
      logger.click("[data-testid='submit-behavior']");

      // Assertions
      { // Assert visible with fallback
        const targets = ["text=Behavior logged","text=Behaviors Logged","text=Success"];
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
          logger.assertPass("Element visible: text=Behavior logged");
        } else {
          logger.assertFail("Element not found: text=Behavior logged");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      await expect(page.locator("[data-testid='activity-list']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: [data-testid='activity-list']");

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

      await page.goto("/manager/verify");
      logger.navigate("/manager/verify");

      await expect(page.getByText(/Verify Behaviors/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Verify Behaviors' visible");

      // Assertions
      { // Assert visible with fallback
        const targets = ["[data-testid='pending-count']","text=Pending"];
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
          logger.assertPass("Element visible: [data-testid='pending-count']");
        } else {
          logger.assertFail("Element not found: [data-testid='pending-count']");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      { // Assert visible with fallback
        const targets = ["[data-testid='verification-item']","text=Wine Pairing"];
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
          logger.assertPass("Element visible: [data-testid='verification-item']");
        } else {
          logger.assertFail("Element not found: [data-testid='verification-item']");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      await expect(page.locator("text=Sam")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Sam");

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
    // STEP 3: Manager clicks verify button on the pending behavior
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    logger.stepStart(3, "Manager clicks verify button on the pending behavior");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      { // Click with fallback
        const targets = ["[data-testid='verify-button']","button:has-text('Verify')","[aria-label='Verify']"];
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
      logger.click("[data-testid='verify-button']");
      await page.waitForTimeout(500);

      // Assertions
      { // Assert visible with fallback
        const targets = ["text=Verified","text=verified","[data-testid='verified-badge']"];
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
          logger.assertPass("Element visible: text=Verified");
        } else {
          logger.assertFail("Element not found: text=Verified");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      await expect(page.locator("[data-testid='pending-item']:has-text('Wine Pairing')")).not.toBeVisible({ timeout: 3000 });
      logger.assertPass("Element not visible: [data-testid='pending-item']:has-text('Wine Pairing')");

      // Business logic verification
      verifier.verify(
        "canStaffDeleteLog",
        {"isStaff":true,"isLogOwner":true,"isVerified":true},
        {"canDelete":false,"reason":"Cannot delete verified logs"}
      );

    }

    await managerPage.waitForTimeout(500);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Staff navigates to their activity and sees the verified badge
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    logger.stepStart(4, "Staff navigates to their activity and sees the verified badge");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      await page.goto("/staff");
      logger.navigate("/staff");

      await expect(page.getByText(/Today's Activity/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Today's Activity' visible");

      // Assertions
      { // Assert visible with fallback
        const targets = ["[data-testid='verified-badge']",".verified-badge","text=Verified"];
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
          logger.assertPass("Element visible: [data-testid='verified-badge']");
        } else {
          logger.assertFail("Element not found: [data-testid='verified-badge']");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      await expect(page.locator("[data-testid='log-status']")).toContainText("Verified", { timeout: 3000 });
      logger.assertPass("Element contains text: Verified");

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
