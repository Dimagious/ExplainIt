/**
 * ExplainIt! Popup Script
 * US-005: Popup Structure & Layout
 * US-006: Loading State UI
 * 
 * REFACTORED: Uses config.js for environment settings
 * SECURITY: Client-side validation before sending
 */

// Load config (injected via script tag in popup.html)
// Note: config.js must be loaded before this script in popup.html

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
 * TASK-048: Implement settings load on init
 * TASK-049: Add error handling with fallback
 */
async function loadSettings() {
  try {
    // US-012: Try chrome.storage.sync first (syncs across devices)
    const stored = await chrome.storage.sync.get(['language', 'tone']);
    
    settings = {
      language: stored.language || 'en', // US-010: Default English
      tone: stored.tone || 'simple' // US-011: Default Simple
    };
    
    console.log('[ExplainIt] Settings loaded from sync storage:', settings);
    updateSettingsUI();
  } catch (error) {
    console.error('[ExplainIt] Error loading from sync storage:', error);
    
    // TASK-049: Fallback to local storage
    try {
      const localStored = await chrome.storage.local.get(['language', 'tone']);
      settings = {
        language: localStored.language || 'en',
        tone: localStored.tone || 'simple'
      };
      console.log('[ExplainIt] Settings loaded from local storage (fallback):', settings);
      updateSettingsUI();
    } catch (localError) {
      console.error('[ExplainIt] Error loading from local storage:', localError);
      // Use hardcoded defaults
      settings = { language: 'en', tone: 'simple' };
      console.log('[ExplainIt] Using default settings');
    }
  }
}

/**
 * US-012: Save settings to chrome.storage.sync
 * TASK-047: Implement chrome.storage.sync save
 * TASK-049: Add error handling with fallback
 * TASK-050: Add validation before save
 */
async function saveSettings(newSettings) {
  // TASK-050: Validate settings before saving
  if (!validateSettings(newSettings)) {
    console.error('[ExplainIt] Invalid settings:', newSettings);
    return { success: false, error: 'Invalid settings values' };
  }
  
  try {
    // US-012: Try chrome.storage.sync first (syncs across devices)
    await chrome.storage.sync.set(newSettings);
    settings = { ...settings, ...newSettings };
    console.log('[ExplainIt] Settings saved to sync storage:', settings);
    return { success: true };
  } catch (error) {
    console.error('[ExplainIt] Error saving to sync storage:', error);
    
    // TASK-049: Fallback to local storage
    try {
      await chrome.storage.local.set(newSettings);
      settings = { ...settings, ...newSettings };
      console.log('[ExplainIt] Settings saved to local storage (fallback):', settings);
      return { success: true, fallback: true };
    } catch (localError) {
      console.error('[ExplainIt] Error saving to local storage:', localError);
      return { success: false, error: 'Failed to save settings' };
    }
  }
}

/**
 * TASK-050: Validate settings before saving
 * US-010: Validate language (en, ru)
 * US-011: Validate tone (simple, kid, expert)
 */
