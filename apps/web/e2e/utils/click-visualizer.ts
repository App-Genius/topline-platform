/**
 * Click Visualizer Script
 *
 * Injects a visual cursor and click ripple effect into the page.
 * This makes test recordings easier to follow by showing exactly
 * where interactions are happening.
 *
 * Usage: Inject via page.addInitScript() before navigation
 */

export const CLICK_VISUALIZER_SCRIPT = `
(function() {
  // Prevent double-initialization
  if (window.__clickVisualizerInitialized) return;
  window.__clickVisualizerInitialized = true;

  // Create cursor dot element
  const cursor = document.createElement('div');
  cursor.id = 'playwright-cursor';
  cursor.style.cssText = \`
    position: fixed;
    width: 24px;
    height: 24px;
    background: rgba(59, 130, 246, 0.7);
    border: 3px solid rgba(59, 130, 246, 1);
    border-radius: 50%;
    pointer-events: none;
    z-index: 2147483647;
    transform: translate(-50%, -50%);
    transition: transform 0.08s ease-out, background 0.08s ease-out, width 0.08s ease-out, height 0.08s ease-out;
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.6), 0 0 24px rgba(59, 130, 246, 0.3);
    left: -100px;
    top: -100px;
  \`;

  // Wait for body to be ready
  function init() {
    if (!document.body) {
      requestAnimationFrame(init);
      return;
    }
    document.body.appendChild(cursor);
  }
  init();

  // Track mouse movement with smooth animation
  let mouseX = -100;
  let mouseY = -100;
  let cursorX = -100;
  let cursorY = -100;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, true);

  // Smooth cursor animation loop
  function animateCursor() {
    // Lerp towards mouse position for smooth movement
    cursorX += (mouseX - cursorX) * 0.3;
    cursorY += (mouseY - cursorY) * 0.3;

    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';

    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Create ripple effect on click
  function createRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'playwright-ripple';
    ripple.style.cssText = \`
      position: fixed;
      width: 0;
      height: 0;
      left: \${x}px;
      top: \${y}px;
      background: transparent;
      border: 4px solid rgba(59, 130, 246, 0.9);
      border-radius: 50%;
      pointer-events: none;
      z-index: 2147483646;
      transform: translate(-50%, -50%);
      animation: playwright-ripple-expand 0.5s ease-out forwards;
    \`;
    document.body.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 500);
  }

  // Add ripple animation CSS
  const style = document.createElement('style');
  style.id = 'playwright-visualizer-styles';
  style.textContent = \`
    @keyframes playwright-ripple-expand {
      0% {
        width: 0;
        height: 0;
        opacity: 1;
        border-width: 4px;
      }
      100% {
        width: 100px;
        height: 100px;
        opacity: 0;
        border-width: 2px;
      }
    }

    #playwright-cursor.clicking {
      width: 18px !important;
      height: 18px !important;
      background: rgba(59, 130, 246, 1) !important;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.9), 0 0 40px rgba(59, 130, 246, 0.5) !important;
    }

    /* Action label that appears on click */
    .playwright-action-label {
      position: fixed;
      background: rgba(30, 41, 59, 0.95);
      color: #fff;
      padding: 6px 12px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      font-weight: 500;
      pointer-events: none;
      z-index: 2147483645;
      transform: translate(-50%, -100%);
      margin-top: -16px;
      animation: playwright-label-fade 1.5s ease-out forwards;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    @keyframes playwright-label-fade {
      0% {
        opacity: 0;
        transform: translate(-50%, -100%) translateY(8px);
      }
      15% {
        opacity: 1;
        transform: translate(-50%, -100%) translateY(0);
      }
      70% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }
  \`;
  document.head.appendChild(style);

  // Handle mouse down - show clicking state
  document.addEventListener('mousedown', (e) => {
    cursor.classList.add('clicking');
    createRipple(e.clientX, e.clientY);

    // Show action label for the clicked element
    const target = e.target;
    if (target && target.tagName) {
      let label = '';

      // Try to determine a meaningful label
      if (target.getAttribute('role') === 'tab') {
        label = 'Click tab: ' + (target.textContent || '').trim().substring(0, 20);
      } else if (target.getAttribute('role') === 'button' || target.tagName === 'BUTTON') {
        label = 'Click: ' + (target.textContent || target.getAttribute('aria-label') || 'button').trim().substring(0, 25);
      } else if (target.getAttribute('role') === 'checkbox' || target.type === 'checkbox') {
        label = 'Toggle checkbox';
      } else if (target.tagName === 'A') {
        label = 'Click link';
      } else if (target.tagName === 'INPUT') {
        label = 'Focus input';
      }

      if (label) {
        const labelEl = document.createElement('div');
        labelEl.className = 'playwright-action-label';
        labelEl.textContent = label;
        labelEl.style.left = e.clientX + 'px';
        labelEl.style.top = e.clientY + 'px';
        document.body.appendChild(labelEl);

        setTimeout(() => {
          if (labelEl.parentNode) {
            labelEl.parentNode.removeChild(labelEl);
          }
        }, 1500);
      }
    }
  }, true);

  // Handle mouse up - end clicking state
  document.addEventListener('mouseup', () => {
    cursor.classList.remove('clicking');
  }, true);

  // Handle mouse leave (cursor exits viewport)
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
  }, true);

  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
  }, true);

  console.log('[Playwright] Click visualizer initialized');
})();
`;
