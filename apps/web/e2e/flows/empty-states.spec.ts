/**
 * Empty States Flow
 *
 * Admin views pages that handle empty states
 *
 * Generated from: specs/empty-states.yaml
 * Priority: p1
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("empty-states");

test.describe("Empty States Flow", () => {
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

  test("empty-states: Admin views pages that handle empty states", async ({
    adminPage,
  }) => {
    // Increase timeout if narration is enabled (audio takes time)
    if (narrator.isEnabled()) {
      test.setTimeout(120000); // 2 minutes for narrated tests
    }

    const verifier = new BusinessLogicVerifier(logger);

    // Get intro duration (will wait after first navigation)
    const introDuration = await narrator.intro();

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Admin opens the admin console
    // Role: ADMIN
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Admin opens the admin console");
    logger.log({ type: "action", description: "Role: ADMIN", status: "info" });

    {
      const page = adminPage;

      // Setup: Load page and wait for readiness
      await page.goto("/admin");
      logger.navigate("/admin");

      await expect(page.getByText(/Admin Console/i)).toBeVisible({ timeout: 10000 });
      logger.assertPass("Text 'Admin Console' visible");

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
      await expect(page.locator("text=Admin Console")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Admin Console");

      // Business logic verification
      verifier.verify(
        "isAdminRole",
        {"role":"ADMIN"},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await adminPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Admin navigates to users page
    // Role: ADMIN
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Admin navigates to users page");
    logger.log({ type: "action", description: "Role: ADMIN", status: "info" });

    {
      const page = adminPage;

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Interactive actions (after narration)
      { // Click with fallback
        const targets = ["a[href='/admin/users']","text=Users"];
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
      logger.click("a[href='/admin/users']");
      await page.waitForTimeout(2000);
      await page.waitForTimeout(500);

      await expect(page.getByText(/User Management/i)).toBeVisible({ timeout: 10000 });
      logger.assertPass("Text 'User Management' visible");

      // Assertions
      await expect(page.locator("text=User Management")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=User Management");

      await expect(page.locator("text=Add User")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Add User");

      // Business logic verification
      verifier.verify(
        "canAccessAdmin",
        {"role":"ADMIN"},
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
