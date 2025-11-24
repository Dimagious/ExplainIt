/**
 * ExplainIt! Popup Script
 * US-005: Popup Structure & Layout
 */

// State
let currentScreen = 'result';
let settings = {
  language: 'en',
  tone: 'simple'
};

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
 */
function showState(stateId) {
  const states = document.querySelectorAll('.content-section');
  states.forEach(state => {
    state.classList.add('hidden');
  });
  
  const targetState = document.getElementById(`${stateId}-state`);
  if (targetState) {
    targetState.classList.remove('hidden');
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
  
  console.log('[ExplainIt] Popup ready');
}

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
    saveSettings
  };
}
