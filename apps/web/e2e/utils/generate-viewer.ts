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
      height: 100vh;
      overflow: hidden;
    }
    header {
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: fixed;
      top: 0; left: 0; right: 0;
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
    .split-container {
      display: flex;
      height: 100vh;
      padding-top: 57px;
    }
    .video-panel {
      flex: 0 0 70%;
      background: #000;
      display: flex;
      flex-direction: column;
    }
    .video-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .video-container video {
      max-width: 100%;
      max-height: 100%;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    .video-controls {
      padding: 16px;
      background: rgba(0,0,0,0.8);
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
      height: 6px;
      background: #334155;
      border-radius: 3px;
      cursor: pointer;
      position: relative;
    }
    .progress-fill {
      height: 100%;
      background: #3b82f6;
      border-radius: 3px;
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
    .verification-panel {
      flex: 0 0 30%;
      background: #1e293b;
      border-left: 1px solid #334155;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #334155;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .panel-header h2 {
      font-size: 14px;
      font-weight: 600;
      color: #e2e8f0;
    }
    .panel-stats {
      display: flex;
      gap: 16px;
      font-size: 12px;
    }
    .stat { display: flex; align-items: center; gap: 4px; }
    .stat-pass { color: #10b981; }
    .stat-total { color: #94a3b8; }
    .verification-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
    }
    .verification-entry {
      padding: 12px 20px;
      border-left: 3px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .verification-entry:hover { background: rgba(255,255,255,0.03); }
    .verification-entry.active {
      background: rgba(59, 130, 246, 0.15);
      border-left-color: #3b82f6;
    }
    .verification-entry.is-step {
      background: rgba(139, 92, 246, 0.1);
      border-left-color: #8b5cf6;
      margin-top: 8px;
    }
    .entry-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .entry-timestamp {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 11px;
      color: #64748b;
      min-width: 48px;
    }
    .entry-type {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .entry-type.assertion { background: #10b981; color: #000; }
    .entry-type.action { background: #3b82f6; color: #fff; }
    .entry-type.navigation { background: #f59e0b; color: #000; }
    .entry-type.step { background: #8b5cf6; color: #fff; }
    .entry-description {
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.4;
    }
    .entry-status { margin-left: auto; font-size: 14px; }
    .status-pass::before { content: '✓'; color: #10b981; }
    .status-fail::before { content: '✗'; color: #ef4444; }
    .status-info::before { content: '●'; color: #3b82f6; }
    .empty-state {
      text-align: center;
      padding: 60px 40px;
      color: #64748b;
    }
    .empty-state h3 { margin-bottom: 12px; color: #94a3b8; }
    .empty-state p { font-size: 13px; line-height: 1.6; }
    @media (max-width: 1200px) {
      .video-panel { flex: 0 0 60%; }
      .verification-panel { flex: 0 0 40%; }
    }
    @media (max-width: 900px) {
      .split-container { flex-direction: column; }
      .video-panel, .verification-panel { flex: none; height: 50%; }
      .verification-panel { border-left: none; border-top: 1px solid #334155; }
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">
      <div class="logo-icon">T</div>
      <span>Topline Test Flow Viewer</span>
    </div>
    <div class="test-selector">
      <label for="test-select">Test Flow:</label>
      <select id="test-select">
        <option value="">Select a test...</option>
      </select>
    </div>
  </header>

  <div class="split-container">
    <div class="video-panel">
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
    <div class="verification-panel">
      <div class="panel-header">
        <h2>Verification Steps</h2>
        <div class="panel-stats">
          <span class="stat stat-pass"><span id="stat-pass">0</span> passed</span>
          <span class="stat stat-total"><span id="stat-total">0</span> total</span>
        </div>
      </div>
      <div class="verification-list" id="verification-list">
        <div class="empty-state">
          <h3>No test selected</h3>
          <p>Select a test flow from the dropdown above</p>
        </div>
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
    const verificationList = document.getElementById('verification-list');
    const statPass = document.getElementById('stat-pass');
    const statTotal = document.getElementById('stat-total');

    let currentVerifications = [];
    let videoDuration = 0;

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
      renderVerifications();
      renderProgressMarkers();
    }

    function renderVerifications() {
      if (currentVerifications.length === 0) {
        verificationList.innerHTML = '<div class="empty-state"><h3>No verification data</h3></div>';
        statPass.textContent = '0';
        statTotal.textContent = '0';
        return;
      }

      const assertions = currentVerifications.filter(v => v.type === 'assertion');
      const passed = assertions.filter(v => v.status === 'pass').length;
      statPass.textContent = passed;
      statTotal.textContent = assertions.length;

      verificationList.innerHTML = currentVerifications.map((entry, idx) => \`
        <div class="verification-entry \${entry.type === 'step' ? 'is-step' : ''}" data-idx="\${idx}" data-time="\${entry.timestamp}">
          <div class="entry-header">
            <span class="entry-timestamp">\${formatTime(entry.timestamp)}</span>
            <span class="entry-type \${entry.type}">\${entry.type}</span>
            <span class="entry-status status-\${entry.status}"></span>
          </div>
          <div class="entry-description">\${entry.description}</div>
        </div>
      \`).join('');

      verificationList.querySelectorAll('.verification-entry').forEach(el => {
        el.addEventListener('click', () => {
          mainVideo.currentTime = parseInt(el.dataset.time) / 1000;
          mainVideo.play();
        });
      });
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

    function updateActiveVerification() {
      const currentMs = mainVideo.currentTime * 1000;
      document.querySelectorAll('.verification-entry').forEach(el => {
        const time = parseInt(el.dataset.time);
        const isActive = time <= currentMs && time > currentMs - 2000;
        el.classList.toggle('active', isActive);
        if (isActive) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }

    function updateProgress() {
      if (!videoDuration) return;
      const percent = (mainVideo.currentTime / videoDuration) * 100;
      progressFill.style.width = \`\${percent}%\`;
      videoTime.textContent = \`\${formatTime(mainVideo.currentTime * 1000)} / \${formatTime(videoDuration * 1000)}\`;
    }

    testSelect.addEventListener('change', (e) => { if (e.target.value) loadTest(e.target.value); });
    mainVideo.addEventListener('loadedmetadata', () => { videoDuration = mainVideo.duration; renderProgressMarkers(); updateProgress(); });
    mainVideo.addEventListener('timeupdate', () => { updateActiveVerification(); updateProgress(); });
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
