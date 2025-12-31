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
  videoFile: string;
  verifications: unknown[];
}

function findVideoFile(folderPath: string): string | null {
  const files = fs.readdirSync(folderPath);
  const videoFile = files.find((f) => f.endsWith(".webm") || f.endsWith(".mp4"));
  return videoFile || null;
}

function findTestFolders(): TestFlow[] {
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    console.error("test-results directory not found. Run tests first.");
    process.exit(1);
  }

  const folders = fs.readdirSync(TEST_RESULTS_DIR).filter((f) => {
    const fullPath = path.join(TEST_RESULTS_DIR, f);
    if (!fs.statSync(fullPath).isDirectory()) return false;
    // Check if folder has any video file (*.webm or *.mp4)
    return findVideoFile(fullPath) !== null;
  });

  return folders.map((folder, idx) => {
    const folderPath = path.join(TEST_RESULTS_DIR, folder);
    const verificationPath = path.join(folderPath, "verifications.json");
    let verifications: unknown[] = [];

    if (fs.existsSync(verificationPath)) {
      try {
        verifications = JSON.parse(fs.readFileSync(verificationPath, "utf-8"));
      } catch (e) {
        console.warn(`Could not parse ${verificationPath}`);
      }
    }

    // Find the actual video filename
    const videoFile = findVideoFile(folderPath) || "video.webm";

    // Extract a readable name from the folder
    let name = folder;
    if (folder.includes("behavior-verification")) {
      name = "Behavior Verification Flow (Multi-Role)";
    } else if (folder.includes("briefing-journey") || folder.includes("attendance")) {
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
      videoFile,
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

    /* Toggle Button */
    .toggle-panel-btn {
      background: #334155;
      color: #fff;
      border: 1px solid #475569;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .toggle-panel-btn:hover {
      background: #475569;
    }

    /* Slide-out Panel */
    .steps-panel {
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: #1e293b;
      border-left: 1px solid #334155;
      z-index: 200;
      display: flex;
      flex-direction: column;
      transition: right 0.3s ease;
    }
    .steps-panel.open {
      right: 0;
    }
    .panel-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 150;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .panel-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }
    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #334155;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .panel-header h2 {
      font-size: 16px;
      font-weight: 600;
      color: #e2e8f0;
    }
    .panel-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 24px;
      cursor: pointer;
      padding: 4px 8px;
      line-height: 1;
    }
    .panel-close:hover { color: #fff; }
    .steps-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
    }
    .step-entry {
      padding: 12px 20px;
      border-left: 3px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .step-entry:hover { background: rgba(255,255,255,0.03); }
    .step-entry.active {
      background: rgba(59, 130, 246, 0.15);
      border-left-color: #3b82f6;
    }
    .step-entry.is-step {
      background: rgba(139, 92, 246, 0.1);
      border-left-color: #8b5cf6;
    }
    .step-entry-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .step-entry-time {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 11px;
      color: #64748b;
      min-width: 48px;
    }
    .step-entry-type {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .step-entry-type.assertion { background: #10b981; color: #000; }
    .step-entry-type.action { background: #3b82f6; color: #fff; }
    .step-entry-type.navigation { background: #f59e0b; color: #000; }
    .step-entry-type.step { background: #8b5cf6; color: #fff; }
    .step-entry-desc {
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.4;
    }
    .step-entry-status { margin-left: auto; font-size: 14px; }
    .status-pass { color: #10b981; }
    .status-fail { color: #ef4444; }
    .status-info { color: #3b82f6; }
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
      <button class="toggle-panel-btn" id="toggle-panel-btn">
        All Steps
      </button>
    </div>
  </header>

  <!-- Overlay for closing panel -->
  <div class="panel-overlay" id="panel-overlay"></div>

  <!-- Slide-out Steps Panel -->
  <div class="steps-panel" id="steps-panel">
    <div class="panel-header">
      <h2>All Steps</h2>
      <button class="panel-close" id="panel-close">&times;</button>
    </div>
    <div class="steps-list" id="steps-list"></div>
  </div>

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
    const togglePanelBtn = document.getElementById('toggle-panel-btn');
    const stepsPanel = document.getElementById('steps-panel');
    const panelOverlay = document.getElementById('panel-overlay');
    const panelClose = document.getElementById('panel-close');
    const stepsList = document.getElementById('steps-list');

    let currentVerifications = [];
    let videoDuration = 0;
    let currentActiveIdx = -1;

    // Panel toggle functions
    function openPanel() {
      stepsPanel.classList.add('open');
      panelOverlay.classList.add('open');
    }
    function closePanel() {
      stepsPanel.classList.remove('open');
      panelOverlay.classList.remove('open');
    }
    togglePanelBtn.addEventListener('click', openPanel);
    panelClose.addEventListener('click', closePanel);
    panelOverlay.addEventListener('click', closePanel);

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

      mainVideo.src = test.folder + '/' + test.videoFile;
      mainVideo.load();

      currentVerifications = test.verifications || [];
      currentActiveIdx = -1;
      renderProgressMarkers();
      renderStepsList();
      updateCurrentStep();
      updateStats();
    }

    function renderStepsList() {
      if (currentVerifications.length === 0) {
        stepsList.innerHTML = '<div class="empty-state"><p>No steps</p></div>';
        return;
      }

      stepsList.innerHTML = currentVerifications.map((entry, idx) => {
        const statusIcon = entry.status === 'pass' ? '✓' : entry.status === 'fail' ? '✗' : '●';
        return \`
          <div class="step-entry \${entry.type === 'step' ? 'is-step' : ''}" data-idx="\${idx}" data-time="\${entry.timestamp}">
            <div class="step-entry-header">
              <span class="step-entry-time">\${formatTime(entry.timestamp)}</span>
              <span class="step-entry-type \${entry.type}">\${entry.type}</span>
              <span class="step-entry-status status-\${entry.status}">\${statusIcon}</span>
            </div>
            <div class="step-entry-desc">\${entry.description}</div>
          </div>
        \`;
      }).join('');

      stepsList.querySelectorAll('.step-entry').forEach(el => {
        el.addEventListener('click', () => {
          mainVideo.currentTime = parseInt(el.dataset.time) / 1000;
          mainVideo.play();
          closePanel();
        });
      });
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

      // Update panel highlighting
      document.querySelectorAll('.step-entry').forEach((el, idx) => {
        el.classList.toggle('active', idx === activeIdx);
        if (idx === activeIdx && stepsPanel.classList.contains('open')) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

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
