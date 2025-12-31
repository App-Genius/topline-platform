# Audio-Narrated E2E Tests Feature

**Status**: Future Enhancement
**Priority**: Nice-to-have
**Created**: 2025-01-01

---

## Overview

Enhance E2E test recordings with **spoken audio narration** powered by MLX-Audio (Apple Silicon TTS library). When enabled, tests play audio descriptions of each step, making flows easier to understand without reading code.

---

## Why Audio Narration?

- **Accessibility**: Review test flows without reading code
- **Developer Experience**: Debug with audio walkthroughs
- **Self-Documenting**: Video recordings that explain themselves
- **Stakeholder Demos**: Non-technical viewers can follow along

---

## Proposed Implementation

### 1. YAML Spec Enhancement

Add `narration` fields to flow steps:

```yaml
steps:
  - id: staff-logs-behavior
    role: STAFF
    description: "Staff member logs a wine upsell behavior"
    narration: "Sam, a server, taps the Upsell Wine button to log that he suggested a bottle of wine to a table."

    actions:
      - type: navigate
        url: /staff
        narration: "Opening the staff dashboard"

      - type: click
        selector: "text=Upsell Wine"
        narration: "Tapping on Upsell Wine"

      - type: click
        selector: "text=Tap again"
        narration: "Confirming the behavior with a second tap"
```

### 2. Audio Pre-Generation Script

Generate audio files before test runs:

```bash
npx tsx e2e/scripts/generate-narration.ts behavior-verification
```

This would:
1. Parse YAML spec for all `narration` fields
2. Call MLX-Audio to generate .mp3 files
3. Cache audio in `e2e/audio/<flow-id>/<step-id>.mp3`

### 3. Flow Runner Flag

Add `--narrate` flag to runner:

```bash
# Silent (current behavior)
npx tsx e2e/scripts/run-flow.ts behavior-verification --record

# With audio narration
npx tsx e2e/scripts/run-flow.ts behavior-verification --record --narrate
```

### 4. Audio Playback Integration

During test execution with `--narrate`:

```typescript
async function playNarration(audioPath: string): Promise<void> {
  // Play audio and wait for completion before next action
  await execPromise(`afplay ${audioPath}`);
}

// In test step
if (narrationEnabled) {
  await playNarration(`e2e/audio/${flowId}/${stepId}.mp3`);
}
await page.click(selector);
```

### 5. Video + Audio Merge

Post-process to embed audio into video:

```bash
ffmpeg -i video.webm -i narration.mp3 -c:v copy -c:a aac output.mp4
```

---

## Technical Requirements

### MLX-Audio Setup

```bash
pip install mlx-audio
```

Example usage:
```python
from mlx_audio.tts import TTS

tts = TTS(model="lucasnewman/f5-tts-mlx")
audio = tts.generate("Sam taps the Upsell Wine button")
audio.save("step-1.mp3")
```

### Dependencies

- MLX-Audio (Python, Apple Silicon only)
- ffmpeg (for video/audio merge)
- afplay (macOS audio playback)

---

## File Structure

```
e2e/
├── scripts/
│   ├── generate-narration.ts   # Pre-generate audio from YAML
│   └── run-flow.ts             # Add --narrate flag
├── audio/                       # Generated audio cache
│   └── behavior-verification/
│       ├── step-1.mp3
│       ├── step-2.mp3
│       └── ...
└── specs/
    └── behavior-verification.yaml  # With narration fields
```

---

## Example Narration Script

For behavior-verification flow:

| Step | Narration |
|------|-----------|
| 1 | "Sam, a server at AC Hotel, opens his staff dashboard to log behaviors from his current shift." |
| 2 | "He taps on Upsell Wine to record that he recommended a wine pairing to a table." |
| 3 | "A second tap confirms the behavior. The system now shows his action in the My Actions section." |
| 4 | "Meanwhile, Sarah, the manager, opens the verification page to review pending behaviors." |
| 5 | "She sees Sam's wine upsell waiting for verification and clicks the green checkmark to confirm it." |
| 6 | "Back on Sam's dashboard, his behavior now shows as verified, counting toward his performance score." |

---

## Considerations

- **Platform**: MLX-Audio requires Apple Silicon (M1/M2/M3)
- **Performance**: Pre-generate audio to avoid runtime delays
- **Caching**: Only regenerate when narration text changes
- **CI/CD**: Skip narration in CI (Linux servers don't have MLX)

---

## Next Steps (When Ready)

1. [ ] Install MLX-Audio and verify TTS quality
2. [ ] Add narration fields to behavior-verification.yaml
3. [ ] Create generate-narration.ts script
4. [ ] Add --narrate flag to run-flow.ts
5. [ ] Test end-to-end with video + audio output
6. [ ] Update viewer to play audio with video
