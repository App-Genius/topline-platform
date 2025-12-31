#!/usr/bin/env npx tsx
/**
 * Test Generator Script
 *
 * Generates Playwright test files from YAML flow specifications.
 *
 * Usage:
 *   npx tsx e2e/scripts/generate-tests.ts behavior-verification
 *   npx tsx e2e/scripts/generate-tests.ts --all
 *
 * Output:
 *   e2e/flows/behavior-verification.spec.ts
 */

import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import * as yaml from "yaml";

// Paths
const SPECS_DIR = path.join(__dirname, "..", "specs");
const FLOWS_DIR = path.join(__dirname, "..", "flows");
const AUDIO_DIR = path.join(__dirname, "..", "audio");
const NARRATION_CACHE = path.join(AUDIO_DIR, ".narration-cache.json");

// ============================================================================
// CUE POINT TYPES AND LOADING
// ============================================================================

interface CuePoint {
  timestamp: number;
  actionIndex: number;
  phrase: string;
  selector: string;
  type: "click" | "fill";
}

interface NarrationCacheEntry {
  hash: string;
  file: string;
  text: string;
  duration: number;
  role: string | null;
  step: number;
  type: string;
  cuePoints: CuePoint[];
}

interface NarrationCache {
  [key: string]: NarrationCacheEntry;
}

/**
 * Load narration cache with cue point metadata
 */