function validateSettings(newSettings) {
  const validLanguages = ['en', 'ru'];
  const validTones = ['simple', 'kid', 'expert'];
  
  // Check if language is provided and valid
  if (newSettings.language && !validLanguages.includes(newSettings.language)) {
    console.error('[ExplainIt] Invalid language:', newSettings.language);
    return false;
  }
  
  // Check if tone is provided and valid
  if (newSettings.tone && !validTones.includes(newSettings.tone)) {
    console.error('[ExplainIt] Invalid tone:', newSettings.tone);
    return false;
  }
  
  return true;
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
 * TASK-051: Add save confirmation UI
 * @param {string} type - 'saved', 'saved-local', or 'error'
 * @param {string} errorMessage - Optional error message
 */
function showSaveConfirmation(type = 'saved', errorMessage = null) {
  const confirmation = document.getElementById('save-confirmation');
  if (!confirmation) return;
  
  // Update message based on type
  if (type === 'saved') {
    confirmation.textContent = '✓ Settings saved successfully!';
    confirmation.className = 'save-confirmation success';
  } else if (type === 'saved-local') {
    confirmation.textContent = '✓ Settings saved locally (sync unavailable)';
    confirmation.className = 'save-confirmation warning';
  } else if (type === 'error') {
    confirmation.textContent = `⚠ Failed to save: ${errorMessage || 'Unknown error'}`;
    confirmation.className = 'save-confirmation error';
  }
  
  confirmation.classList.remove('hidden');
  
  setTimeout(() => {
    confirmation.classList.add('hidden');
  }, 2000);
}

/**
 * TASK-019: Setup event listeners
 */
function setupEventListeners() {
  // US-009: Settings button (Result screen → Settings screen)
  // TASK-037: Pre-populate current settings when opening
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      // US-009: Pre-populate form with current settings
      updateSettingsUI();
      showScreen('settings');
      console.log('[ExplainIt] Settings screen opened with current values');
    });
  }
  
  // US-009: Back button (Settings screen → Result screen)
  // TASK-038: Add back button logic (returns without saving)
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // US-009: Return without saving - reload form with current saved settings
      updateSettingsUI();
      showScreen('result');
      console.log('[ExplainIt] Returned to result screen without saving');
    });
  }
  
  // US-009/010/011/012: Settings form submit
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const languageSelect = document.getElementById('language-select');
      const toneSelect = document.getElementById('tone-select');
      const saveBtn = document.getElementById('save-btn');
      
      const newSettings = {
        language: languageSelect.value,
        tone: toneSelect.value
      };
      
      // Disable button during save
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      
      // US-012: Save settings with validation and error handling
      const result = await saveSettings(newSettings);
      
      if (result.success) {
        // TASK-051: Show success confirmation
        showSaveConfirmation(result.fallback ? 'saved-local' : 'saved');
        // US-009: Return to result screen after confirmation
        setTimeout(() => {
          showScreen('result');
        }, 1500);
      } else {
        // TASK-049: Show error message
        showSaveConfirmation('error', result.error);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Settings';
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
 * TASK-031: Implement Clipboard API
 * TASK-032: Add fallback copy method
 * TASK-034: Add button state transitions
 */
async function handleCopy() {
  console.log('[ExplainIt] Copy button clicked');
  
  const copyBtn = document.getElementById('copy-btn');
  const explanationElement = document.getElementById('explanation-content');
  const originalTextElement = document.getElementById('original-text-content');
  const includeOriginalCheckbox = document.getElementById('include-original');
  
  if (!explanationElement) {
    console.error('[ExplainIt] No explanation content found');
    return;
  }
  
  let textToCopy = '';
  
  // Check if user wants to include original text
  if (includeOriginalCheckbox && includeOriginalCheckbox.checked && originalTextElement) {
    const originalText = originalTextElement.textContent;
    const explanation = explanationElement.textContent;
    
    // Format with clear separation
    textToCopy = `Original text:\n${originalText}\n\n---\n\nExplanation:\n${explanation}`;
    console.log('[ExplainIt] Copying with original text');
  } else {
    textToCopy = explanationElement.textContent;
    console.log('[ExplainIt] Copying explanation only');
  }
  
  if (!textToCopy || textToCopy.trim() === '') {
    console.error('[ExplainIt] No text to copy');
    return;
  }
  
  try {
    // TASK-031: Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(textToCopy);
      console.log('[ExplainIt] Text copied using Clipboard API');
    } else {
      // TASK-032: Fallback to execCommand for older browsers
      await fallbackCopy(textToCopy);
      console.log('[ExplainIt] Text copied using fallback method');
    }
    
    // TASK-034: Update button state to show success
    showCopySuccess(copyBtn);
  } catch (error) {
    console.error('[ExplainIt] Failed to copy:', error);
    showCopyError(copyBtn);
  }
}

/**
 * TASK-032: Fallback copy method using execCommand
 */
