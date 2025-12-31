#!/usr/bin/env npx tsx
/**
 * Generate Self-Contained Test Viewer
 *
 * Creates a standalone HTML file with embedded verification data
 * that can be opened directly in the browser (no server needed).
 *
 * Run: npx tsx e2e/utils/generate-viewer.ts
 */

import * as fs from "fs";
import * as path from "path";

const TEST_RESULTS_DIR = path.join(process.cwd(), "test-results");
const OUTPUT_FILE = path.join(TEST_RESULTS_DIR, "viewer.html");

interface TestFlow {
  id: string;
  name: string;
  folder: string;
  verifications: unknown[];
}

function findTestFolders(): TestFlow[] {
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    console.error("test-results directory not found. Run tests first.");
    process.exit(1);
  }

  const folders = fs.readdirSync(TEST_RESULTS_DIR).filter((f) => {
    const fullPath = path.join(TEST_RESULTS_DIR, f);
    return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, "video.webm"));
  });

  return folders.map((folder, idx) => {
    const verificationPath = path.join(TEST_RESULTS_DIR, folder, "verifications.json");
    let verifications: unknown[] = [];

    if (fs.existsSync(verificationPath)) {
      try {
        verifications = JSON.parse(fs.readFileSync(verificationPath, "utf-8"));
      } catch (e) {
        console.warn(`Could not parse ${verificationPath}`);
      }
    }

    // Extract a readable name from the folder
    let name = folder;
    if (folder.includes("briefing-journey") || folder.includes("attendance")) {
      name = "Daily Briefing Journey (6 Steps)";
    } else if (folder.includes("setup-form") || folder.includes("baseline")) {
      name = "Baseline Setup Form";
    } else if (folder.includes("tour") || folder.includes("pages")) {
      name = "Page Tour (All Pages)";
    }

    return {
      id: `test-${idx}`,
      name,
      folder,
      verifications,
    };
  });
}

