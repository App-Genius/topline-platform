/**
 * Daily Briefing Flow
 *
 * Manager completes daily briefing: Overview, VIP, Kitchen, Upsell, Training, Attendance
 *
 * Generated from: specs/daily-briefing.yaml
 * Priority: p0
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("daily-briefing");

test.describe("Daily Briefing Flow", () => {
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

  test("daily-briefing: Manager completes daily briefing: Overview, VIP, Kitchen, Upsell, Training, Attendance", async ({
    managerPage,
  }) => {
    // Increase timeout if narration is enabled (audio takes time)
    if (narrator.isEnabled()) {
      test.setTimeout(120000); // 2 minutes for narrated tests
    }

    const verifier = new BusinessLogicVerifier(logger);

    // Get intro duration (will wait after first navigation)
    const introDuration = await narrator.intro();

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Manager opens the daily briefing page
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Manager opens the daily briefing page");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      await page.goto("/manager/briefing");
      logger.navigate("/manager/briefing");

      await expect(page.getByText(/Daily Briefing/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Daily Briefing' visible");

      // Wait for intro narration (user sees page while intro plays)
      if (introDuration > 0) {
        await page.waitForTimeout(introDuration);
      }

      // Assertions
      await expect(page.locator("[role='tab'][aria-selected='true']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: [role='tab'][aria-selected='true']");

      // Business logic verification
      verifier.verify(
        "isManagerRole",
        {"role":"MANAGER"},
        true
      );
      verifier.verify(
        "canAccessFeature",
        {"role":"MANAGER","feature":"briefing"},
        true
      );

    }

    if (step1Duration > 0) {
      await managerPage.waitForTimeout(step1Duration);
    }

    await managerPage.waitForTimeout(500);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Manager views VIP guest information
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Manager views VIP guest information");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      { // Click with fallback
        const targets = ["[role='tab']:has-text('VIP')","text=VIP","[aria-label*='VIP']"];
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
      logger.click("[role='tab']:has-text('VIP')");
      await page.waitForTimeout(500);

      // Assertions
      await expect(page.locator("[role='tabpanel']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: [role='tabpanel']");

    }

    if (step2Duration > 0) {
      await managerPage.waitForTimeout(step2Duration);
    }

    await managerPage.waitForTimeout(500);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Manager views kitchen updates
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step3Duration = await narrator.step(3);
    logger.stepStart(3, "Manager views kitchen updates");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      { // Click with fallback
        const targets = ["[role='tab']:has-text('Kitchen')","text=Kitchen","[aria-label*='Kitchen']"];
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
      logger.click("[role='tab']:has-text('Kitchen')");
      await page.waitForTimeout(500);

      // Assertions
      await expect(page.locator("[role='tabpanel']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: [role='tabpanel']");

    }

    if (step3Duration > 0) {
      await managerPage.waitForTimeout(step3Duration);
    }

    await managerPage.waitForTimeout(500);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Manager reviews upsell focus items
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step4Duration = await narrator.step(4);
    logger.stepStart(4, "Manager reviews upsell focus items");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      { // Click with fallback
        const targets = ["[role='tab']:has-text('Upsell')","text=Upsell","[aria-label*='Upsell']"];
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
      logger.click("[role='tab']:has-text('Upsell')");
      await page.waitForTimeout(500);

      // Assertions
      await expect(page.locator("[role='tabpanel']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: [role='tabpanel']");

    }

    if (step4Duration > 0) {
      await managerPage.waitForTimeout(step4Duration);
    }

    await managerPage.waitForTimeout(500);

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Manager reviews training topic
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step5Duration = await narrator.step(5);
    logger.stepStart(5, "Manager reviews training topic");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      { // Click with fallback
        const targets = ["[role='tab']:has-text('Training')","text=Training","[aria-label*='Training']"];
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
      logger.click("[role='tab']:has-text('Training')");
      await page.waitForTimeout(500);

      // Assertions
      await expect(page.locator("[role='tabpanel']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: [role='tabpanel']");

    }

    if (step5Duration > 0) {
      await managerPage.waitForTimeout(step5Duration);
    }

    await managerPage.waitForTimeout(500);

    // ═══════════════════════════════════════════════════════════════
    // STEP 6: Manager marks team attendance
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step6Duration = await narrator.step(6);
    logger.stepStart(6, "Manager marks team attendance");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      { // Click with fallback
        const targets = ["[role='tab']:has-text('Attendance')","text=Attendance","[aria-label*='Attendance']"];
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
      logger.click("[role='tab']:has-text('Attendance')");
      await page.waitForTimeout(500);

      { // Click with fallback
        const targets = ["[role='checkbox']","input[type='checkbox']"];
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
      logger.click("[role='checkbox']");
      await page.waitForTimeout(300);

      // Assertions
      await expect(page.locator("[role='tabpanel']")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: [role='tabpanel']");

    }

    if (step6Duration > 0) {
      await managerPage.waitForTimeout(step6Duration);
    }

    await managerPage.waitForTimeout(500);

    // ═══════════════════════════════════════════════════════════════
    // STEP 7: Manager completes the briefing
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step7Duration = await narrator.step(7);
    logger.stepStart(7, "Manager completes the briefing");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      { // Click with fallback
        const targets = ["button:has-text('Complete Briefing')","[data-testid='complete-briefing']","text=Complete"];
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
      logger.click("button:has-text('Complete Briefing')");
      await page.waitForTimeout(1000);

      // Assertions
      { // Assert visible with fallback
        const targets = ["text=complete","text=success","text=Completed"];
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
          logger.assertPass("Element visible: text=complete");
        } else {
          logger.assertFail("Element not found: text=complete");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

    }

    if (step7Duration > 0) {
      await managerPage.waitForTimeout(step7Duration);
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