function fallbackCopy(text) {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '-9999px';
      textarea.setAttribute('readonly', '');
      
      document.body.appendChild(textarea);
      
      // Select and copy
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      
      const successful = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textarea);
      
      if (successful) {
        resolve();
      } else {
        reject(new Error('execCommand failed'));
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * TASK-034: Show success state on copy button
 */
function showCopySuccess(button) {
  if (!button) return;
  
  // Save original content
  const originalHTML = button.innerHTML;
  
  // Change to success state
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.485 1.929a1 1 0 011.414 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L6.07 9.1l7.415-7.171z"/>
    </svg>
    Copied!
  `;
  button.classList.add('success');
  button.disabled = true;
  
  // Revert after 2 seconds
  setTimeout(() => {
    button.innerHTML = originalHTML;
    button.classList.remove('success');
    button.disabled = false;
  }, 2000);
}

/**
 * TASK-034: Show error state on copy button
 */
function showCopyError(button) {
  if (!button) return;
  
  const originalHTML = button.innerHTML;
  
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
      <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
    </svg>
    Failed
  `;
  button.classList.add('error');
  button.disabled = true;
  
  setTimeout(() => {
    button.innerHTML = originalHTML;
    button.classList.remove('error');
    button.disabled = false;
  }, 2000);
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
 * US-023: Fetch explanation from backend API
 * TASK-101: Implement fetch call with AbortController
 * TASK-103: Add timeout handling
 */
async function fetchExplanation(text) {
  console.log('[ExplainIt] Fetching explanation for:', text.substring(0, 50) + '...');
  
  // US-006: Show loading state
  showLoadingState(text);
  
  // TASK-101: Create AbortController for cancellable request
  abortController = new AbortController();
  const signal = abortController.signal;
  
  // TASK-103: Set timeout (30 seconds)
  const timeoutId = setTimeout(() => {
    if (abortController) {
      abortController.abort();
    }
  }, 30000);
  
  try {
    // US-023: Prepare request payload with current settings
    const requestBody = {
      text: text,
      tone: settings.tone,
      language: settings.language
    };
    
    // CLIENT-SIDE VALIDATION: Check text before sending
    if (typeof ExplainItConfig !== 'undefined') {
      const config = ExplainItConfig.getConfig();
      if (config.FEATURES.CLIENT_VALIDATION) {
        const validation = ExplainItConfig.validateText(text);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
        text = validation.sanitized;
      }
    }
    
    console.log('[ExplainIt] Request payload:', { 
      textLength: text.length, 
      tone: settings.tone, 
      language: settings.language 
    });
    
    // TASK-101: Call backend API via background script (has better network resilience)
    // Note: Background script handles timeout, retry, and fallback
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_EXPLANATION',
      text: text,
      tone: settings.tone,
      language: settings.language
    });
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to fetch explanation');
    }
    
    const data = { result: response.result };
    
    /* OLD DIRECT FETCH - Replaced with background script call for better resilience
    const API_URL = 'http://localhost:3000/api/v1/explain';
    
    const fetchResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: signal
    });
    
    // US-024: Parse response
    if (!fetchResponse.ok) {
      const errorData = await fetchResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
    }
    
    const data = await fetchResponse.json();
    */
    
    if (!data.result) {
      throw new Error('Empty response from server');
    }
    
    console.log('[ExplainIt] Received explanation:', data.result.substring(0, 50) + '...');
    
    // US-024: Display result
    hideLoadingState();
    showResult(text, data.result, settings);
    
  } catch (error) {
    clearTimeout(timeoutId);
    hideLoadingState();
    
    if (error.name === 'AbortError') {
      console.log('[ExplainIt] Request was cancelled');
      showState('empty');
      return;
    }
    
    console.error('[ExplainIt] Error fetching explanation:', error);
    
    // Show error state with retry button
    showErrorState(error.message, text);
    
  } finally {
    abortController = null;
  }
}

/**
 * US-022: Check for selected text from content script
 * TASK-099: Get text from background script
 */
async function checkForSelectedText() {
  console.log('[ExplainIt] Checking for selected text...');
  
  try {
    // US-022: Request text from background
    const response = await chrome.runtime.sendMessage({
      type: 'GET_SELECTED_TEXT'
    });
    
    if (response && response.success && response.text) {
      console.log('[ExplainIt] Received selected text:', response.text.substring(0, 50) + '...');
      
      // US-023: Immediately fetch explanation
      await fetchExplanation(response.text);
    } else {
      console.log('[ExplainIt] No selected text available:', response?.error);
      showState('empty');
    }
  } catch (error) {
    console.error('[ExplainIt] Error getting selected text:', error);
    showState('empty');
  }
}

