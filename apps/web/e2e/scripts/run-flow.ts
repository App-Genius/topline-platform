#!/usr/bin/env npx tsx
/**
 * Flow Runner Script
 *
 * Single command to run a specific E2E flow test.
 *
 * Usage:
 *   npx tsx e2e/scripts/run-flow.ts behavior-verification
 *   npx tsx e2e/scripts/run-flow.ts behavior-verification --record
 *   npx tsx e2e/scripts/run-flow.ts behavior-verification --headed
 *   npx tsx e2e/scripts/run-flow.ts behavior-verification --debug
 *   npx tsx e2e/scripts/run-flow.ts behavior-verification --narrate
 *
 * Options:
 *   --record    Use hq-recording project (1080p video)
 *   --headed    Run in headed mode (visible browser)
 *   --debug     Enable Playwright debug mode
 *   --generate  Regenerate test from YAML before running
 *   --narrate   Enable audio narration (generates audio if needed)
 */

import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";
import { mergeMultiRoleVideo } from "./merge-multi-role-video";

// Paths
const FLOWS_DIR = path.join(__dirname, "..", "flows");
const SPECS_DIR = path.join(__dirname, "..", "specs");
const TEST_RESULTS_DIR = path.join(process.cwd(), "test-results");

/**
 * Find the test result folder for a flow
 */
async function findTestResultFolder(flowId: string): Promise<string | null> {
  try {
    const folders = await fs.readdir(TEST_RESULTS_DIR);
    const truncated = flowId.substring(0, 18);

    const matchingFolder = folders.find((f) => {
      return f.includes(flowId) || f.includes(truncated);
    });

    return matchingFolder ? path.join(TEST_RESULTS_DIR, matchingFolder) : null;
  } catch {
    return null;
  }
}

interface Options {
  record: boolean;
  headed: boolean;
  debug: boolean;
  generate: boolean;
  narrate: boolean;
}

function parseArgs(): { flowName: string; options: Options } {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0].startsWith("-")) {
    console.log("Usage: npx tsx e2e/scripts/run-flow.ts <flow-name> [options]");
    console.log("");
    console.log("Options:");
    console.log("  --record    Use hq-recording project (1080p video)");
    console.log("  --headed    Run in headed mode (visible browser)");
    console.log("  --debug     Enable Playwright debug mode");
    console.log("  --generate  Regenerate test from YAML before running");
    console.log("  --narrate   Enable audio narration (generates audio if needed)");
    console.log("");
    console.log("Examples:");
    console.log("  npx tsx e2e/scripts/run-flow.ts behavior-verification");
    console.log("  npx tsx e2e/scripts/run-flow.ts behavior-verification --record --headed");
    console.log("  npx tsx e2e/scripts/run-flow.ts behavior-verification --record --narrate");
    process.exit(1);
  }

  const flowName = args[0];
  const options: Options = {
    record: args.includes("--record"),
    headed: args.includes("--headed"),
    debug: args.includes("--debug"),
    generate: args.includes("--generate"),
    narrate: args.includes("--narrate"),
  };

  return { flowName, options };
}

async function generateFromSpec(flowName: string): Promise<void> {
  const specPath = path.join(SPECS_DIR, `${flowName}.yaml`);

  try {
    await fs.access(specPath);
  } catch {
    console.log(`No spec found at ${specPath}, skipping generation`);
    return;
  }

  console.log(`Generating test from spec: ${flowName}.yaml`);

  return new Promise((resolve, reject) => {
    const proc = spawn(
      "npx",
      ["tsx", "e2e/scripts/generate-tests.ts", flowName],
      {
        cwd: path.join(__dirname, "../.."),
        stdio: "inherit",
      }
    );

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Generate failed with code ${code}`));
      }
    });
  });
}

async function generateNarration(flowName: string): Promise<void> {
  const audioDir = path.join(__dirname, "..", "audio", flowName);

  // Check if audio already exists
  try {
    const files = await fs.readdir(audioDir);
    if (files.some((f) => f.endsWith(".wav"))) {
      console.log(`Audio narration found for ${flowName}`);
      return;
    }
  } catch {
    // Directory doesn't exist, need to generate
  }

  console.log(`Generating audio narration for: ${flowName}`);

  return new Promise((resolve, reject) => {
    const proc = spawn(
      "python",
      ["e2e/scripts/generate-narration.py", flowName],
      {
        cwd: path.join(__dirname, "../.."),
        stdio: "inherit",
        env: {
          ...process.env,
          PATH: `${path.join(__dirname, "..", ".venv", "bin")}:${process.env.PATH}`,
        },
      }
    );

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Narration generation failed with code ${code}`));
      }
    });
  });
}

