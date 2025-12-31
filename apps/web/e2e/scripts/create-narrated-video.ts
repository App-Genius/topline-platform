#!/usr/bin/env npx tsx
/**
 * Create Narrated Video
 *
 * Post-processing script that merges audio narration with test video using FFmpeg.
 *
 * Usage:
 *   npx tsx e2e/scripts/create-narrated-video.ts behavior-verification
 *
 * Requires:
 *   - FFmpeg installed and in PATH
 *   - Audio files in e2e/audio/<flow-id>/
 *   - Video file in test-results/<test-folder>/
 */

import { execSync, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

const E2E_DIR = path.join(__dirname, "..");
const AUDIO_DIR = path.join(E2E_DIR, "audio");
const TEST_RESULTS_DIR = path.join(process.cwd(), "test-results");

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get all audio files for a flow in order (intro, step-1, step-2, ...)
 */
function getOrderedAudioFiles(flowId: string): string[] {
  const audioDir = path.join(AUDIO_DIR, flowId);

  if (!fs.existsSync(audioDir)) {
    console.error(`Audio directory not found: ${audioDir}`);
    return [];
  }

  const files = fs.readdirSync(audioDir).filter((f) => f.endsWith(".wav"));

  // Sort by step number (intro = 0, step-1 = 1, step-2 = 2, etc.)
  return files
    .map((f) => {
      const match = f.match(/-(intro|step-(\d+))_/);
      const order = match
        ? match[1] === "intro"
          ? 0
          : parseInt(match[2], 10)
        : 999;
      return { file: path.join(audioDir, f), order };
    })
    .sort((a, b) => a.order - b.order)
    .map((item) => item.file);
}

/**
 * Find the test result folder for a flow
 * Handles truncated names (e.g., "behavior-verificatio" for "behavior-verification")
 */
function findTestResultFolder(flowId: string): string | null {
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    return null;
  }

  const folders = fs.readdirSync(TEST_RESULTS_DIR);

  // Try exact match first, then partial match (for truncated names)
  const matchingFolder = folders.find((f) => {
    if (!fs.statSync(path.join(TEST_RESULTS_DIR, f)).isDirectory()) {
      return false;
    }
    // Exact match
    if (f.includes(flowId)) {
      return true;
    }
    // Partial match - check if folder starts with truncated flow id
    // e.g., "flows-behavior-verificatio-" matches "behavior-verification"
    const truncated = flowId.substring(0, 18); // Playwright truncates at ~18 chars
    return f.includes(truncated);
  });

  return matchingFolder ? path.join(TEST_RESULTS_DIR, matchingFolder) : null;
}

/**
 * Find video file in a folder
 */
function findVideoFile(folderPath: string): string | null {
  const files = fs.readdirSync(folderPath);
  const videoFile = files.find((f) => f.endsWith(".webm") || f.endsWith(".mp4"));
  return videoFile ? path.join(folderPath, videoFile) : null;
}

/**
 * Get audio duration using ffprobe
 */
function getAudioDuration(filePath: string): number {
  try {
    const result = execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: "utf-8" }
    );
    return parseFloat(result.trim());
  } catch {
    return 0;
  }
}

/**
 * Run FFmpeg command
 */
function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: "inherit" });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

// ============================================================================
// MAIN PROCESSING
// ============================================================================

export async function createNarratedVideo(flowId: string): Promise<string | null> {
  console.log(`\n Creating narrated video for: ${flowId}`);

  // 1. Find audio files
  const audioFiles = getOrderedAudioFiles(flowId);
  if (audioFiles.length === 0) {
    console.error("No audio files found for flow:", flowId);
    return null;
  }
  console.log(`  Found ${audioFiles.length} audio files`);

  // 2. Find test result folder and video
  const testFolder = findTestResultFolder(flowId);
  if (!testFolder) {
    console.error("No test result folder found for flow:", flowId);
    return null;
  }

  const videoFile = findVideoFile(testFolder);
  if (!videoFile) {
    console.error("No video file found in:", testFolder);
    return null;
  }
  console.log(`  Video: ${path.basename(videoFile)}`);

  // 3. Calculate total audio duration
  let totalAudioDuration = 0;
  for (const file of audioFiles) {
    totalAudioDuration += getAudioDuration(file);
  }
  console.log(`  Total audio duration: ${totalAudioDuration.toFixed(1)}s`);

  // 4. Create concat list file for FFmpeg
  const concatListPath = path.join(testFolder, "audio-concat.txt");
  const concatContent = audioFiles.map((f) => `file '${f}'`).join("\n");
  fs.writeFileSync(concatListPath, concatContent);
  console.log(`  Created concat list: ${concatListPath}`);

  // 5. Concatenate audio files
  const combinedAudioPath = path.join(testFolder, "combined-audio.wav");
  console.log("  Concatenating audio files...");

  await runFFmpeg([
    "-y", // Overwrite output
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatListPath,
    "-c",
    "copy",
    combinedAudioPath,
  ]);

  // 6. Merge audio with video
  const outputPath = path.join(testFolder, "narrated-video.mp4");
  console.log("  Merging audio with video...");

  await runFFmpeg([
    "-y", // Overwrite output
    "-i",
    videoFile, // Input video
    "-i",
    combinedAudioPath, // Input audio
    "-c:v",
    "libx264", // Re-encode video for MP4 compatibility
    "-preset",
    "fast",
    "-crf",
    "22",
    "-c:a",
    "aac", // AAC audio codec
    "-b:a",
    "128k",
    "-map",
    "0:v", // Video from first input
    "-map",
    "1:a", // Audio from second input
    // No -shortest: let video play full length (audio ends, video continues)
    outputPath,
  ]);

  // 7. Clean up intermediate files
  fs.unlinkSync(concatListPath);
  fs.unlinkSync(combinedAudioPath);

  console.log(`  Created: ${outputPath}`);
  return outputPath;
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: npx tsx e2e/scripts/create-narrated-video.ts <flow-id>");
    console.log("");
    console.log("Example:");
    console.log("  npx tsx e2e/scripts/create-narrated-video.ts behavior-verification");
    process.exit(1);
  }

  const flowId = args[0];

  try {
    const outputPath = await createNarratedVideo(flowId);
    if (outputPath) {
      console.log("\n Done! Open with:");
      console.log(`  open "${outputPath}"`);
    }
  } catch (error) {
    console.error("Error creating narrated video:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