function generateHTML(tests: TestFlow[]): string {
  const testsJSON = JSON.stringify(tests, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Topline Test Flow Viewer</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #fff;
      min-height: 100vh;
    }
    header {
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(8px);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 16px;
    }
    .logo-icon {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .header-controls {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .test-selector {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .test-selector label {
      color: #94a3b8;
      font-size: 13px;
    }
    .test-selector select {
      background: #1e293b;
      color: #fff;
      border: 1px solid #334155;
      padding: 8px 32px 8px 12px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
    }
    .test-selector select:focus {
      outline: none;
      border-color: #3b82f6;
    }
    .panel-stats {
      display: flex;
      gap: 16px;
      font-size: 13px;
    }
    .stat { display: flex; align-items: center; gap: 4px; }
    .stat-pass { color: #10b981; }
    .stat-total { color: #94a3b8; }

    /* Current Step Banner - Above Video */
    .current-step-banner {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-bottom: 1px solid #334155;
      padding: 16px 24px;
      min-height: 80px;
    }
    .step-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .step-number {
      background: #8b5cf6;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 12px;
    }
    .step-type {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .step-type.assertion { background: #10b981; color: #000; }
    .step-type.action { background: #3b82f6; color: #fff; }
    .step-type.navigation { background: #f59e0b; color: #000; }
    .step-type.step { background: #8b5cf6; color: #fff; }
    .step-timestamp {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 12px;
      color: #64748b;
      margin-left: auto;
    }
    .step-description {
      font-size: 18px;
      font-weight: 500;
      color: #f1f5f9;
      line-height: 1.4;
    }
    .step-status {
      margin-left: 12px;
      font-size: 18px;
    }
    .step-status.pass { color: #10b981; }
    .step-status.fail { color: #ef4444; }
    .step-status.info { color: #3b82f6; }
    .no-step {
      color: #64748b;
      font-size: 16px;
    }

    /* Video Section */
    .video-section {
      background: #000;
      padding: 24px;
    }
    .video-container {
      max-width: 1400px;
      margin: 0 auto;
    }
    .video-container video {
      width: 100%;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    .video-controls {
      max-width: 1400px;
      margin: 16px auto 0;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .video-controls .time {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 13px;
      color: #94a3b8;
      min-width: 100px;
    }
    .progress-bar {
      flex: 1;
      height: 8px;
      background: #334155;
      border-radius: 4px;
      cursor: pointer;
      position: relative;
    }
    .progress-fill {
      height: 100%;
      background: #3b82f6;
      border-radius: 4px;
      width: 0%;
      transition: width 0.1s linear;
    }
    .progress-markers {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
    }
    .progress-marker {
      position: absolute;
      width: 4px;
      height: 100%;
      background: #10b981;
      border-radius: 2px;
      transform: translateX(-50%);
    }

    .empty-state {
      text-align: center;
      padding: 60px 40px;
      color: #64748b;
    }
    .empty-state h3 { margin-bottom: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <header>
    <div class="logo">
      <div class="logo-icon">T</div>
      <span>Topline Test Flow Viewer</span>
    </div>
    <div class="header-controls">
      <div class="panel-stats">
        <span class="stat stat-pass"><span id="stat-pass">0</span> passed</span>
        <span class="stat stat-total"><span id="stat-total">0</span> total</span>
      </div>
      <div class="test-selector">
        <label for="test-select">Test Flow:</label>
        <select id="test-select">
          <option value="">Select a test...</option>
        </select>
      </div>
    </div>
  </header>

  <!-- Current Step Banner -->
  <div class="current-step-banner" id="current-step-banner">
    <div class="no-step">Select a test flow to begin</div>
  </div>

  <!-- Video Section -->
  <div class="video-section">
    <div class="video-container">
      <video id="main-video" controls>
        <source src="" type="video/webm">
      </video>
    </div>
    <div class="video-controls">
      <span class="time" id="video-time">0:00 / 0:00</span>
      <div class="progress-bar" id="progress-bar">
        <div class="progress-fill" id="progress-fill"></div>
        <div class="progress-markers" id="progress-markers"></div>
      </div>
    </div>
  </div>

  <script>
    // EMBEDDED TEST DATA - No fetch needed!
    const tests = ${testsJSON};

    const testSelect = document.getElementById('test-select');
    const mainVideo = document.getElementById('main-video');
    const videoTime = document.getElementById('video-time');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const progressMarkers = document.getElementById('progress-markers');
    const currentStepBanner = document.getElementById('current-step-banner');
    const statPass = document.getElementById('stat-pass');
    const statTotal = document.getElementById('stat-total');

    let currentVerifications = [];
    let videoDuration = 0;
    let currentActiveIdx = -1;

    tests.forEach(test => {
      const option = document.createElement('option');
      option.value = test.id;
      option.textContent = test.name;
      testSelect.appendChild(option);
    });

    function formatTime(ms) {
      const totalSeconds = Math.floor(ms / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return \`\${mins}:\${String(secs).padStart(2, '0')}\`;
    }

    function loadTest(testId) {
      const test = tests.find(t => t.id === testId);
      if (!test) return;

      mainVideo.src = test.folder + '/video.webm';
      mainVideo.load();

      currentVerifications = test.verifications || [];
      currentActiveIdx = -1;
      renderProgressMarkers();
      updateCurrentStep();
      updateStats();
    }

    function updateStats() {
      const assertions = currentVerifications.filter(v => v.type === 'assertion');
      const passed = assertions.filter(v => v.status === 'pass').length;
      statPass.textContent = passed;
      statTotal.textContent = assertions.length;
    }

    function renderProgressMarkers() {
      if (!videoDuration || currentVerifications.length === 0) {
        progressMarkers.innerHTML = '';
        return;
      }
      const assertions = currentVerifications.filter(v => v.type === 'assertion');
      progressMarkers.innerHTML = assertions.map(v => {
        const percent = (v.timestamp / 1000 / videoDuration) * 100;
        return \`<div class="progress-marker" style="left: \${percent}%"></div>\`;
      }).join('');
    }

    function updateCurrentStep() {
      const currentMs = mainVideo.currentTime * 1000;

      // Find the current step (last one that started before current time)
      let activeIdx = -1;
      for (let i = currentVerifications.length - 1; i >= 0; i--) {
        if (currentVerifications[i].timestamp <= currentMs) {
          activeIdx = i;
          break;
        }
      }

      // Update banner if changed
      if (activeIdx !== currentActiveIdx) {
        currentActiveIdx = activeIdx;

        if (activeIdx >= 0) {
          const entry = currentVerifications[activeIdx];
          const stepNum = entry.step || '';
          const statusIcon = entry.status === 'pass' ? '✓' : entry.status === 'fail' ? '✗' : '●';

          currentStepBanner.innerHTML = \`
            <div class="step-indicator">
              \${stepNum ? \`<span class="step-number">Step \${stepNum}</span>\` : ''}
              <span class="step-type \${entry.type}">\${entry.type}</span>
              <span class="step-timestamp">\${formatTime(entry.timestamp)}</span>
            </div>
            <div class="step-description">
              \${entry.description}
              <span class="step-status \${entry.status}">\${statusIcon}</span>
            </div>
          \`;
        } else {
          currentStepBanner.innerHTML = '<div class="no-step">Video starting...</div>';
        }
      }
    }

    function updateProgress() {
      if (!videoDuration) return;
      const percent = (mainVideo.currentTime / videoDuration) * 100;
      progressFill.style.width = \`\${percent}%\`;
      videoTime.textContent = \`\${formatTime(mainVideo.currentTime * 1000)} / \${formatTime(videoDuration * 1000)}\`;
    }

    testSelect.addEventListener('change', (e) => { if (e.target.value) loadTest(e.target.value); });
    mainVideo.addEventListener('loadedmetadata', () => { videoDuration = mainVideo.duration; renderProgressMarkers(); updateProgress(); });
    mainVideo.addEventListener('timeupdate', () => { updateCurrentStep(); updateProgress(); });
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      mainVideo.currentTime = ((e.clientX - rect.left) / rect.width) * videoDuration;
    });

    if (tests.length > 0) { testSelect.value = tests[0].id; loadTest(tests[0].id); }
  </script>
</body>
</html>`;
}

// Main execution
const tests = findTestFolders();
console.log(`Found ${tests.length} test(s) with videos`);

tests.forEach((t) => {
  console.log(`  - ${t.name}: ${t.verifications.length} verifications`);
});

const html = generateHTML(tests);
fs.writeFileSync(OUTPUT_FILE, html);
console.log(`\nGenerated: ${OUTPUT_FILE}`);
console.log(`\nOpen directly in browser:`);
console.log(`  open "${OUTPUT_FILE}"`);
