/**
 * ExplainIt! Popup Script
 * US-005: Popup Structure & Layout
 * US-006: Loading State UI
 */

// State
let currentScreen = 'result';
let currentState = 'empty';
let settings = {
  language: 'en',
  tone: 'simple'
};
let loadingTimeoutId = null;
let abortController = null;

/**
 * TASK-021: Screen switching logic
 */
function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(screen => {
    screen.classList.remove('active');
  });
  
  const targetScreen = document.getElementById(`${screenId}-screen`);
  if (targetScreen) {
    targetScreen.classList.add('active');
    currentScreen = screenId;
    console.log('[ExplainIt] Switched to screen:', screenId);
  }
}

/**
 * TASK-021: Show different states in result screen
 * US-006: Enhanced with loading state cleanup
 */
function showState(stateId) {
  // If transitioning away from loading state, clean it up
  if (currentState === 'loading' && stateId !== 'loading') {
    hideLoadingState();
  }
  
  const states = document.querySelectorAll('.content-section');
  states.forEach(state => {
    state.classList.add('hidden');
  });
  
  const targetState = document.getElementById(`${stateId}-state`);
  if (targetState) {
    targetState.classList.remove('hidden');
    currentState = stateId;
    console.log('[ExplainIt] Showing state:', stateId);
  }
}

/**
 * US-012: Load settings from chrome.storage.sync
 */
async function loadSettings() {
  try {
    const stored = await chrome.storage.sync.get(['language', 'tone']);
    
    settings = {
      language: stored.language || 'en',
      tone: stored.tone || 'simple'
    };
    
    console.log('[ExplainIt] Settings loaded:', settings);
    updateSettingsUI();
  } catch (error) {
    console.error('[ExplainIt] Error loading settings:', error);
    // Use defaults
  }
}

/**
 * US-012: Save settings to chrome.storage.sync
 */
async function saveSettings(newSettings) {
  try {
    await chrome.storage.sync.set(newSettings);
    settings = { ...settings, ...newSettings };
    console.log('[ExplainIt] Settings saved:', settings);
    return true;
  } catch (error) {
    console.error('[ExplainIt] Error saving settings:', error);
    return false;
  }
}

/**
 * US-010/011: Update settings form with current values
 */
function updateSettingsUI() {
  const languageSelect = document.getElementById('language-select');
  const toneSelect = document.getElementById('tone-select');
  
  if (languageSelect) languageSelect.value = settings.language;
  if (toneSelect) toneSelect.value = settings.tone;
}

/**
 * US-012: Show save confirmation
 */
function showSaveConfirmation() {
  const confirmation = document.getElementById('save-confirmation');
  if (confirmation) {
    confirmation.classList.remove('hidden');
    setTimeout(() => {
      confirmation.classList.add('hidden');
    }, 2000);
  }
}

/**
 * TASK-019: Setup event listeners
 */
function setupEventListeners() {
  // Settings button (Result screen → Settings screen)
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      showScreen('settings');
    });
  }
  
  // Back button (Settings screen → Result screen)
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      showScreen('result');
    });
  }
  
  // Settings form submit
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const languageSelect = document.getElementById('language-select');
      const toneSelect = document.getElementById('tone-select');
      
      const newSettings = {
        language: languageSelect.value,
        tone: toneSelect.value
      };
      
      const saved = await saveSettings(newSettings);
      
      if (saved) {
        showSaveConfirmation();
        // Return to result screen after a short delay
        setTimeout(() => {
          showScreen('result');
        }, 1500);
      }
    });
  }
  
  // Copy button (US-008)
  const copyBtn = document.getElementById('copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', handleCopy);
  }
  
  // Retry button (US-025)
  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', handleRetry);
  }
  
  console.log('[ExplainIt] Event listeners setup complete');
}

/**
 * US-008: Copy explanation to clipboard
 * TODO: Implement actual copy logic
 */
function handleCopy() {
  console.log('[ExplainIt] Copy button clicked');
  // TODO: US-008 - Implement clipboard functionality
  alert('Copy functionality will be implemented in US-008');
}

/**
 * US-025: Retry failed request
 * TODO: Implement retry logic
 */
function handleRetry() {
  console.log('[ExplainIt] Retry button clicked');
  // TODO: US-025 - Implement retry logic
  showState('loading');
}

/**
 * US-006: Show loading state with text preview
 * TASK-024: Implement loading state HTML
 * TASK-025: Add selected text preview
 */
