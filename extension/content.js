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
      
      // TODO: US-002 - Trigger icon display
      // For now, just store the text
    } else {
      // Clear selection if invalid
      selectedText = '';
      console.log('[ExplainIt] Selection cleared or invalid');
      
      // TODO: US-002 - Hide icon
    }
  }, DEBOUNCE_DELAY);
}

/**
 * TASK-001: Setup event listeners
 * Listen to both mouseup and selectionchange for comprehensive coverage
 */
function setupEventListeners() {
  // mouseup: Fired when user releases mouse after selecting
  document.addEventListener('mouseup', () => {
    handleSelection();
  });
  
  // selectionchange: Fired when selection changes (including keyboard selection)
  document.addEventListener('selectionchange', () => {
    handleSelection();
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
