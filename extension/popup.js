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
 * US-006/007: Simulate API request with AbortController
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
    
    // US-007: Simulate realistic response with formatting
    const explanations = [
      `This is a detailed explanation of the selected text.\n\nThe text appears to be about demonstrating the loading state functionality. Here's what it means:\n\n1. First, it shows how the system handles user input\n2. Then, it demonstrates the preview feature\n3. Finally, it displays the result after processing\n\nThis functionality is crucial for providing good user experience, as it keeps users informed about what's happening in the background.`,
      
      `Let me explain this in simple terms:\n\nThe selected text is demonstrating how our extension works. When you select text, the extension captures it and sends it for processing.\n\nKey points:\n• The loading state shows you that something is happening\n• The preview helps you confirm the right text was selected\n• The result appears after a short delay\n\nThis creates a smooth and intuitive user experience.`,
      
      `Quick explanation:\n\nThis text describes a test functionality. It simulates the process of:\n\n- Capturing selected text\n- Showing a loading indicator\n- Displaying a preview\n- Returning the final result\n\nThe delay is intentional to demonstrate the loading state behavior.`
    ];
    
    // Pick a random explanation
    const randomExplanation = explanations[Math.floor(Math.random() * explanations.length)];
    
    return {
      result: randomExplanation
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
    showLoadingState,
    hideLoadingState,
    fetchExplanation,
    showResult
  };
}
