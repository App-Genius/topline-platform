/**
 * Audio Player for E2E Test Narration
 *
 * Provides audio duration information for pacing test execution.
 * Audio is merged with video in post-processing via FFmpeg.
 * Only active when E2E_NARRATE=1 environment variable is set.
 */

import { spawn, execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

const E2E_DIR = path.join(__dirname, "..");
const AUDIO_DIR = path.join(E2E_DIR, "audio");

/**
 * Check if narration is enabled via environment variable
 */
export function isNarrationEnabled(): boolean {
  return process.env.E2E_NARRATE === "1";
}

/**
 * Get the audio file path for a flow step
 */
export function getAudioPath(flowId: string, stepIndex: number): string | null {
  const prefix = stepIndex === 0 ? "intro" : `step-${stepIndex}`;
  const pattern = `${flowId}-${prefix}`;
  const audioDir = path.join(AUDIO_DIR, flowId);

  if (!fs.existsSync(audioDir)) {
    return null;
  }

  const files = fs.readdirSync(audioDir);
  const audioFile = files.find((f) => f.startsWith(pattern) && f.endsWith(".wav"));

  if (!audioFile) {
    return null;
  }

  return path.join(audioDir, audioFile);
}

/**
 * Get the duration of an audio file in milliseconds using ffprobe
 */
export function getAudioDuration(filePath: string): number {
  if (!fs.existsSync(filePath)) {
    return 0;
  }

  try {
    const result = execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: "utf-8" }
    );
    const seconds = parseFloat(result.trim());
    return Math.round(seconds * 1000); // Convert to milliseconds
  } catch (error) {
    console.warn(`Could not get duration for ${filePath}:`, error);
    return 0;
  }
}

/**
 * Get all audio files for a flow in order (intro, step-1, step-2, ...)
 */
export function getOrderedAudioFiles(flowId: string): string[] {
  const audioDir = path.join(AUDIO_DIR, flowId);

  if (!fs.existsSync(audioDir)) {
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
 * Play an audio file and wait for it to complete
 */
export async function playAudio(filePath: string): Promise<void> {
  if (!fs.existsSync(filePath)) {
    console.log(`Audio file not found: ${filePath}`);
    return;
  }

  return new Promise((resolve, reject) => {
    // Use afplay on macOS (built-in audio player)
    const proc = spawn("afplay", [filePath], {
      stdio: "ignore",
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        // Don't fail the test if audio fails to play
        console.log(`Audio playback failed with code ${code}`);
        resolve();
      }
    });

    proc.on("error", (err) => {
      // Don't fail the test if audio player is not available
      console.log(`Audio playback error: ${err.message}`);
      resolve();
    });
  });
}

/**
 * Play narration for a specific step if narration is enabled
 */
export async function narrateStep(flowId: string, stepIndex: number): Promise<void> {
  if (!isNarrationEnabled()) {
    return;
  }

  const audioPath = getAudioPath(flowId, stepIndex);
  if (audioPath) {
    await playAudio(audioPath);
  }
}

/**
 * Get the wait duration for a step (audio duration in ms)
 * Returns 0 if narration is not enabled or audio not found
 */
export function getStepDuration(flowId: string, stepIndex: number): number {
  if (!isNarrationEnabled()) {
    return 0;
  }

  const audioPath = getAudioPath(flowId, stepIndex);
  if (!audioPath) {
    return 0;
  }

  return getAudioDuration(audioPath);
}

/**
 * Create a narrator helper bound to a specific flow
 *
 * When narration is enabled:
 * - Returns audio durations for pacing test execution
 * - Plays audio locally if E2E_PLAY_AUDIO=1 (optional, for debugging)
 *
 * The actual audio is merged with video in post-processing via FFmpeg.
 */
export function createNarrator(flowId: string) {
  const playLocally = process.env.E2E_PLAY_AUDIO === "1";

  return {
    /**
     * Process intro narration (step 0)
     * Returns duration in ms for pacing
     */
    async intro(): Promise<number> {
      const duration = getStepDuration(flowId, 0);
      if (playLocally && duration > 0) {
        await narrateStep(flowId, 0);
      }
      return duration;
    },

    /**
     * Process narration for a specific step (1-indexed)
     * Returns duration in ms for pacing
     */
    async step(stepNumber: number): Promise<number> {
      const duration = getStepDuration(flowId, stepNumber);
      if (playLocally && duration > 0) {
        await narrateStep(flowId, stepNumber);
      }
      return duration;
    },

    /**
     * Check if narration is enabled
     */
    isEnabled(): boolean {
      return isNarrationEnabled();
    },

    /**
     * Get total estimated duration for the flow
     */
    getTotalDuration(): number {
      const audioFiles = getOrderedAudioFiles(flowId);
      return audioFiles.reduce((sum, file) => sum + getAudioDuration(file), 0);
    },
  };
}