function loadNarrationCache(): NarrationCache {
  try {
    if (fsSync.existsSync(NARRATION_CACHE)) {
      const content = fsSync.readFileSync(NARRATION_CACHE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn("Could not load narration cache:", error);
  }
  return {};
}

/**
 * Get step timing data including cue points
 */
function getStepTiming(flowId: string, stepNum: number, cache: NarrationCache): {
  duration: number;
  cuePoints: CuePoint[];
} {
  const key = `${flowId}/step-${stepNum}`;
  const entry = cache[key];

  if (entry) {
    return {
      duration: entry.duration || 0,
      cuePoints: entry.cuePoints || [],
    };
  }

  return { duration: 0, cuePoints: [] };
}

/**
 * Get intro duration
 */
function getIntroDuration(flowId: string, cache: NarrationCache): number {
  const key = `${flowId}/intro`;
  const entry = cache[key];
  return entry?.duration || 0;
}

// ============================================================================
// TYPES
// ============================================================================

interface FlowSpec {
  flow: {
    id: string;
    name: string;
    description: string;
    priority: string;
    tags?: string[];
  };
  roles: Array<{
    type: string;
    fixture: string;
    user: string;
  }>;
  steps: Array<{
    id: string;
    role: string;
    description: string;
    actions: Array<{
      type: string;
      url?: string;
      selector?: string;
      text?: string;
      value?: string;
      fallback?: string[];
      timeout?: number;
      waitAfter?: number;
    }>;
    assertions?: Array<{
      type: string;
      selector?: string;
      text?: string;
      contains?: string;
      fallback?: string[];
      timeout?: number;
    }>;
    businessLogic?: Array<{
      function: string;
      args: Record<string, unknown>;
      expected: unknown;
    }>;
  }>;
  metadata?: {
    timeout?: number;
    retries?: number;
    video?: { enabled: boolean };
  };
}

// ============================================================================
// GENERATOR
// ============================================================================

let actionCounter = 0;
let assertionCounter = 0;

function generateActionCode(action: FlowSpec["steps"][0]["actions"][0], indent: string): string {
  const lines: string[] = [];
  const actionId = ++actionCounter;

  switch (action.type) {
    case "navigate":
      lines.push(`${indent}await page.goto("${action.url}");`);
      lines.push(`${indent}logger.navigate("${action.url}");`);
      break;

    case "waitFor":
      if (action.text) {
        lines.push(`${indent}await expect(page.getByText(/${escapeRegex(action.text)}/i)).toBeVisible({ timeout: ${action.timeout || 5000} });`);
        lines.push(`${indent}logger.assertPass("Text '${action.text}' visible");`);
      } else if (action.selector) {
        lines.push(`${indent}await expect(page.locator("${action.selector}")).toBeVisible({ timeout: ${action.timeout || 5000} });`);
        lines.push(`${indent}logger.assertPass("Element '${action.selector}' visible");`);
      }
      break;

    case "click":
      // Handle fallback selectors
      if (action.fallback && action.fallback.length > 0) {
        const allSelectors = [action.selector!, ...action.fallback];
        lines.push(`${indent}{ // Click with fallback`);
        lines.push(`${indent}  const targets = ${JSON.stringify(allSelectors)};`);
        lines.push(`${indent}  let found = false;`);
        lines.push(`${indent}  for (const sel of targets) {`);
        lines.push(`${indent}    try {`);
        lines.push(`${indent}      const el = page.locator(sel);`);
        lines.push(`${indent}      if (await el.count() > 0) {`);
        lines.push(`${indent}        await el.first().click();`);
        lines.push(`${indent}        found = true;`);
        lines.push(`${indent}        break;`);
        lines.push(`${indent}      }`);
        lines.push(`${indent}    } catch { /* try next */ }`);
        lines.push(`${indent}  }`);
        lines.push(`${indent}  if (!found) throw new Error("Could not find element to click: " + targets.join(", "));`);
        lines.push(`${indent}}`);
      } else {
        lines.push(`${indent}await page.locator("${action.selector}").click();`);
      }
      lines.push(`${indent}logger.click("${action.selector}");`);
      if (action.waitAfter) {
        lines.push(`${indent}await page.waitForTimeout(${action.waitAfter});`);
      }
      break;

    case "fill":
      if (action.fallback && action.fallback.length > 0) {
        const allSelectors = [action.selector!, ...action.fallback];
        lines.push(`${indent}{ // Fill with fallback`);
        lines.push(`${indent}  const targets = ${JSON.stringify(allSelectors)};`);
        lines.push(`${indent}  let found = false;`);
        lines.push(`${indent}  for (const sel of targets) {`);
        lines.push(`${indent}    try {`);
        lines.push(`${indent}      const el = page.locator(sel);`);
        lines.push(`${indent}      if (await el.count() > 0) {`);
        lines.push(`${indent}        await el.first().fill("${action.value}");`);
        lines.push(`${indent}        found = true;`);
        lines.push(`${indent}        break;`);
        lines.push(`${indent}      }`);
        lines.push(`${indent}    } catch { /* try next */ }`);
        lines.push(`${indent}  }`);
        lines.push(`${indent}  if (!found) throw new Error("Could not find element to fill: " + targets.join(", "));`);
        lines.push(`${indent}}`);
      } else {
        lines.push(`${indent}await page.locator("${action.selector}").fill("${action.value}");`);
      }
      lines.push(`${indent}logger.log({ type: "action", description: "Fill: ${action.selector} = ${action.value}", status: "info" });`);
      break;
  }

  return lines.join("\n");
}

function generateAssertionCode(assertion: NonNullable<FlowSpec["steps"][0]["assertions"]>[0], indent: string): string {
  const lines: string[] = [];

  switch (assertion.type) {
    case "visible":
      if (assertion.fallback && assertion.fallback.length > 0) {
        const allSelectors = [assertion.selector!, ...assertion.fallback];
        lines.push(`${indent}{ // Assert visible with fallback`);
        lines.push(`${indent}  const targets = ${JSON.stringify(allSelectors)};`);
        lines.push(`${indent}  let found = false;`);
        lines.push(`${indent}  for (const sel of targets) {`);
        lines.push(`${indent}    try {`);
        lines.push(`${indent}      const el = page.locator(sel);`);
        lines.push(`${indent}      if (await el.count() > 0) {`);
        lines.push(`${indent}        await expect(el.first()).toBeVisible({ timeout: ${assertion.timeout || 3000} });`);
        lines.push(`${indent}        found = true;`);
        lines.push(`${indent}        break;`);
        lines.push(`${indent}      }`);
        lines.push(`${indent}    } catch { /* try next */ }`);
        lines.push(`${indent}  }`);
        lines.push(`${indent}  if (found) {`);
        lines.push(`${indent}    logger.assertPass("Element visible: ${assertion.selector}");`);
        lines.push(`${indent}  } else {`);
        lines.push(`${indent}    logger.assertFail("Element not found: ${assertion.selector}");`);
        lines.push(`${indent}    throw new Error("Element not found: " + targets.join(", "));`);
        lines.push(`${indent}  }`);
        lines.push(`${indent}}`);
      } else {
        lines.push(`${indent}await expect(page.locator("${assertion.selector}")).toBeVisible({ timeout: ${assertion.timeout || 3000} });`);
        lines.push(`${indent}logger.assertPass("Element visible: ${assertion.selector}");`);
      }
      break;

    case "notVisible":
      lines.push(`${indent}await expect(page.locator("${assertion.selector}")).not.toBeVisible({ timeout: ${assertion.timeout || 3000} });`);
      lines.push(`${indent}logger.assertPass("Element not visible: ${assertion.selector}");`);
      break;

    case "text":
      if (assertion.contains) {
        lines.push(`${indent}await expect(page.locator("${assertion.selector}")).toContainText("${assertion.contains}", { timeout: ${assertion.timeout || 3000} });`);
        lines.push(`${indent}logger.assertPass("Element contains text: ${assertion.contains}");`);
      }
      break;
  }

  return lines.join("\n");
}

function generateBusinessLogicCode(checks: NonNullable<FlowSpec["steps"][0]["businessLogic"]>, indent: string): string {
  const lines: string[] = [];

  lines.push(`${indent}// Business logic verification`);
  for (const check of checks) {
    lines.push(`${indent}verifier.verify(`);
    lines.push(`${indent}  "${check.function}",`);
    lines.push(`${indent}  ${JSON.stringify(check.args)},`);
    lines.push(`${indent}  ${JSON.stringify(check.expected)}`);
    lines.push(`${indent});`);
  }

  return lines.join("\n");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generateTestFile(spec: FlowSpec): string {
  const { flow, roles, steps } = spec;

  // Determine if multi-role or if using role-specific fixtures
  const isMultiRole = roles.length > 1;
  const usesRoleFixtures = roles.some(r =>
    r.fixture === "staffPage" || r.fixture === "managerPage" || r.fixture === "adminPage"
  );

  // Use multi-role fixtures if multiple roles OR using role-specific fixtures
  const needsMultiRoleFixtures = isMultiRole || usesRoleFixtures;
  const fixtureImport = needsMultiRoleFixtures
    ? `import { test, expect } from "../fixtures/multi-role";`
    : `import { test, expect } from "../fixtures";`;

  // Build fixture params
  const fixtureParams = needsMultiRoleFixtures
    ? roles.map((r) => r.fixture).join(", ")
    : "page";

  // Build role page mapping
  const rolePageMap: Record<string, string> = {};
  for (const role of roles) {
    rolePageMap[role.type] = role.fixture;
  }

  // Load narration cache for cue point timing
  const narrationCache = loadNarrationCache();
  const hasNarrationData = Object.keys(narrationCache).some(key => key.startsWith(flow.id));
  if (hasNarrationData) {
    console.log(`  Using cue points from narration cache for: ${flow.id}`);
  }

  const lines: string[] = [];

  // Header
  lines.push(`/**`);
  lines.push(` * ${flow.name}`);
  lines.push(` *`);
  lines.push(` * ${flow.description}`);
  lines.push(` *`);
  lines.push(` * Generated from: specs/${flow.id}.yaml`);
  lines.push(` * Priority: ${flow.priority}`);
  lines.push(` */`);
  lines.push(``);

  // Imports
  lines.push(fixtureImport);
  lines.push(`import { VerificationLogger } from "../utils/verification-logger";`);
  lines.push(`import { BusinessLogicVerifier } from "../lib/business-logic-verifier";`);
  lines.push(`import { createNarrator } from "../utils/audio-player";`);
  lines.push(`import * as fs from "fs/promises";`);
  lines.push(`import * as path from "path";`);
  lines.push(``);

  // Test describe block
  lines.push(`const logger = new VerificationLogger();`);
  lines.push(`const narrator = createNarrator("${flow.id}");`);
  lines.push(``);
  lines.push(`test.describe("${flow.name}", () => {`);

  // beforeEach
  lines.push(`  test.beforeEach(async () => {`);
  lines.push(`    logger.start();`);
  lines.push(`  });`);
  lines.push(``);

  // afterEach - save verification log
  lines.push(`  test.afterEach(async ({}, testInfo) => {`);
  lines.push(`    const outputDir = testInfo.outputDir;`);
  lines.push(`    const logPath = path.join(outputDir, "verifications.json");`);
  lines.push(``);
  lines.push(`    try {`);
  lines.push(`      await fs.mkdir(outputDir, { recursive: true });`);
  lines.push(`      await fs.writeFile(logPath, logger.toJSON());`);
  lines.push(`    } catch (error) {`);
  lines.push(`      console.warn("Could not save verification log:", error);`);
  lines.push(`    }`);
  lines.push(`  });`);
  lines.push(``);

  // Main test - longer timeout when narration may be enabled
  lines.push(`  test("${flow.id}: ${flow.description}", async ({`);
  lines.push(`    ${fixtureParams},`);
  lines.push(`  }) => {`);
  lines.push(`    // Increase timeout if narration is enabled (audio takes time)`);
  lines.push(`    if (narrator.isEnabled()) {`);
  lines.push(`      test.setTimeout(120000); // 2 minutes for narrated tests`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    const verifier = new BusinessLogicVerifier(logger);`);
  lines.push(``);
  // Determine first page variable for intro wait
  const firstPageVar = needsMultiRoleFixtures ? roles[0].fixture : "page";

  lines.push(`    // Get intro duration (will wait after first navigation)`);
  lines.push(`    const introDuration = await narrator.intro();`);
  lines.push(``);

  // Generate each step
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepNum = i + 1;
    const roleFixture = rolePageMap[step.role] || "page";

    // For multi-role or role-specific fixtures, use the fixture name
    // Otherwise use the default "page"
    const pageVar = needsMultiRoleFixtures ? roleFixture : "page";

    lines.push(`    // ═══════════════════════════════════════════════════════════════`);
    lines.push(`    // STEP ${stepNum}: ${step.description}`);
    lines.push(`    // Role: ${step.role}`);
    lines.push(`    // ═══════════════════════════════════════════════════════════════`);
    lines.push(`    const step${stepNum}Duration = await narrator.step(${stepNum});`);
    lines.push(`    logger.stepStart(${stepNum}, "${step.description}");`);
    if (needsMultiRoleFixtures) {
      lines.push(`    logger.log({ type: "action", description: "Role: ${step.role}", status: "info" });`);
    }
    lines.push(``);

    // For role-specific fixtures, create a scoped page variable
    // This allows action code to use `page` consistently
    if (needsMultiRoleFixtures) {
      lines.push(`    {`);
      lines.push(`      const page = ${pageVar};`);
      lines.push(``);
    }

    const indent = needsMultiRoleFixtures ? "      " : "    ";

    // Split actions into setup vs interactive
    // Setup = actions BEFORE the first click/fill (navigate, initial waitFor)
    // Interactive = first click/fill and everything after
    const allActions = step.actions || [];
    let firstInteractiveIndex = allActions.findIndex(a =>
      a.type === "click" || a.type === "fill"
    );
    if (firstInteractiveIndex === -1) {
      firstInteractiveIndex = allActions.length; // No interactive actions
    }

    const setupActions = allActions.slice(0, firstInteractiveIndex);
    const interactiveActions = allActions.slice(firstInteractiveIndex);

    // 1. SETUP ACTIONS: Navigate and wait for page to load
    if (setupActions.length > 0) {
      lines.push(`${indent}// Setup: Load page and wait for readiness`);
      for (const action of setupActions) {
        lines.push(generateActionCode(action, indent));
        lines.push(``);
      }
    }

    // 2. CUE POINT SYNCHRONIZED EXECUTION
    // Actions execute at their calculated timestamps WHILE narration describes them
    const stepTiming = getStepTiming(flow.id, stepNum, narrationCache);
    const hasCuePoints = stepTiming.cuePoints.length > 0;

    if (i === 0) {
      // First step: wait for intro first
      lines.push(`${indent}// Wait for intro narration (user sees page while intro plays)`);
      lines.push(`${indent}const introMs = ${Math.round(getIntroDuration(flow.id, narrationCache) * 1000)};`);
      lines.push(`${indent}if (introMs > 0) {`);
      lines.push(`${indent}  await page.waitForTimeout(introMs);`);
      lines.push(`${indent}}`);
      lines.push(``);
    }

    if (hasCuePoints) {
      // Use cue points for precise action timing
      lines.push(`${indent}// Execute actions at cue point timestamps (synchronized with narration)`);
      lines.push(`${indent}const stepStartTime = Date.now();`);
      lines.push(`${indent}const stepDurationMs = ${Math.round(stepTiming.duration * 1000)};`);
      lines.push(``);

      for (const cue of stepTiming.cuePoints) {
        const actionIndex = cue.actionIndex;
        const action = allActions[actionIndex];
        if (!action) continue;

        lines.push(`${indent}// Cue point [${cue.timestamp.toFixed(2)}s]: "${cue.phrase}"`);
        lines.push(`${indent}{`);
        lines.push(`${indent}  const targetMs = ${Math.round(cue.timestamp * 1000)};`);
        lines.push(`${indent}  const elapsed = Date.now() - stepStartTime;`);
        lines.push(`${indent}  if (elapsed < targetMs) {`);
        lines.push(`${indent}    await page.waitForTimeout(targetMs - elapsed);`);
        lines.push(`${indent}  }`);
        lines.push(generateActionCode(action, `${indent}  `));
        lines.push(`${indent}  await page.waitForTimeout(300); // Brief pause to see action`);
        lines.push(`${indent}}`);
        lines.push(``);
      }

      // Wait for remaining audio duration
      lines.push(`${indent}// Wait for remaining narration`);
      lines.push(`${indent}{`);
      lines.push(`${indent}  const elapsed = Date.now() - stepStartTime;`);
      lines.push(`${indent}  const remaining = stepDurationMs - elapsed;`);
      lines.push(`${indent}  if (remaining > 0) await page.waitForTimeout(remaining);`);
      lines.push(`${indent}}`);
      lines.push(``);
    } else {
      // No cue points - wait for narration then do actions sequentially
      lines.push(`${indent}// Wait for step narration (no cue points - sequential execution)`);
      lines.push(`${indent}const stepDurationMs = ${Math.round(stepTiming.duration * 1000)};`);
      lines.push(`${indent}if (stepDurationMs > 0) {`);
      lines.push(`${indent}  await page.waitForTimeout(stepDurationMs);`);
      lines.push(`${indent}}`);
      lines.push(``);

      // Execute any interactive actions after narration
      if (interactiveActions.length > 0) {
        lines.push(`${indent}// Interactive actions (after narration)`);
        for (const action of interactiveActions) {
          lines.push(generateActionCode(action, indent));
          if (action.type === "click" || action.type === "fill") {
            lines.push(`${indent}await page.waitForTimeout(500);`);
          }
          lines.push(``);
        }
      }
    }

    // Generate assertions
    if (step.assertions && step.assertions.length > 0) {
      lines.push(`${indent}// Assertions`);
      for (const assertion of step.assertions) {
        lines.push(generateAssertionCode(assertion, indent));
        lines.push(``);
      }
    }

    // Generate business logic checks
    if (step.businessLogic && step.businessLogic.length > 0) {
      lines.push(generateBusinessLogicCode(step.businessLogic, indent));
      lines.push(``);
    }

    if (needsMultiRoleFixtures) {
      lines.push(`    }`);
    }
    lines.push(``);

    // Brief pause after step completion to see the result
    if (i < steps.length - 1) {
      lines.push(`    // Brief pause to see step result before next role switch`);
      lines.push(`    await ${pageVar}.waitForTimeout(1000);`);
      lines.push(``);
    }
  }

  // Log final summary
  lines.push(`    // Final summary`);
  lines.push(`    const summary = logger.getSummary();`);
  lines.push(`    console.log(`);
  lines.push("      `\\n[Verification Summary] Total: ${summary.total}, Passed: ${summary.passed}, Duration: ${summary.duration}ms\\n`");
  lines.push(`    );`);
  lines.push(``);
  lines.push(`    const blSummary = verifier.getSummary();`);
  lines.push(`    console.log(`);
  lines.push("      `[Business Logic] Total: ${blSummary.total}, Passed: ${blSummary.passed}, Failed: ${blSummary.failed}\\n`");
  lines.push(`    );`);

  lines.push(`  });`);
  lines.push(`});`);
  lines.push(``);

  return lines.join("\n");
}

// ============================================================================
// MAIN
// ============================================================================

async function loadSpec(specName: string): Promise<FlowSpec> {
  const specPath = path.join(SPECS_DIR, `${specName}.yaml`);
  const content = await fs.readFile(specPath, "utf-8");
  return yaml.parse(content) as FlowSpec;
}

async function generateTest(specName: string): Promise<void> {
  console.log(`Generating test for: ${specName}`);

  const spec = await loadSpec(specName);
  const testCode = generateTestFile(spec);

  const outputPath = path.join(FLOWS_DIR, `${spec.flow.id}.spec.ts`);
  await fs.mkdir(FLOWS_DIR, { recursive: true });
  await fs.writeFile(outputPath, testCode, "utf-8");

  console.log(`  Created: ${outputPath}`);
}

async function generateAll(): Promise<void> {
  const files = await fs.readdir(SPECS_DIR);
  const yamlFiles = files.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

  console.log(`Found ${yamlFiles.length} spec files`);

  for (const file of yamlFiles) {
    const specName = file.replace(/\.ya?ml$/, "");
    await generateTest(specName);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage:");
    console.log("  npx tsx e2e/scripts/generate-tests.ts <spec-name>");
    console.log("  npx tsx e2e/scripts/generate-tests.ts --all");
    console.log("");
    console.log("Examples:");
    console.log("  npx tsx e2e/scripts/generate-tests.ts behavior-verification");
    console.log("  npx tsx e2e/scripts/generate-tests.ts --all");
    process.exit(1);
  }

  if (args[0] === "--all") {
    await generateAll();
  } else {
    await generateTest(args[0]);
  }

  console.log("\nDone!");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
