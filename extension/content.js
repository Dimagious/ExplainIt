/**
 * Content Script for ExplainIt!
 * Detects text selection on webpages
 * US-001: Detect Text Selection
 */

// Constants from architecture
const MIN_TEXT_LENGTH = 3;
const MAX_TEXT_LENGTH = 2000;
const DEBOUNCE_DELAY = 300; // ms

// State
let selectedText = '';
let debounceTimer = null;
let floatingIcon = null;
let shadowRoot = null;

/**
 * TASK-002: Get selected text using window.getSelection()
 * Handles edge cases: empty selections, whitespace only
 */
function getSelectedText() {
  const selection = window.getSelection();
  
  if (!selection || selection.rangeCount === 0) {
    return '';
  }
  
  const text = selection.toString().trim();
  return text;
}

/**
 * TASK-003: Validate selected text
 * - Minimum 3 characters
 * - Maximum 2000 characters (truncate if longer)
 * @param {string} text - Selected text
 * @returns {string|null} - Validated text or null if invalid
 */
function validateText(text) {
  // Empty or whitespace only
  if (!text || text.length === 0) {
    return null;
  }
  
  // Too short
  if (text.length < MIN_TEXT_LENGTH) {
    console.log('[ExplainIt] Selection too short:', text.length, 'chars');
    return null;
  }
  
  // Too long - truncate
  if (text.length > MAX_TEXT_LENGTH) {
    console.log('[ExplainIt] Selection truncated from', text.length, 'to', MAX_TEXT_LENGTH, 'chars');
    return text.substring(0, MAX_TEXT_LENGTH);
  }
  
  return text;
}

/**
 * TASK-005: SVG Icon Asset
 * Magnifying glass with sparkle - matches extension icon
 */
const ICON_SVG = `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="16" cy="16" r="15" fill="#2563EB" stroke="white" stroke-width="2"/>
  <!-- Magnifying glass -->
  <circle cx="13" cy="13" r="6" stroke="white" stroke-width="2.5" fill="none"/>
  <line x1="17.5" y1="17.5" x2="23" y2="23" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Sparkle -->
  <circle cx="23" cy="9" r="1.5" fill="#FFD700"/>
  <line x1="23" y1="5" x2="23" y2="7" stroke="#FFD700" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="23" y1="11" x2="23" y2="13" stroke="#FFD700" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="19" y1="9" x2="21" y2="9" stroke="#FFD700" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="25" y1="9" x2="27" y2="9" stroke="#FFD700" stroke-width="1.5" stroke-linecap="round"/>
</svg>
`;

/**
 * TASK-008: Icon Styles (CSS-in-JS)
 * Styles for the floating icon with hover effects
 */
const ICON_STYLES = `
  :host {
    all: initial;
    position: absolute;
    z-index: 999999;
    cursor: pointer;
  }
  
  .icon-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
  }
  
  .explainit-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  
  .explainit-icon:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  }
  
  .explainit-icon:active {
    transform: scale(0.95);
  }
  
  .settings-gear {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #2563EB;
    color: white;
    display: none;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
    opacity: 0;
    transform: translateX(-8px);
  }

  .settings-gear svg {
    width: 14px;
    height: 14px;
    display: block;
  }
  
  .icon-wrapper:hover .settings-gear {
    display: flex;
    opacity: 1;
    transform: translateX(0);
  }
  
  .settings-gear:hover {
    background: #1D4ED8;
    transform: translateX(0) scale(1.1);
  }
  
  .tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
    padding: 6px 10px;
    background: #333;
    color: white;
    font-size: 12px;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  
  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: #333;
  }
  
  .icon-wrapper:hover .tooltip {
    opacity: 1;
  }
`;

/**
 * TASK-009: Create Shadow DOM container
 * Isolates icon styles from page CSS
 */
function createShadowContainer() {
  const container = document.createElement('div');
  container.id = 'explainit-icon-container';
  shadowRoot = container.attachShadow({ mode: 'open' });
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = ICON_STYLES;
  shadowRoot.appendChild(style);
  
  return container;
}

/**
 * TASK-006: Create floating icon DOM element
 * Creates icon with Shadow DOM isolation
 */
function createFloatingIcon() {
  // Remove existing icon if any
  removeFloatingIcon();
  
  // Create Shadow DOM container
  const container = createShadowContainer();
  
  // Create icon wrapper
  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'icon-wrapper';
  
  // Create main icon
  const icon = document.createElement('div');
  icon.className = 'explainit-icon';
  icon.innerHTML = ICON_SVG;
  icon.setAttribute('title', 'Explain selected text');
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = 'Explain selected text';
  
  // Create settings gear
  const settingsGear = document.createElement('div');
  settingsGear.className = 'settings-gear';
  settingsGear.innerHTML = `
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M17.43 10.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C12.46 2.18 12.25 2 12 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM10 13c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/>
    </svg>
  `;
  settingsGear.setAttribute('title', 'Open settings');
  
  // Add click handler to main icon
  icon.addEventListener('click', handleIconClick);
  
  // Add click handler to settings gear
  settingsGear.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    // Hide floating icon
    removeFloatingIcon();
    // Open unified inline settings flow (provider + key + language + tone)
    if (typeof createInlinePopup === 'function') {
      createInlinePopup(selectedText, { openSettings: true, skipImmediateFetch: true });
    } else {
      console.error('[ExplainIt] inline-popup.js not loaded!');
    }
  });
  
  // Assemble structure
  iconWrapper.appendChild(tooltip);
  iconWrapper.appendChild(icon);
  iconWrapper.appendChild(settingsGear);
  
  // Add to Shadow DOM
  shadowRoot.appendChild(iconWrapper);
  
  // Add to page
  document.body.appendChild(container);
  
  floatingIcon = container;
  console.log('[ExplainIt] Icon created');
  
  return container;
}

