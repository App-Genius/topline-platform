/**
 * Cue Point Calculator
 *
 * Algorithmically calculates when actions should execute based on
 * their position in the narration text.
 *
 * Core algorithm:
 *   speaking_rate = text_length / audio_duration
 *   action_timestamp = character_position / speaking_rate
 *
 * This allows actions to execute WHILE the narrator describes them,
 * not before or after.
 */

export interface CuePoint {
  timestamp: number; // Seconds into the audio when action should execute
  actionIndex: number; // Index of action in the step's action array
  phrase: string; // The phrase in narration that describes this action
  selector: string; // The element selector for the action
  type: "click" | "fill"; // Action type
}

export interface StepTiming {
  stepNumber: number;
  role: string;
  audioDuration: number; // Total audio duration in seconds
  narrationText: string;
  cuePoints: CuePoint[];
  videoStartTime: number; // When this step starts in final merged video
  videoEndTime: number; // When this step ends in final merged video
}

export interface FlowTiming {
  flowId: string;
  totalDuration: number;
  introDuration: number;
  steps: StepTiming[];
}

export interface Action {
  type: string;
  selector?: string;
  url?: string;
  text?: string;
  value?: string;
}

/**
 * Generate possible phrases that might describe an action in narration text.
 * Used to find where in the narration an action is being described.
 */
function extractActionPhrases(action: Action): string[] {
  const phrases: string[] = [];

  if (action.type === "click" && action.selector) {
    // Extract text from selector (e.g., "text=Upsell Wine" -> "Upsell Wine")
    const selectorText = action.selector
      .replace(/^text=/, "")
      .replace(/^"/, "")
      .replace(/"$/, "");

    // Generate variations of how this action might be described
    phrases.push(
      // Verb + button name variations
      `taps the ${selectorText}`,
      `clicks the ${selectorText}`,
      `taps ${selectorText}`,
      `clicks ${selectorText}`,
      `click the ${selectorText}`,
      `tap the ${selectorText}`,
      `presses the ${selectorText}`,
      `presses ${selectorText}`,
      `selects the ${selectorText}`,
      `selects ${selectorText}`,
      // Just the button name as fallback
      selectorText.toLowerCase()
    );

    // Handle "Tap again" / confirmation patterns
    if (
      selectorText.toLowerCase().includes("again") ||
      selectorText.toLowerCase().includes("confirm")
    ) {
      phrases.unshift(
        "confirms with a second tap",
        "confirms the action",
        "taps again to confirm",
        "second tap"
      );
    }
  }

  if (action.type === "fill" && action.selector) {
    const selectorText = action.selector
      .replace(/^text=/, "")
      .replace(/\[.*\]/, "");

    phrases.push(
      `enters ${action.value || ""}`,
      `types ${action.value || ""}`,
      `fills in ${selectorText}`,
      `inputs ${action.value || ""}`
    );
  }

  return phrases.filter((p) => p.length > 0);
}

/**
 * Calculate cue points for a step's actions based on narration text.
 *
 * Algorithm:
 * 1. Calculate speaking rate (chars/second) from text length and audio duration
 * 2. For each interactive action, find where it's described in the narration
 * 3. Calculate timestamp based on character position
 */
export function calculateCuePoints(
  narrationText: string,
  audioDuration: number,
  actions: Action[]
): CuePoint[] {
  if (!narrationText || audioDuration <= 0) {
    return [];
  }

  // Calculate speaking rate
  const charsPerSecond = narrationText.length / audioDuration;
  const cuePoints: CuePoint[] = [];

  // Track which character positions have been used to avoid duplicates
  const usedPositions: number[] = [];

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    // Only calculate cue points for interactive actions
    if (action.type !== "click" && action.type !== "fill") {
      continue;
    }

    // Get possible phrases that describe this action
    const phrases = extractActionPhrases(action);
    let foundMatch = false;

    for (const phrase of phrases) {
      // Search for phrase in narration (case-insensitive)
      const lowerNarration = narrationText.toLowerCase();
      const lowerPhrase = phrase.toLowerCase();
      let charPos = lowerNarration.indexOf(lowerPhrase);

      // If position already used, look for next occurrence
      while (charPos >= 0 && usedPositions.includes(charPos)) {
        charPos = lowerNarration.indexOf(lowerPhrase, charPos + 1);
      }

      if (charPos >= 0) {
        // Calculate timestamp from character position
        const timestamp = charPos / charsPerSecond;

        cuePoints.push({
          timestamp: Math.round(timestamp * 100) / 100, // Round to 2 decimal places
          actionIndex: i,
          phrase,
          selector: action.selector || "",
          type: action.type as "click" | "fill",
        });

        usedPositions.push(charPos);
        foundMatch = true;
        break;
      }
    }

    // If no phrase match found, estimate based on action order
    if (!foundMatch && action.selector) {
      // Distribute unmatched actions evenly across the audio
      const interactiveCount = actions.filter(
        (a) => a.type === "click" || a.type === "fill"
      ).length;
      const position =
        cuePoints.length / Math.max(interactiveCount, 1);
      const estimatedTimestamp =
        (audioDuration * 0.3) + (position * audioDuration * 0.5);

      cuePoints.push({
        timestamp: Math.round(estimatedTimestamp * 100) / 100,
        actionIndex: i,
        phrase: `[estimated: ${action.selector}]`,
        selector: action.selector,
        type: action.type as "click" | "fill",
      });
    }
  }

  // Sort by timestamp to ensure correct execution order
  return cuePoints.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Build complete flow timing from YAML spec and audio durations.
 */
export function buildFlowTiming(
  flowId: string,
  introDuration: number,
  steps: Array<{
    stepNumber: number;
    role: string;
    narrationText: string;
    audioDuration: number;
    actions: Action[];
  }>
): FlowTiming {
  let currentTime = 0;
  const stepTimings: StepTiming[] = [];

  // Add intro duration
  currentTime += introDuration;

  for (const step of steps) {
    const cuePoints = calculateCuePoints(
      step.narrationText,
      step.audioDuration,
      step.actions
    );

    // Calculate step duration including action pauses
    const actionPauseTime = cuePoints.length * 0.5; // 500ms per action
    const stepDuration = step.audioDuration + actionPauseTime;

    stepTimings.push({
      stepNumber: step.stepNumber,
      role: step.role,
      audioDuration: step.audioDuration,
      narrationText: step.narrationText,
      cuePoints,
      videoStartTime: currentTime,
      videoEndTime: currentTime + stepDuration,
    });

    currentTime += stepDuration;
  }

  return {
    flowId,
    totalDuration: currentTime,
    introDuration,
    steps: stepTimings,
  };
}

/**
 * Format cue points for debugging/verification.
 */
export function formatCuePointsDebug(timing: StepTiming): string {
  const lines: string[] = [];

  lines.push(`Step ${timing.stepNumber} (${timing.role}):`);
  lines.push(`  Narration: "${timing.narrationText.substring(0, 60)}..."`);
  lines.push(`  Duration: ${timing.audioDuration.toFixed(2)}s`);
  lines.push(`  Speaking rate: ${(timing.narrationText.length / timing.audioDuration).toFixed(2)} chars/sec`);
  lines.push(`  Cue points:`);

  for (const cue of timing.cuePoints) {
    lines.push(`    [${cue.timestamp.toFixed(2)}s] ${cue.type}: "${cue.phrase}" → ${cue.selector}`);
  }

  return lines.join("\n");
}
