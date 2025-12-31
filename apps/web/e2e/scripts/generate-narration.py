#!/usr/bin/env python3
"""
Narration Generator for E2E Tests

Generates audio narration files from YAML flow specifications using MLX-Audio.
Audio files are cached and only regenerated when narration text changes.

Usage:
    python e2e/scripts/generate-narration.py behavior-verification
    python e2e/scripts/generate-narration.py --all

Output:
    e2e/audio/<flow-id>/step-<n>.wav
"""

import os
import sys
import yaml
import hashlib
import json
import subprocess
import re
from pathlib import Path

# Add the venv to path
SCRIPT_DIR = Path(__file__).parent
E2E_DIR = SCRIPT_DIR.parent
VENV_SITE_PACKAGES = E2E_DIR / ".venv" / "lib" / "python3.11" / "site-packages"
if VENV_SITE_PACKAGES.exists():
    sys.path.insert(0, str(VENV_SITE_PACKAGES))

from mlx_audio.tts.generate import generate_audio

# Paths
SPECS_DIR = E2E_DIR / "specs"
AUDIO_DIR = E2E_DIR / "audio"
CACHE_FILE = AUDIO_DIR / ".narration-cache.json"

# TTS settings - Kokoro is the highest quality MLX-Audio model
TTS_MODEL = "prince-canuma/Kokoro-82M"
TTS_VOICE = "af_heart"  # American Female - Heart
TTS_SPEED = 1.1  # Slightly faster for natural flow
TTS_LANG = "a"  # American English


def load_cache() -> dict:
    """Load the narration cache file."""
    if CACHE_FILE.exists():
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    return {}


def save_cache(cache: dict):
    """Save the narration cache file."""
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)


def hash_text(text: str) -> str:
    """Generate a hash of the narration text for cache checking."""
    return hashlib.md5(text.encode()).hexdigest()