/**
 * US-025/026: Show error state with retry option
 */
function showErrorState(errorMessage, originalText = '') {
  console.log('[ExplainIt] Showing error state:', errorMessage);
  
  const errorState = document.getElementById('error-state');
  const errorMessageElement = document.getElementById('error-message');
  const retryBtn = document.getElementById('retry-btn');
  
  if (errorMessageElement) {
    errorMessageElement.textContent = errorMessage;
  }
  
  // Store original text for retry
  if (originalText) {
    if (retryBtn) {
      retryBtn.onclick = () => {
        fetchExplanation(originalText);
      };
    }
  }
  
  showState('error');
}

/**
 * US-007: Display explanation result
 * TASK-028: Implement text rendering logic
 * TASK-030: Add settings badge
 */
function showResult(originalText, explanation, usedSettings = null) {
  console.log('[ExplainIt] Showing result');
  
  // Use current settings if not provided
  const resultSettings = usedSettings || settings;
  
  // TASK-027: Populate original text
  const originalTextElement = document.getElementById('original-text-content');
  if (originalTextElement) {
    // Show first 100 characters for context
    const truncatedOriginal = originalText.length > 100
      ? originalText.substring(0, 100) + '...'
      : originalText;
    originalTextElement.textContent = truncatedOriginal;
  }
  
  // TASK-028: Populate explanation with preserved formatting
  const explanationElement = document.getElementById('explanation-content');
  if (explanationElement) {
    // Preserve line breaks and formatting
    explanationElement.textContent = explanation;
  }
  
  // TASK-030: Update settings badge
  const settingsBadge = document.getElementById('settings-badge');
  if (settingsBadge) {
    const languageEmoji = resultSettings.language === 'ru' ? '🇷🇺' : '🇬🇧';
    const languageName = resultSettings.language === 'ru' ? 'Russian' : 'English';
    
    const toneMap = {
      simple: 'Simple words',
      kid: "Like I'm 5",
      expert: 'Expert level'
    };
    const toneName = toneMap[resultSettings.tone] || 'Simple words';
    
    settingsBadge.textContent = `${languageEmoji} ${languageName} • ${toneName}`;
  }
  
  // Hide loading and show result state
  hideLoadingState();
  showState('result');
}

/**
 * US-006/007: Test loading state and result display (TEMP - for demo purposes)
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
    
    // US-007: Show result instead of empty state
    showResult(
      testText,
      response.result,
      settings
    );
  } catch (error) {
    if (error.name !== 'AbortError') {
      hideLoadingState();
      console.error('[ExplainIt] Error:', error);
      showState('empty');
    }
  }
}

/**
 * US-007: Test result display directly (TEMP - for demo purposes)
 * Skip loading state and show result immediately
 */
function testResult() {
  const testText = 'The quick brown fox jumps over the lazy dog. This is a pangram sentence that contains every letter of the English alphabet at least once.';
  const testExplanation = `This is a detailed explanation with multiple paragraphs.\n\nThe sentence "The quick brown fox jumps over the lazy dog" is a famous pangram - a sentence that uses every letter of the English alphabet at least once.\n\nKey points:\n• It's often used for font testing\n• Contains all 26 letters\n• Easy to remember\n• Commonly used in typing practice\n\nThis makes it a perfect example for testing text display functionality, including:\n\n1. Line break preservation\n2. Paragraph spacing\n3. Scrollable content handling\n4. Text formatting\n\nThe result you see demonstrates how the explanation is rendered with proper formatting and readability.`;
  
  console.log('[ExplainIt] Testing result display...');
  showResult(testText, testExplanation, settings);
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
  
  // US-006/007: Add test functions to console for demo
  window.testLoadingState = testLoadingState;
  window.testResult = testResult;
  console.log('[ExplainIt] Popup ready.');
  console.log('Test functions: testLoadingState(), testResult()');
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
    validateSettings,
    showLoadingState,
    hideLoadingState,
    fetchExplanation,
    showResult,
    updateSettingsUI,
    showSaveConfirmation
  };
}