/**
 * TASK-006: Remove floating icon
 */
function removeFloatingIcon() {
  if (floatingIcon && floatingIcon.parentNode) {
    floatingIcon.parentNode.removeChild(floatingIcon);
    floatingIcon = null;
    shadowRoot = null;
    console.log('[ExplainIt] Icon removed');
  }
}

/**
 * TASK-007: Calculate icon position
 * Positions icon near selection end, accounting for viewport boundaries
 */
function positionIcon() {
  if (!floatingIcon) return;
  
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Calculate position (5px to the right and slightly below selection end)
  let left = rect.right + window.pageXOffset + 5;
  let top = rect.bottom + window.pageYOffset + 5;
  
  // Viewport boundaries check
  const iconWidth = 32;
  const iconHeight = 32;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Adjust if too close to right edge
  if (left + iconWidth > window.pageXOffset + viewportWidth) {
    left = rect.left + window.pageXOffset - iconWidth - 5;
  }
  
  // Adjust if too close to bottom edge
  if (top + iconHeight > window.pageYOffset + viewportHeight) {
    top = rect.top + window.pageYOffset - iconHeight - 5;
  }
  
  // Ensure icon stays within viewport
  left = Math.max(window.pageXOffset + 5, Math.min(left, window.pageXOffset + viewportWidth - iconWidth - 5));
  top = Math.max(window.pageYOffset + 5, Math.min(top, window.pageYOffset + viewportHeight - iconHeight - 5));
  
  // Apply position
  floatingIcon.style.left = `${left}px`;
  floatingIcon.style.top = `${top}px`;
  
  console.log('[ExplainIt] Icon positioned at', { left, top });
}

/**
 * Handle icon click - show inline popup
 */
function handleIconClick(event) {
  event.preventDefault();
  event.stopPropagation();
  
  console.log('[ExplainIt] Icon clicked! Selected text:', selectedText.substring(0, 50) + '...');
  
  // Hide floating icon
  removeFloatingIcon();
  
  // Show inline popup with explanation (defined in inline-popup.js)
  if (typeof createInlinePopup === 'function') {
    createInlinePopup(selectedText);
  } else {
    console.error('[ExplainIt] inline-popup.js not loaded!');
    alert('ExplainIt! Error: Popup module not loaded.\nPlease refresh the page.');
  }
}

/**
 * TASK-002: Handle text selection with debouncing
 * Debouncing prevents excessive processing during selection dragging
 */
function handleSelection() {
  // Clear existing debounce timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  // Debounce to avoid excessive processing
  debounceTimer = setTimeout(() => {
    const text = getSelectedText();
    const validatedText = validateText(text);
    
    if (validatedText) {
      selectedText = validatedText;
      console.log('[ExplainIt] Text selected:', selectedText.substring(0, 50) + '...');
      
      // US-002: Display floating icon
      createFloatingIcon();
      positionIcon();
    } else {
      // Clear selection if invalid
      selectedText = '';
      console.log('[ExplainIt] Selection cleared or invalid');
      
      // US-002: Hide icon
      removeFloatingIcon();
    }
  }, DEBOUNCE_DELAY);
}

/**
 * TASK-001: Setup event listeners
 * Listen to both mouseup and selectionchange for comprehensive coverage
 */
function setupEventListeners() {
  // mouseup: Fired when user releases mouse after selecting
  document.addEventListener('mouseup', (event) => {
    // Check if click is on icon (don't hide it)
    if (floatingIcon && floatingIcon.contains(event.target)) {
      return;
    }
    handleSelection();
  });
  
  // selectionchange: Fired when selection changes (including keyboard selection)
  document.addEventListener('selectionchange', () => {
    handleSelection();
  });
  
  // Hide icon on scroll (US-004 requirement)
  document.addEventListener('scroll', () => {
    removeFloatingIcon();
  }, true); // useCapture for all scrollable elements
  
  // Hide icon on ESC key (US-004 requirement)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      removeFloatingIcon();
      window.getSelection().removeAllRanges();
    }
  });
  
  console.log('[ExplainIt] Event listeners registered');
}

/**
 * TASK-004: Handle iframe selections
 * Content script will be injected into iframes via manifest.json all_frames
 * This allows the same logic to work in iframes
 */
function handleIframes() {
  // Check if we're in an iframe
  const isInIframe = window !== window.top;
  
  if (isInIframe) {
    console.log('[ExplainIt] Running in iframe');
    // Same event listeners work in iframes
    // Communication with top frame will be handled later if needed
  }
}

/**
 * Initialize content script
 */
function init() {
  console.log('[ExplainIt] Content script initialized');
  
  // TASK-001: Setup listeners
  setupEventListeners();
  
  // TASK-004: Handle iframes
  handleIframes();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already loaded
  init();
}

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getSelectedText,
    validateText,
    handleSelection
  };
}