function showLoadingState(selectedText = '') {
  console.log('[ExplainIt] Showing loading state');
  
  // Show loading state
  showState('loading');
  
  // TASK-025: Display text preview (first 100 characters)
  const textPreview = document.getElementById('text-preview');
  if (textPreview && selectedText) {
    const truncatedText = selectedText.length > 100 
      ? selectedText.substring(0, 100) + '...' 
      : selectedText;
    textPreview.textContent = truncatedText;
  }
  
  // TASK-026: Show timeout warning after 3 seconds
  clearTimeout(loadingTimeoutId);
  loadingTimeoutId = setTimeout(() => {
    const timeoutWarning = document.getElementById('timeout-warning');
    if (timeoutWarning) {
      timeoutWarning.classList.remove('hidden');
      console.log('[ExplainIt] Timeout warning displayed');
    }
  }, 3000);
}

/**
 * US-006: Hide loading state and clear timers
 */
function hideLoadingState() {
  console.log('[ExplainIt] Hiding loading state');
  
  // Clear timeout warning timer
  clearTimeout(loadingTimeoutId);
  loadingTimeoutId = null;
  
  // Hide timeout warning
  const timeoutWarning = document.getElementById('timeout-warning');
  if (timeoutWarning) {
    timeoutWarning.classList.add('hidden');
  }
  
  // Clear text preview
  const textPreview = document.getElementById('text-preview');
  if (textPreview) {
    textPreview.textContent = '';
  }
  
  // Abort any pending requests
  if (abortController) {
    abortController.abort();
    abortController = null;
    console.log('[ExplainIt] Pending request aborted');
  }
}

/**
 * US-006: Simulate API request with AbortController
 * TODO: Replace with actual API call in US-019
 */
async function fetchExplanation(text) {
  console.log('[ExplainIt] Fetching explanation for:', text);
  
  // Create AbortController for cancellable request
  abortController = new AbortController();
  
  try {
    // TODO: US-019 - Replace with actual backend API call
    // For now, simulate a delay
    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(resolve, 2000);
      
      // Listen for abort signal
      abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new DOMException('Request was aborted', 'AbortError'));
      });
    });
    
    // Simulate response
    return {
      result: `This is a simulated explanation for: "${text.substring(0, 50)}..."`
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('[ExplainIt] Request was cancelled');
      throw error;
    }
    console.error('[ExplainIt] Error fetching explanation:', error);
    throw error;
  } finally {
    abortController = null;
  }
}

/**
 * US-022: Check for selected text from content script
 * TODO: Implement in US-022
 */
async function checkForSelectedText() {
  console.log('[ExplainIt] Checking for selected text...');
  // TODO: US-022 - Get text from background script
  
  // For now, show empty state
  showState('empty');
}

/**
 * US-006: Test loading state (TEMP - for demo purposes)
 * TODO: Remove in US-022 when real flow is implemented
 */
async function testLoadingState() {
  const testText = 'This is a test text to demonstrate the loading state functionality. It should show a preview and then display a result after a simulated delay.';
  
  console.log('[ExplainIt] Testing loading state...');
  
  // Show loading state with preview
  showLoadingState(testText);
  
  try {
    // Simulate API call
    const response = await fetchExplanation(testText);
    
    // Hide loading state
    hideLoadingState();
    
    // Show result (US-007 will implement this properly)
    console.log('[ExplainIt] Explanation received:', response);
    // For now, just show empty state
    showState('empty');
  } catch (error) {
    if (error.name !== 'AbortError') {
      hideLoadingState();
      console.error('[ExplainIt] Error:', error);
      showState('empty');
    }
  }
}

/**
 * Initialize popup
 */
async function init() {
  console.log('[ExplainIt] Popup initialized');
  
  // Load settings first
  await loadSettings();
  
  // Setup event listeners
  setupEventListeners();
  
  // Show result screen by default
  showScreen('result');
  
  // Check for selected text
  await checkForSelectedText();
  
  // US-006: Add test button to console for loading state demo
  // Type `testLoadingState()` in console to see the loading state
  window.testLoadingState = testLoadingState;
  console.log('[ExplainIt] Popup ready. Type testLoadingState() in console to test loading state.');
}

/**
 * US-006: Cleanup on popup close
 * Ensures pending requests are aborted when popup is closed
 */
window.addEventListener('unload', () => {
  console.log('[ExplainIt] Popup closing, cleaning up...');
  hideLoadingState();
});

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showScreen,
    showState,
    loadSettings,
    saveSettings,
    showLoadingState,
    hideLoadingState,
    fetchExplanation
  };
}
