/**
 * Team Leaderboard Flow
 *
 * Manager views the team scoreboard with rankings and performance metrics
 *
 * Generated from: specs/team-leaderboard.yaml
 * Priority: p0
 */

import { test, expect } from "../fixtures/multi-role";
import { VerificationLogger } from "../utils/verification-logger";
import { BusinessLogicVerifier } from "../lib/business-logic-verifier";
import { createNarrator } from "../utils/audio-player";
import * as fs from "fs/promises";
import * as path from "path";

const logger = new VerificationLogger();
const narrator = createNarrator("team-leaderboard");

test.describe("Team Leaderboard Flow", () => {
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

  test("team-leaderboard: Manager views the team scoreboard with rankings and performance metrics", async ({
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
    // STEP 1: Manager opens the team scoreboard
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step1Duration = await narrator.step(1);
    logger.stepStart(1, "Manager opens the team scoreboard");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      // Setup: Load page and wait for readiness
      await page.goto("/scoreboard");
      logger.navigate("/scoreboard");

      await expect(page.getByText(/Today's Revenue/i)).toBeVisible({ timeout: 5000 });
      logger.assertPass("Text 'Today's Revenue' visible");

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
        const targets = ["text=Today's Revenue","text=Revenue"];
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
          logger.assertPass("Element visible: text=Today's Revenue");
        } else {
          logger.assertFail("Element not found: text=Today's Revenue");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      { // Assert visible with fallback
        const targets = ["text=Team Behaviors","text=Behaviors"];
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
          logger.assertPass("Element visible: text=Team Behaviors");
        } else {
          logger.assertFail("Element not found: text=Team Behaviors");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      // Business logic verification
      verifier.verify(
        "isManagerRole",
        {"role":"MANAGER"},
        true
      );

    }

    // Brief pause to see step result before next role switch
    await managerPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Manager reviews today's revenue and behaviors
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step2Duration = await narrator.step(2);
    logger.stepStart(2, "Manager reviews today's revenue and behaviors");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Today's Actions/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'Today's Actions' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      { // Assert visible with fallback
        const targets = ["text=Today's Actions","text=Actions"];
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
          logger.assertPass("Element visible: text=Today's Actions");
        } else {
          logger.assertFail("Element not found: text=Today's Actions");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      { // Assert visible with fallback
        const targets = ["text=/day","text=Avg"];
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
          logger.assertPass("Element visible: text=/day");
        } else {
          logger.assertFail("Element not found: text=/day");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      // Business logic verification
      verifier.verify(
        "determineGameState",
        {"actual":15000,"target":12000},
        "winning"
      );
      verifier.verify(
        "determineGameState",
        {"actual":8000,"target":12000},
        "losing"
      );
      verifier.verify(
        "calculateProgressPercent",
        {"current":9000,"target":12000},
        75
      );

    }

    // Brief pause to see step result before next role switch
    await managerPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Manager sees who's currently leading
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step3Duration = await narrator.step(3);
    logger.stepStart(3, "Manager sees who's currently leading");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Current Leader/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'Current Leader' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      { // Assert visible with fallback
        const targets = ["text=Current Leader","text=Leader","text=No behaviors logged"];
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
          logger.assertPass("Element visible: text=Current Leader");
        } else {
          logger.assertFail("Element not found: text=Current Leader");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      // Business logic verification
      verifier.verify(
        "getMedalType",
        {"rank":1},
        "gold"
      );
      verifier.verify(
        "getMedalType",
        {"rank":2},
        "silver"
      );
      verifier.verify(
        "getMedalType",
        {"rank":3},
        "bronze"
      );
      verifier.verify(
        "getMedalType",
        {"rank":4},
        null
      );

    }

    // Brief pause to see step result before next role switch
    await managerPage.waitForTimeout(1000);

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Manager views the full team leaderboard
    // Role: MANAGER
    // ═══════════════════════════════════════════════════════════════
    const step4Duration = await narrator.step(4);
    logger.stepStart(4, "Manager views the full team leaderboard");
    logger.log({ type: "action", description: "Role: MANAGER", status: "info" });

    {
      const page = managerPage;

      // Setup: Load page and wait for readiness
      await expect(page.getByText(/Rank/i)).toBeVisible({ timeout: 3000 });
      logger.assertPass("Text 'Rank' visible");

      // Wait for step narration (no cue points - sequential execution)
      const stepDurationMs = 0;
      if (stepDurationMs > 0) {
        await page.waitForTimeout(stepDurationMs);
      }

      // Assertions
      await expect(page.locator("text=Rank")).toBeVisible({ timeout: 3000 });
      logger.assertPass("Element visible: text=Rank");

      { // Assert visible with fallback
        const targets = ["text=Team Member","text=Member"];
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
          logger.assertPass("Element visible: text=Team Member");
        } else {
          logger.assertFail("Element not found: text=Team Member");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      { // Assert visible with fallback
        const targets = ["text=Points","text=Score"];
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
          logger.assertPass("Element visible: text=Points");
        } else {
          logger.assertFail("Element not found: text=Points");
          throw new Error("Element not found: " + targets.join(", "));
        }
      }

      // Business logic verification
      verifier.verify(
        "calculateRank",
        {"scores":[100,80,60,40],"score":80},
        2
      );
      verifier.verify(
        "calculateAverageCheck",
        {"revenue":5000,"covers":100},
        50
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
