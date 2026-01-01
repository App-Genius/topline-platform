/**
 * User Management Flow
 *
 * Admin manages team members
 *
 * Generated from: specs/user-management.yaml
 * Priority: p0
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("user-management");

test.describe("User Management Flow", () => {
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

  test("user-management: Admin manages team members", async ({
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
    // STEP 1: Admin opens the admin dashboard
    // Role: ADMIN
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Admin opens the admin dashboard");
    logger.log({ type: "action", description: "Role: ADMIN", status: "info" });

    {
      const page = adminPage;

      // Setup: Load page and wait for readiness
      await page.goto("/admin");
      logger.navigate("/admin");

      await expect(page.getByText(/Admin Console/i)).toBeVisible({ timeout: 15000 });
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

      { // Assert visible with fallback
        const targets = ["a[href='/admin/users']","text=Users"];
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
          logger.assertPass("Element visible: a[href='/admin/users']");
        } else {
          logger.assertFail("Element not found: a[href='/admin/users']");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      // Business logic verification
      verifier.verify(
        "isAdminRole",
        {"role":"ADMIN"},
        true
      );
      verifier.verify(
        "canAccessAdmin",
        {"role":"ADMIN"},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await adminPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Admin clicks on Users in the sidebar
    // Role: ADMIN
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Admin clicks on Users in the sidebar");
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

    // Brief pause to see step result before next role switch
    await adminPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Admin sees the list of team members
    // Role: ADMIN
    // ═══════════════════════════════════════════════════════════════
    const step3Duration = await narrator.step(3);
    logger.stepStart(3, "Admin sees the list of team members");
    logger.log({ type: "action", description: "Role: ADMIN", status: "info" });

    {
      const page = adminPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Joined/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Joined' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("text=Joined")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Joined");

      await expect(page.locator("text=Actions")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Actions");

      // Business logic verification
      verifier.verify(
        "calculateProgress",
        {"current":5,"target":10},
        50
      );

    }

    // Brief pause to see step result before next role switch
    await adminPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Admin sees search and filter options
    // Role: ADMIN
    // ═══════════════════════════════════════════════════════════════
    const step4Duration = await narrator.step(4);
    logger.stepStart(4, "Admin sees search and filter options");
    logger.log({ type: "action", description: "Role: ADMIN", status: "info" });

    {
      const page = adminPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Search/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Search' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      { // Assert visible with fallback
        const targets = ["input[placeholder*='Search']","[data-testid='search-input']"];
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
          logger.assertPass("Element visible: input[placeholder*='Search']");
        } else {
          logger.assertFail("Element not found: input[placeholder*='Search']");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      { // Assert visible with fallback
        const targets = ["text=All Roles","select"];
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
          logger.assertPass("Element visible: text=All Roles");
        } else {
          logger.assertFail("Element not found: text=All Roles");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      // Business logic verification
      verifier.verify(
        "canAccessAdmin",
        {"role":"SERVER"},
        false
      );
      verifier.verify(
        "canAccessAdmin",
        {"role":"MANAGER"},
        false
      );

    }

    // Brief pause to see step result before next role switch
    await adminPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Admin verifies they can add new users
    // Role: ADMIN
    // ═══════════════════════════════════════════════════════════════
    const step5Duration = await narrator.step(5);
    logger.stepStart(5, "Admin verifies they can add new users");
    logger.log({ type: "action", description: "Role: ADMIN", status: "info" });

    {
      const page = adminPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Add User/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'Add User' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      { // Assert visible with fallback
        const targets = ["button:has-text('Add User')","text=Add User"];
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
          logger.assertPass("Element visible: button:has-text('Add User')");
        } else {
          logger.assertFail("Element not found: button:has-text('Add User')");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      // Business logic verification
      verifier.verify(
        "isAdminRole",
        {"role":"ADMIN"},
        true
      );
      verifier.verify(
        "isManagerRole",
        {"role":"ADMIN"},
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