async function runFlow(flowName: string, options: Options): Promise<void> {
  const testPath = path.join(FLOWS_DIR, `${flowName}.spec.ts`);

  // Check if test file exists
  try {
    await fs.access(testPath);
  } catch {
    console.error(`Test file not found: ${testPath}`);
    console.log("");
    console.log("Available flows:");
    const files = await fs.readdir(FLOWS_DIR);
    for (const file of files) {
      if (file.endsWith(".spec.ts")) {
        console.log(`  - ${file.replace(".spec.ts", "")}`);
      }
    }
    process.exit(1);
  }

  // Build Playwright command
  const playwrightArgs = ["playwright", "test", testPath];

  // Project selection
  if (options.record) {
    playwrightArgs.push("--project=hq-recording");
  } else {
    playwrightArgs.push("--project=chromium");
  }

  // Headed mode
  if (options.headed) {
    playwrightArgs.push("--headed");
  }

  // Debug mode
  if (options.debug) {
    playwrightArgs.push("--debug");
  }

  console.log("");
  console.log(`Running: npx ${playwrightArgs.join(" ")}`);
  console.log("");

  return new Promise((resolve, reject) => {
    const proc = spawn("npx", playwrightArgs, {
      cwd: path.join(__dirname, "../.."),
      stdio: "inherit",
      env: {
        ...process.env,
        PWDEBUG: options.debug ? "1" : undefined,
        E2E_NARRATE: options.narrate ? "1" : undefined,
      },
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Playwright exited with code ${code}`));
      }
    });
  });
}

async function main() {
  const { flowName, options } = parseArgs();

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log(`║  Running Flow: ${flowName.padEnd(45)}║`);
  console.log("╠════════════════════════════════════════════════════════════╣");
  console.log(`║  Recording: ${options.record ? "Yes (1080p)" : "No".padEnd(40)}║`);
  console.log(`║  Headed: ${options.headed ? "Yes" : "No".padEnd(48)}║`);
  console.log(`║  Debug: ${options.debug ? "Yes" : "No".padEnd(49)}║`);
  console.log(`║  Narrate: ${options.narrate ? "Yes (audio)" : "No".padEnd(43)}║`);
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    // Generate from spec if requested
    if (options.generate) {
      await generateFromSpec(flowName);
    }

    // Generate narration if requested
    if (options.narrate) {
      await generateNarration(flowName);
    }

    // Run the flow
    await runFlow(flowName, options);

    console.log("");
    console.log("✓ Flow completed successfully!");
    console.log("");

    // Post-process: Create narrated video if both narrate and record are enabled
    if (options.narrate && options.record) {
      console.log("Post-processing: Creating multi-role narrated video...");
      const testFolder = await findTestResultFolder(flowName);
      if (testFolder) {
        const narratedPath = await mergeMultiRoleVideo(flowName, testFolder);
        if (narratedPath) {
          console.log("");
          console.log("✓ Narrated video created!");
          console.log(`  ${narratedPath}`);
        }
      } else {
        console.log("Could not find test result folder for post-processing");
      }
    }

    if (options.record) {
      console.log("");
      console.log("Video and traces saved to: test-results/");
      console.log("View results: npx playwright show-report");
    }
  } catch (error) {
    console.error("");
    console.error("✗ Flow failed:", error);
    process.exit(1);
  }
}

main();
