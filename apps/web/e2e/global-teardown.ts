/**
 * Playwright Global Teardown
 *
 * Runs after all tests complete to generate the self-contained viewer.
 */

import { execSync } from "child_process";
import * as path from "path";

export default async function globalTeardown() {
  const projectRoot = path.resolve(__dirname, "..");

  try {
    console.log("\n📺 Generating test viewer...");
    execSync("npx tsx e2e/utils/generate-viewer.ts", {
      cwd: projectRoot,
      stdio: "inherit",
    });
  } catch (error) {
    console.warn("Could not generate viewer:", error);
  }
}
