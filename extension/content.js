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
 * Simple, recognizable icon for ExplainIt!
 */
const ICON_SVG = `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="15" fill="#4A90E2" stroke="white" stroke-width="2"/>
  <text x="16" y="22" font-family="Arial, sans-serif" font-size="20" font-weight="bold" 
        text-anchor="middle" fill="white">?!</text>
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
  }
  
  .explainit-icon:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
  }
  
  .explainit-icon:active {
    transform: scale(0.95);
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
  iconWrapper.className = 'explainit-icon';
  iconWrapper.innerHTML = ICON_SVG;
  
  // Add click handler
  iconWrapper.addEventListener('click', handleIconClick);
  
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
 * US-022: Handle icon click
 * TASK-096: Send selected text to background script
 */
function handleIconClick(event) {
  event.preventDefault();
  event.stopPropagation();
  
  console.log('[ExplainIt] Icon clicked! Selected text:', selectedText.substring(0, 50) + '...');
  
  // US-022: Send message to background script
  chrome.runtime.sendMessage(
    {
      type: 'SELECTED_TEXT',
      text: selectedText
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('[ExplainIt] Failed to send message:', chrome.runtime.lastError);
        alert('ExplainIt! Error: Could not communicate with extension.\nPlease refresh the page and try again.');
        return;
      }
      
      if (response && response.success) {
        console.log('[ExplainIt] Text sent to background successfully');
        // Background will open the popup automatically
        // Hide icon after successful send
        removeFloatingIcon();
      } else {
        console.error('[ExplainIt] Background rejected message:', response);
        alert('ExplainIt! Error: Could not store selected text.\nPlease try again.');
      }
    }
  );
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
