#!/usr/bin/env npx tsx
/**
 * Multi-Role Video Merger
 *
 * Merges videos from multiple browser contexts (staff, manager) into a single
 * synchronized video with audio narration.
 *
 * Algorithm:
 * 1. Load timeline from narration cache (step roles and durations)
 * 2. Identify which video belongs to which role
 * 3. Calculate trim points for each video segment
 * 4. Use FFmpeg filter_complex to concatenate segments
 * 5. Overlay combined audio track
 *
 * Usage:
 *   npx tsx e2e/scripts/merge-multi-role-video.ts behavior-verification
 */

import { execSync, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";

const E2E_DIR = path.join(__dirname, "..");
const AUDIO_DIR = path.join(E2E_DIR, "audio");
const SPECS_DIR = path.join(E2E_DIR, "specs");
const TEST_RESULTS_DIR = path.join(process.cwd(), "test-results");
const NARRATION_CACHE = path.join(AUDIO_DIR, ".narration-cache.json");

// ============================================================================
// TYPES
// ============================================================================

interface VideoSegment {
  role: string;
  videoPath: string;
  startTime: number; // Start time in final video (seconds)
  endTime: number; // End time in final video (seconds)
  trimStart: number; // Where to start in source video (seconds)
  trimEnd: number; // Where to end in source video (seconds)
}

interface StepTiming {
  stepNumber: number;
  role: string;
  duration: number;
  startTime: number;
  endTime: number;
}

interface NarrationCacheEntry {
  duration: number;
  role: string | null;
  step: number;
  type: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

function loadNarrationCache(): Record<string, NarrationCacheEntry> {
  if (fs.existsSync(NARRATION_CACHE)) {
    return JSON.parse(fs.readFileSync(NARRATION_CACHE, "utf-8"));
  }
  return {};
}

function loadSpec(flowId: string): { steps: Array<{ role: string }> } {
  const specPath = path.join(SPECS_DIR, `${flowId}.yaml`);
  if (fs.existsSync(specPath)) {
    const content = fs.readFileSync(specPath, "utf-8");
    return yaml.parse(content);
  }
  return { steps: [] };
}

function getVideoDuration(filePath: string): number {
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

function findTestResultFolder(flowId: string): string | null {
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    return null;
  }

  const folders = fs.readdirSync(TEST_RESULTS_DIR);
  const truncated = flowId.substring(0, 18);

  const matchingFolder = folders.find((f) => {
    if (!fs.statSync(path.join(TEST_RESULTS_DIR, f)).isDirectory()) {
      return false;
    }
    return f.includes(flowId) || f.includes(truncated);
  });

  return matchingFolder ? path.join(TEST_RESULTS_DIR, matchingFolder) : null;
}

function findVideoFiles(folderPath: string): string[] {
  const files = fs.readdirSync(folderPath);
  return files
    .filter((f) => f.endsWith(".webm") || (f.endsWith(".mp4") && f !== "narrated-video.mp4"))
    .map((f) => path.join(folderPath, f))
    // Sort by file SIZE descending - staff video is larger (more activity/duration)
    // This is more reliable than mtime which can vary based on context close order
    .sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
}

function getOrderedAudioFiles(flowId: string): string[] {
  const audioDir = path.join(AUDIO_DIR, flowId);

  if (!fs.existsSync(audioDir)) {
    return [];
  }

  const files = fs.readdirSync(audioDir).filter((f) => f.endsWith(".wav"));

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

function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`  FFmpeg: ${args.slice(0, 10).join(" ")}...`);
    const proc = spawn("ffmpeg", args, { stdio: "pipe" });

    let stderr = "";
    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error(stderr);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

// ============================================================================
// TIMELINE CALCULATION
// ============================================================================

function calculateTimeline(flowId: string): StepTiming[] {
  const cache = loadNarrationCache();
  const spec = loadSpec(flowId);
  const timeline: StepTiming[] = [];

  // Get intro duration
  const introEntry = cache[`${flowId}/intro`];
  let currentTime = introEntry?.duration || 0;

  // Calculate step timings
  for (let i = 0; i < spec.steps.length; i++) {
    const stepNum = i + 1;
    const step = spec.steps[i];
    const cacheKey = `${flowId}/step-${stepNum}`;
    const entry = cache[cacheKey];
    const duration = entry?.duration || 5; // Default 5 seconds

    timeline.push({
      stepNumber: stepNum,
      role: step.role,
      duration,
      startTime: currentTime,
      endTime: currentTime + duration,
    });

    currentTime += duration;
    currentTime += 1; // 1 second pause between steps
  }

  return timeline;
}

// ============================================================================
// VIDEO MERGING
// ============================================================================

async function mergeMultiRoleVideo(
  flowId: string,
  testFolder: string
): Promise<string | null> {
  console.log(`\n🎬 Merging multi-role video for: ${flowId}`);

  // 1. Find all video files
  const videoFiles = findVideoFiles(testFolder);
  console.log(`  Found ${videoFiles.length} video files`);

  if (videoFiles.length === 0) {
    console.error("  No video files found");
    return null;
  }

  // 2. Get timeline
  const timeline = calculateTimeline(flowId);
  console.log(`  Timeline: ${timeline.length} steps`);

  // 3. Identify videos by role
  // First video is usually staff, second is manager (based on fixture order)
  const staffVideo = videoFiles[0];
  const managerVideo = videoFiles.length > 1 ? videoFiles[1] : null;

  console.log(`  Staff video: ${path.basename(staffVideo)}`);
  if (managerVideo) {
    console.log(`  Manager video: ${path.basename(managerVideo)}`);
  }

  // 4. Get audio files
  const audioFiles = getOrderedAudioFiles(flowId);
  if (audioFiles.length === 0) {
    console.error("  No audio files found");
    return null;
  }

  // 5. Create combined audio
  const concatListPath = path.join(testFolder, "audio-concat.txt");
  const concatContent = audioFiles.map((f) => `file '${f}'`).join("\n");
  fs.writeFileSync(concatListPath, concatContent);

  const combinedAudioPath = path.join(testFolder, "combined-audio.wav");
  await runFFmpeg([
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concatListPath,
    "-c", "copy",
    combinedAudioPath,
  ]);

  // 6. Build video segments with correct offsets
  // Key insight: video_trim_time = audio_time + navigation_offset
  // Staff offset = ~2s (navigation at test start)
  // Manager offset = calculated from when manager actually navigates + page load time
  const NAVIGATION_TIME = 2.0; // Seconds for page.goto() + ready assertion
  const MANAGER_PAGE_LOAD_TIME = 10.0; // Extra time for manager page data to load

  const segments: VideoSegment[] = [];
  const cache = loadNarrationCache();

  // Staff video offset: navigation happens at start
  // Staff page is visible from NAVIGATION_TIME onwards
  const staffVideoOffset = NAVIGATION_TIME;

  // Manager video offset: calculated on first manager step
  let managerVideoOffset: number | null = null;

  // Get intro duration
  const introEntry = cache[`${flowId}/intro`];
  const introDuration = introEntry?.duration || 0;

  // INTRO SEGMENT: Show staff page (already visible after navigation)
  // Audio: 0-introDuration → Video: staff NAVIGATION_TIME to NAVIGATION_TIME+introDuration
  if (introDuration > 0) {
    segments.push({
      role: "STAFF",
      videoPath: staffVideo,
      startTime: 0,
      endTime: introDuration,
      trimStart: staffVideoOffset, // Skip navigation, start when UI visible
      trimEnd: staffVideoOffset + introDuration,
    });
  }

  // STEP SEGMENTS: Apply offset based on role
  for (const step of timeline) {
    const isManager = step.role === "MANAGER" && managerVideo;

    if (isManager) {
      // Calculate manager offset on first manager step
      if (managerVideoOffset === null) {
        // In video time, manager navigation starts after:
        //   staffVideoOffset + introDuration + all previous staff step durations + pauses
        // Then add NAVIGATION_TIME + MANAGER_PAGE_LOAD_TIME for when manager page content is actually visible
        const staffStepsBeforeManager = timeline
          .filter((s) => s.role === "STAFF" && s.stepNumber < step.stepNumber)
          .reduce((sum, s) => sum + s.duration + 1, 0); // +1 for pause between steps

        const videoTimeManagerNavigates =
          staffVideoOffset + introDuration + staffStepsBeforeManager;
        const videoTimeManagerContentVisible =
          videoTimeManagerNavigates + NAVIGATION_TIME + MANAGER_PAGE_LOAD_TIME;

        // Offset = video time - audio time
        managerVideoOffset = videoTimeManagerContentVisible - step.startTime;
        console.log(
          `  Manager offset: ${managerVideoOffset.toFixed(2)}s (content visible at ${videoTimeManagerContentVisible.toFixed(2)}s in video)`
        );
      }

      segments.push({
        role: step.role,
        videoPath: managerVideo!,
        startTime: step.startTime,
        endTime: step.endTime,
        trimStart: step.startTime + managerVideoOffset,
        trimEnd: step.endTime + managerVideoOffset,
      });
    } else {
      // Staff steps: use staff video offset
      segments.push({
        role: step.role,
        videoPath: staffVideo,
        startTime: step.startTime,
        endTime: step.endTime,
        trimStart: step.startTime + staffVideoOffset,
        trimEnd: step.endTime + staffVideoOffset,
      });
    }
  }

  console.log(`  Video segments:`);
  for (const seg of segments) {
    console.log(
      `    [${seg.startTime.toFixed(1)}-${seg.endTime.toFixed(1)}s] ${seg.role} (trim ${seg.trimStart.toFixed(1)}-${seg.trimEnd.toFixed(1)}s)`
    );
  }

  // 7. Create filter complex for multi-segment merge
  const outputPath = path.join(testFolder, "narrated-video.mp4");

  if (segments.length === 1 || !managerVideo) {
    // Simple case: single video source
    await runFFmpeg([
      "-y",
      "-i", staffVideo,
      "-i", combinedAudioPath,
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "22",
      "-c:a", "aac",
      "-b:a", "128k",
      "-map", "0:v",
      "-map", "1:a",
      outputPath,
    ]);
  } else {
    // Complex case: multiple video sources with segment concatenation
    const filterParts: string[] = [];
    const inputs: string[] = [];
    const uniqueVideos = [...new Set(segments.map((s) => s.videoPath))];

    // Add inputs
    for (const video of uniqueVideos) {
      inputs.push("-i", video);
    }
    inputs.push("-i", combinedAudioPath);

    // Build filter for each segment
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const inputIdx = uniqueVideos.indexOf(seg.videoPath);
      filterParts.push(
        `[${inputIdx}:v]trim=start=${seg.trimStart}:end=${seg.trimEnd},setpts=PTS-STARTPTS[v${i}]`
      );
    }

    // Concatenate all segments
    const concatInputs = segments.map((_, i) => `[v${i}]`).join("");
    filterParts.push(`${concatInputs}concat=n=${segments.length}:v=1[outv]`);

    const audioInputIdx = uniqueVideos.length;

    await runFFmpeg([
      "-y",
      ...inputs,
      "-filter_complex", filterParts.join(";"),
      "-map", "[outv]",
      "-map", `${audioInputIdx}:a`,
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "22",
      "-c:a", "aac",
      "-b:a", "128k",
      outputPath,
    ]);
  }

  // 8. Clean up
  fs.unlinkSync(concatListPath);
  fs.unlinkSync(combinedAudioPath);

  console.log(`  ✓ Created: ${outputPath}`);
  return outputPath;
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: npx tsx e2e/scripts/merge-multi-role-video.ts <flow-id>");
    console.log("");
    console.log("Example:");
    console.log("  npx tsx e2e/scripts/merge-multi-role-video.ts behavior-verification");
    process.exit(1);
  }

  const flowId = args[0];
  const testFolder = findTestResultFolder(flowId);

  if (!testFolder) {
    console.error(`No test result folder found for: ${flowId}`);
    process.exit(1);
  }

  try {
    const outputPath = await mergeMultiRoleVideo(flowId, testFolder);
    if (outputPath) {
      console.log("\n✓ Done! Open with:");
      console.log(`  open "${outputPath}"`);
    }
  } catch (error) {
    console.error("Error merging video:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { mergeMultiRoleVideo };