def get_audio_duration(file_path: Path) -> float:
    """Get audio duration in seconds using ffprobe."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "quiet",
                "-show_entries", "format=duration",
                "-of", "csv=p=0",
                str(file_path)
            ],
            capture_output=True,
            text=True
        )
        return float(result.stdout.strip())
    except Exception:
        return 0.0


def calculate_cue_points(narration_text: str, audio_duration: float, actions: list) -> list:
    """
    Calculate cue points for actions based on their position in narration text.

    Algorithm:
    1. Calculate speaking rate (chars/second)
    2. Find where each action is described in the narration
    3. Calculate timestamp from character position
    """
    if not narration_text or audio_duration <= 0:
        return []

    chars_per_second = len(narration_text) / audio_duration
    cue_points = []
    used_positions = []

    for i, action in enumerate(actions):
        action_type = action.get("type", "")
        if action_type not in ["click", "fill"]:
            continue

        selector = action.get("selector", "")
        # Extract text from selector (e.g., "text=Upsell Wine" -> "Upsell Wine")
        selector_text = re.sub(r'^text=', '', selector).strip('"\'')

        # Generate phrases that might describe this action
        phrases = []
        if action_type == "click":
            phrases = [
                f"taps the {selector_text}",
                f"clicks the {selector_text}",
                f"taps {selector_text}",
                f"clicks {selector_text}",
                f"click the {selector_text}",
                f"tap the {selector_text}",
                selector_text.lower()
            ]
            # Handle confirmation patterns
            if "again" in selector_text.lower() or "confirm" in selector_text.lower():
                phrases = [
                    "confirms with a second tap",
                    "confirms the action",
                    "taps again",
                    "second tap"
                ] + phrases

        # Find phrase in narration
        lower_narration = narration_text.lower()
        found = False

        for phrase in phrases:
            pos = lower_narration.find(phrase.lower())
            # Skip if position already used
            while pos >= 0 and pos in used_positions:
                pos = lower_narration.find(phrase.lower(), pos + 1)

            if pos >= 0:
                timestamp = pos / chars_per_second
                cue_points.append({
                    "timestamp": round(timestamp, 2),
                    "actionIndex": i,
                    "phrase": phrase,
                    "selector": selector,
                    "type": action_type
                })
                used_positions.append(pos)
                found = True
                break

        # Fallback: estimate based on action order
        if not found and selector:
            interactive_count = len([a for a in actions if a.get("type") in ["click", "fill"]])
            position = len(cue_points) / max(interactive_count, 1)
            estimated = (audio_duration * 0.3) + (position * audio_duration * 0.5)
            cue_points.append({
                "timestamp": round(estimated, 2),
                "actionIndex": i,
                "phrase": f"[estimated: {selector}]",
                "selector": selector,
                "type": action_type
            })

    # Sort by timestamp
    return sorted(cue_points, key=lambda c: c["timestamp"])


def load_spec(spec_name: str) -> dict:
    """Load a YAML flow specification."""
    spec_path = SPECS_DIR / f"{spec_name}.yaml"
    if not spec_path.exists():
        raise FileNotFoundError(f"Spec not found: {spec_path}")

    with open(spec_path, "r") as f:
        return yaml.safe_load(f)


def extract_narrations(spec: dict) -> list[dict]:
    """Extract all narration texts from a flow spec, including actions for cue points."""
    narrations = []
    flow_id = spec["flow"]["id"]

    # Flow-level narration (intro)
    if "narration" in spec["flow"]:
        narrations.append({
            "id": f"{flow_id}/intro",
            "text": spec["flow"]["narration"],
            "step": 0,
            "type": "intro",
            "role": None,
            "actions": []
        })

    # Step-level narrations
    for i, step in enumerate(spec.get("steps", []), 1):
        # Step description narration
        if "narration" in step:
            narrations.append({
                "id": f"{flow_id}/step-{i}",
                "text": step["narration"],
                "step": i,
                "type": "step",
                "role": step.get("role", "UNKNOWN"),
                "actions": step.get("actions", [])  # Include actions for cue point calculation
            })

        # Action-level narrations (less common)
        for j, action in enumerate(step.get("actions", []), 1):
            if "narration" in action:
                narrations.append({
                    "id": f"{flow_id}/step-{i}-action-{j}",
                    "text": action["narration"],
                    "step": i,
                    "action": j,
                    "type": "action",
                    "role": step.get("role", "UNKNOWN"),
                    "actions": [action]
                })

    return narrations


def generate_narration_audio(narration: dict, output_dir: Path, cache: dict) -> bool:
    """Generate audio for a single narration, using cache when possible."""
    text = narration["text"]
    text_hash = hash_text(text)
    narration_id = narration["id"]
    actions = narration.get("actions", [])

    # Check cache - also verify cue points exist if there are actions
    if narration_id in cache and cache[narration_id]["hash"] == text_hash:
        output_file = Path(cache[narration_id]["file"])
        cached_has_cue_points = "cuePoints" in cache[narration_id]
        needs_cue_points = len(actions) > 0 and any(a.get("type") in ["click", "fill"] for a in actions)

        if output_file.exists() and (not needs_cue_points or cached_has_cue_points):
            print(f"  [cached] {narration_id}")
            return False

    # Generate audio
    output_dir.mkdir(parents=True, exist_ok=True)
    file_prefix = narration_id.replace("/", "-")
    output_path = output_dir / f"{file_prefix}.wav"

    # Find actual output file (MLX-Audio appends _000)
    actual_output = output_dir / f"{file_prefix}_000.wav"

    print(f"  [generating] {narration_id}: \"{text[:50]}...\"" if len(text) > 50 else f"  [generating] {narration_id}: \"{text}\"")

    try:
        generate_audio(
            text=text,
            model_path=TTS_MODEL,
            voice=TTS_VOICE,
            speed=TTS_SPEED,
            lang_code=TTS_LANG,
            file_prefix=str(output_dir / file_prefix),
            audio_format="wav",
            sample_rate=24000,
            verbose=False
        )

        # Get audio duration
        duration = get_audio_duration(actual_output)

        # Calculate cue points for step narrations with actions
        cue_points = []
        if actions and duration > 0:
            cue_points = calculate_cue_points(text, duration, actions)
            if cue_points:
                print(f"    [cue points] {len(cue_points)} action(s) timed:")
                for cp in cue_points:
                    print(f"      [{cp['timestamp']:.2f}s] {cp['type']}: {cp['phrase']}")

        # Update cache with all metadata
        cache[narration_id] = {
            "hash": text_hash,
            "file": str(actual_output),
            "text": text,
            "duration": round(duration, 3),
            "role": narration.get("role"),
            "step": narration.get("step"),
            "type": narration.get("type"),
            "cuePoints": cue_points
        }
        return True
    except Exception as e:
        print(f"  [error] {narration_id}: {e}")
        return False


def process_spec(spec_name: str, cache: dict) -> tuple[int, int]:
    """Process a single spec file and generate narrations."""
    print(f"\nProcessing: {spec_name}")

    spec = load_spec(spec_name)
    narrations = extract_narrations(spec)

    if not narrations:
        print("  No narrations found in spec")
        return 0, 0

    flow_id = spec["flow"]["id"]
    output_dir = AUDIO_DIR / flow_id

    generated = 0
    cached = 0

    for narration in narrations:
        if generate_narration_audio(narration, output_dir, cache):
            generated += 1
        else:
            cached += 1

    return generated, cached


def get_all_specs() -> list[str]:
    """Get all YAML spec names."""
    specs = []
    for file in SPECS_DIR.glob("*.yaml"):
        specs.append(file.stem)
    return sorted(specs)


def main():
    args = sys.argv[1:]

    if not args:
        print("Usage:")
        print("  python e2e/scripts/generate-narration.py <spec-name>")
        print("  python e2e/scripts/generate-narration.py --all")
        print()
        print("Available specs:")
        for spec in get_all_specs():
            print(f"  - {spec}")
        sys.exit(1)

    cache = load_cache()
    total_generated = 0
    total_cached = 0

    if args[0] == "--all":
        specs = get_all_specs()
        print(f"Generating narrations for {len(specs)} specs...")
    else:
        specs = [args[0]]

    for spec_name in specs:
        try:
            generated, cached = process_spec(spec_name, cache)
            total_generated += generated
            total_cached += cached
        except FileNotFoundError as e:
            print(f"Error: {e}")
            sys.exit(1)

    save_cache(cache)

    print()
    print(f"Done! Generated: {total_generated}, Cached: {total_cached}")
    print(f"Audio files: {AUDIO_DIR}")


if __name__ == "__main__":
    main()
