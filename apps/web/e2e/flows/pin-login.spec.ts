/**
 * PIN Login Flow
 *
 * Staff member authenticates using profile selection and 4-digit PIN on shared device
 *
 * Generated from: specs/pin-login.yaml
 * Priority: p0
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("pin-login");

test.describe("PIN Login Flow", () => {
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

  test("pin-login: Staff member authenticates using profile selection and 4-digit PIN on shared device", async ({
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
    // STEP 1: Staff navigates to the staff login page
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Staff navigates to the staff login page");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Setup: Load page and wait for readiness
      await page.goto("/staff/login");
      logger.navigate("/staff/login");

      await expect(page.getByText(/Select Your Profile/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Select Your Profile' visible");

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
      await expect(page.locator("[data-testid='profile-grid']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: [data-testid='profile-grid']");

      // Business logic verification
      verifier.verify(
        "canUsePinLogin",
        {"role":"SERVER"},
        true
      );
      verifier.verify(
        "canUsePinLogin",
        {"role":"ADMIN"},
        false
      );

    }

    // Brief pause to see step result before next role switch
    await staffPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Staff selects their profile from the grid
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Staff selects their profile from the grid");
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
        const targets = ["[data-testid='profile-sam']","text=Sam","button:has-text('Sam')"];
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
      logger.click("[data-testid='profile-sam']");
      await page.waitForTimeout(500);
      await page.waitForTimeout(500);

      await expect(page.getByText(/Enter Your PIN/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'Enter Your PIN' visible");

      // Assertions
      await expect(page.locator("[data-testid='pin-keypad']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: [data-testid='pin-keypad']");

      await expect(page.locator("[data-testid='pin-dots']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: [data-testid='pin-dots']");

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
    // STEP 3: Staff enters an incorrect PIN to test error handling
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step3Duration = await narrator.step(3);
    logger.stepStart(3, "Staff enters an incorrect PIN to test error handling");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Interactive actions (after narration)
      await page.locator("button:has-text('9')").click();
      logger.click("button:has-text('9')");
      await page.waitForTimeout(100);
      await page.waitForTimeout(500);

      await page.locator("button:has-text('9')").click();
      logger.click("button:has-text('9')");
      await page.waitForTimeout(100);
      await page.waitForTimeout(500);

      await page.locator("button:has-text('9')").click();
      logger.click("button:has-text('9')");
      await page.waitForTimeout(100);
      await page.waitForTimeout(500);

      await page.locator("button:has-text('9')").click();
      logger.click("button:has-text('9')");
      await page.waitForTimeout(1500);
      await page.waitForTimeout(500);

      await expect(page.getByText(/Incorrect PIN/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'Incorrect PIN' visible");

      // Assertions
      await expect(page.locator("[data-testid='pin-error']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: [data-testid='pin-error']");

    }

    // Brief pause to see step result before next role switch
    await staffPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Staff enters their correct 4-digit PIN
    // Role: STAFF
    // ═══════════════════════════════════════════════════════════════
    const step4Duration = await narrator.step(4);
    logger.stepStart(4, "Staff enters their correct 4-digit PIN");
    logger.log({ type: "action", description: "Role: STAFF", status: "info" });

    {
      const page = staffPage;

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Interactive actions (after narration)
      await page.locator("button:has-text('1')").click();
      logger.click("button:has-text('1')");
      await page.waitForTimeout(200);
      await page.waitForTimeout(500);

      await page.locator("button:has-text('2')").click();
      logger.click("button:has-text('2')");
      await page.waitForTimeout(200);
      await page.waitForTimeout(500);

      await page.locator("button:has-text('3')").click();
      logger.click("button:has-text('3')");
      await page.waitForTimeout(200);
      await page.waitForTimeout(500);

      await page.locator("button:has-text('4')").click();
      logger.click("button:has-text('4')");
      await page.waitForTimeout(2000);
      await page.waitForTimeout(500);

      await expect(page.getByText(/Log Behavior/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Log Behavior' visible");

      // Assertions
      await expect(page.locator("text=Log Behavior")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Log Behavior");

      // Business logic verification
      verifier.verify(
        "canAccessFeature",
        {"role":"SERVER","feature":"behavior-logging"},
        true
      );
      verifier.verify(
        "canAccessFeature",
        {"role":"SERVER","feature":"pin-login"},
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
