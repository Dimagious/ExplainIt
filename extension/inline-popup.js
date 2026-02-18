/**
 * ExplainIt! Inline Popup
 * Shows explanation directly on the page (better UX than extension popup)
 * 
 * SECURITY: Uses textContent to prevent XSS attacks
 * ARCHITECTURE: Uses config.js for environment-based settings
 */

let inlinePopup = null;
let popupShadowRoot = null;
let settingsPopup = null;
let settingsPopupShadowRoot = null;
let retryCount = 0;
let currentText = null;
let currentSettings = { language: 'en', tone: 'simple', provider: 'openai' };

/**
 * Create inline popup window
 */
function createInlinePopup(selectedText) {
  // Remove existing popup if any
  removeInlinePopup();
  
  // Create container
  const container = document.createElement('div');
  container.id = 'explainit-popup-container';
  container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 999999;
    width: 500px;
    max-width: 90vw;
    max-height: 80vh;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  
  // Create shadow DOM for isolation
  popupShadowRoot = container.attachShadow({ mode: 'open' });
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    .popup {
      background: white;
      display: flex;
      flex-direction: column;
      max-height: 80vh;
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .header {
      padding: 16px 20px;
      background: #4A90E2;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .title {
      font-size: 18px;
      font-weight: 600;
    }
    
    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    }
    
    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .settings-btn {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s;
      margin-right: 8px;
    }
    
    .settings-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .content {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
    
    .settings-form {
      padding: 24px;
    }
    
    .form-group {
      margin-bottom: 24px;
    }
    
    .form-group:last-of-type {
      margin-bottom: 0;
    }
    
    .form-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }
    
    .form-description {
      font-size: 13px;
      color: #666;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    
    .form-select {
      width: 100%;
      padding: 10px 14px;
      border: 2px solid #e1e8ed;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      color: #333;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }
    
    .form-select:hover {
      border-color: #4A90E2;
    }
    
    .form-select:focus {
      outline: none;
      border-color: #4A90E2;
      box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
    }
    
    .explain-btn {
      width: 100%;
      background: #4A90E2;
      color: white;
      border: none;
      padding: 14px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 15px;
      font-weight: 600;
      margin-top: 8px;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
    }
    
    .explain-btn:hover {
      background: #357ABD;
      box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
      transform: translateY(-1px);
    }
    
    .explain-btn:active {
      transform: translateY(0);
    }
    
    .explain-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }
    
    .loading {
      text-align: center;
      padding: 40px 20px;
    }
    
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #4A90E2;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .loading-text {
      color: #666;
      font-size: 14px;
    }
    
    .result {
      line-height: 1.6;
    }
    
    .section-title {
      font-size: 12px;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .original-text {
      background: #f7f9fc;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
      color: #666;
      font-style: italic;
      max-height: 100px;
      overflow-y: auto;
    }
    
    .explanation {
      font-size: 15px;
      line-height: 1.8;
      color: #333;
      white-space: pre-wrap;
    }
    
    .footer {
      padding: 16px 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .settings-badge {
      font-size: 12px;
      color: #666;
    }
    
    .copy-btn {
      background: #4A90E2;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    
    .copy-btn:hover {
      background: #357ABD;
    }
    
    .copy-btn.copied {
      background: #50E3C2;
    }
    
    .error {
      text-align: center;
      padding: 40px 20px;
      color: #FF6B6B;
    }
    
    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .retry-btn {
      background: #4A90E2;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 16px;
    }
  `;
  
  popupShadowRoot.appendChild(style);
  
  // Load current settings
  chrome.storage.sync.get(['language', 'tone'], (syncStored) => {
    chrome.storage.local.get(['provider'], (localStored) => {
      currentSettings = {
        language: syncStored.language || 'en',
        tone: syncStored.tone || 'simple',
        provider: localStored.provider || 'openai'
      };
    
    // Add popup structure - show loading immediately
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
      <div class="header">
        <div class="title">🔍 ExplainIt!</div>
        <div style="display: flex; align-items: center;">
          <button class="settings-btn" title="Settings">⚙️</button>
          <button class="close-btn">×</button>
        </div>
      </div>
      <div class="content">
        <div class="settings-form" id="inline-settings-form" style="display: none;">
          <div class="form-group">
            <label class="form-label">
              <span>🤖</span>
              <span>AI Provider</span>
            </label>
            <div class="form-description">Choose which provider will generate explanations.</div>
            <select id="inline-provider-select" class="form-select">
              <option value="openai" ${currentSettings.provider === 'openai' ? 'selected' : ''}>OpenAI (GPT-4o mini)</option>
              <option value="anthropic" ${currentSettings.provider === 'anthropic' ? 'selected' : ''}>Anthropic (Claude Haiku)</option>
              <option value="gemini" ${currentSettings.provider === 'gemini' ? 'selected' : ''}>Google Gemini (Flash)</option>
              <option value="groq" ${currentSettings.provider === 'groq' ? 'selected' : ''}>Groq (Llama 3.3 70B)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">
              <span>🌍</span>
              <span>Explanation Language</span>
            </label>
            <div class="form-description">Your explanations will be provided in this language.</div>
            <select id="inline-language-select" class="form-select">
              <option value="en" ${currentSettings.language === 'en' ? 'selected' : ''}>English</option>
              <option value="ru" ${currentSettings.language === 'ru' ? 'selected' : ''}>Русский</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">
              <span>🎯</span>
              <span>Explanation Tone</span>
            </label>
            <div class="form-description">Choose how detailed and accessible the explanation should be.</div>
            <select id="inline-tone-select" class="form-select">
              <option value="simple" ${currentSettings.tone === 'simple' ? 'selected' : ''}>Simple words</option>
              <option value="kid" ${currentSettings.tone === 'kid' ? 'selected' : ''}>Like I'm 5</option>
              <option value="expert" ${currentSettings.tone === 'expert' ? 'selected' : ''}>Expert level</option>
            </select>
          </div>
          <button id="inline-save-settings-btn" class="explain-btn">Save & Explain</button>
        </div>
        <div id="inline-result-area">
          <div class="loading">
            <div class="spinner"></div>
            <div class="loading-text">Generating explanation...</div>
          </div>
        </div>
      </div>
    `;
    
    popupShadowRoot.appendChild(popup);
    
    // Add event handlers
    const closeBtn = popupShadowRoot.querySelector('.close-btn');
    closeBtn.addEventListener('click', removeInlinePopup);
    
    const settingsBtn = popupShadowRoot.querySelector('.settings-btn');
    const settingsForm = popupShadowRoot.querySelector('#inline-settings-form');
    const resultArea = popupShadowRoot.querySelector('#inline-result-area');
    
    settingsBtn.addEventListener('click', () => {
      // Toggle settings form visibility
      if (settingsForm.style.display === 'none') {
        settingsForm.style.display = 'block';
        resultArea.style.display = 'none';
      } else {
        settingsForm.style.display = 'none';
        resultArea.style.display = 'block';
      }
    });
    
    const saveSettingsBtn = popupShadowRoot.querySelector('#inline-save-settings-btn');
    saveSettingsBtn.addEventListener('click', () => {
      const providerSelect = popupShadowRoot.querySelector('#inline-provider-select');
      const languageSelect = popupShadowRoot.querySelector('#inline-language-select');
      const toneSelect = popupShadowRoot.querySelector('#inline-tone-select');
      
      currentSettings = {
        provider: providerSelect.value,
        language: languageSelect.value,
        tone: toneSelect.value
      };
      
      // Save settings
      chrome.storage.sync.set({
        language: currentSettings.language,
        tone: currentSettings.tone
      });
      chrome.storage.local.set({
        provider: currentSettings.provider
      });
      
      // Hide settings form and show loading
      settingsForm.style.display = 'none';
      resultArea.style.display = 'block';
      
      // Fetch explanation with new settings
      fetchExplanation(selectedText);
    });
    
    // Add to page
    document.body.appendChild(container);
    inlinePopup = container;
    
    // Immediately fetch explanation
    fetchExplanation(selectedText);
    });
  });
}


/**
 * Remove inline popup
 */
function removeInlinePopup() {
  if (inlinePopup && inlinePopup.parentNode) {
    inlinePopup.parentNode.removeChild(inlinePopup);
    inlinePopup = null;
    popupShadowRoot = null;
  }
}

/**
 * Fetch explanation via background service worker
 * (content scripts cannot call provider APIs directly because of CORS/permissions)
 *
 * SECURITY: validates text before sending
 */
async function fetchExplanation(text) {
  try {
    // Store current text for retry
    currentText = text;
    
    // CLIENT-SIDE VALIDATION: Check text before sending
    if (
      window.ExplainItConfig &&
      window.ExplainItConfig.CONFIG &&
      window.ExplainItConfig.CONFIG.FEATURES &&
      window.ExplainItConfig.CONFIG.FEATURES.CLIENT_VALIDATION &&
      typeof window.ExplainItConfig.validateText === 'function'
    ) {
      const validation = window.ExplainItConfig.validateText(text);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      text = validation.sanitized;
    }
    
    // Use current settings (already loaded)
    const provider = currentSettings.provider || 'openai';
    const language = currentSettings.language || 'en';
    const tone = currentSettings.tone || 'simple';
    
    console.log('[InlinePopup] Requesting explanation via background:', { 
      textLength: text.length, 
      provider,
      language, 
      tone,
      retryCount 
    });
    
    // Send message to background script (it has privileges to bypass CORS)
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_EXPLANATION',
      text: text,
      tone: tone,
      language: language,
      retryCount: retryCount
    });
    
    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to fetch explanation');
    }
    
    console.log('[InlinePopup] Got explanation from background');
    
    // Reset retry count on success
    retryCount = 0;
    
    // Display result
    showResult(text, response.result, provider, language, tone);
    
  } catch (error) {
    console.error('[InlinePopup] Error:', error);

    showError(error.message, text);
  }
}

/**
 * Show result in popup
 * SECURITY FIX: Uses textContent instead of innerHTML to prevent XSS
 */
function showResult(originalText, explanation, provider, language, tone) {
  if (!popupShadowRoot) return;
  
  const resultArea = popupShadowRoot.querySelector('#inline-result-area');
  if (!resultArea) return;
  const langLabel = language === 'en' ? '🇬🇧 English' : '🇷🇺 Русский';
  const providerLabel = ({
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    gemini: 'Gemini',
    groq: 'Groq'
  })[provider] || 'OpenAI';
  const toneLabels = {
    simple: 'Simple',
    kid: 'Kid-friendly',
    expert: 'Expert'
  };
  
  // Create structure safely without innerHTML
  const resultDiv = document.createElement('div');
  resultDiv.className = 'result';
  
  // Original text section
  const originalTitle = document.createElement('div');
  originalTitle.className = 'section-title';
  originalTitle.textContent = 'Original text';
  
  const originalTextDiv = document.createElement('div');
  originalTextDiv.className = 'original-text';
  originalTextDiv.textContent = originalText; // SAFE: textContent prevents XSS
  
  // Explanation section
  const explanationTitle = document.createElement('div');
  explanationTitle.className = 'section-title';
  explanationTitle.textContent = 'Explanation';
  
  const explanationDiv = document.createElement('div');
  explanationDiv.className = 'explanation';
  explanationDiv.textContent = explanation; // SAFE: textContent prevents XSS
  
  // Append all elements
  resultDiv.appendChild(originalTitle);
  resultDiv.appendChild(originalTextDiv);
  resultDiv.appendChild(explanationTitle);
  resultDiv.appendChild(explanationDiv);
  
  // Footer
  const footer = document.createElement('div');
  footer.className = 'footer';
  
  const badge = document.createElement('div');
  badge.className = 'settings-badge';
  badge.textContent = `${providerLabel} • ${langLabel} • ${toneLabels[tone]}`;
  
  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.textContent = '📋 Copy';
  
  footer.appendChild(badge);
  footer.appendChild(copyBtn);
  
  // Clear and append to result area
  resultArea.innerHTML = '';
  resultArea.appendChild(resultDiv);
  resultArea.appendChild(footer);
  resultArea.style.display = 'block';
  
  // Add copy handler
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(explanation).then(() => {
      copyBtn.textContent = '✓ Copied!';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy';
        copyBtn.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('[InlinePopup] Failed to copy:', err);
      copyBtn.textContent = '✗ Failed';
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy';
      }, 2000);
    });
  });
}

/**
 * Show error in popup
 * SECURITY FIX: Uses textContent instead of innerHTML to prevent XSS
 */
function showError(message, originalText) {
  if (!popupShadowRoot) return;
  
  const resultArea = popupShadowRoot.querySelector('#inline-result-area');
  
  // Create error structure safely
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  
  const errorIcon = document.createElement('div');
  errorIcon.className = 'error-icon';
  errorIcon.textContent = '⚠️';
  
  const errorMessage = document.createElement('div');
  errorMessage.textContent = message; // SAFE: textContent prevents XSS
  
  const retryBtn = document.createElement('button');
  retryBtn.className = 'retry-btn';
  retryBtn.textContent = 'Retry';
  
  errorDiv.appendChild(errorIcon);
  errorDiv.appendChild(errorMessage);
  errorDiv.appendChild(retryBtn);
  
  resultArea.innerHTML = '';
  resultArea.appendChild(errorDiv);
  resultArea.style.display = 'block';
  
  // Add retry handler
  retryBtn.addEventListener('click', () => {
    // Reset to loading state
    resultArea.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <div class="loading-text">Generating explanation...</div>
      </div>
    `;
    retryCount++;
    fetchExplanation(originalText);
  });
}

/**
 * Create settings popup (same mechanism as inline popup)
 */
function createSettingsPopup() {
  // Remove existing popups if any
  removeInlinePopup();
  removeSettingsPopup();
  
  // Load current settings
  chrome.storage.sync.get(['language', 'tone'], (stored) => {
    const settings = {
      language: stored.language || 'en',
      tone: stored.tone || 'simple'
    };
    
    // Create container
    const container = document.createElement('div');
    container.id = 'explainit-settings-popup-container';
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 999999;
      width: 400px;
      max-width: 90vw;
      max-height: 80vh;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    
    // Create shadow DOM for isolation
    settingsPopupShadowRoot = container.attachShadow({ mode: 'open' });
    
    // Add styles (reuse from inline popup)
    const style = document.createElement('style');
    style.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      .popup {
        background: white;
        display: flex;
        flex-direction: column;
        max-height: 80vh;
        animation: slideIn 0.3s ease-out;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .header {
        padding: 16px 20px;
        background: #4A90E2;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .title {
        font-size: 18px;
        font-weight: 600;
      }
      
      .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .content {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
      }
      
      .form-group {
        margin-bottom: 24px;
      }
      
      .form-group:last-of-type {
        margin-bottom: 0;
      }
      
      .form-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
      }
      
      .form-description {
        font-size: 13px;
        color: #666;
        margin-bottom: 12px;
        line-height: 1.5;
      }
      
      .form-select {
        width: 100%;
        padding: 10px 14px;
        border: 2px solid #e1e8ed;
        border-radius: 8px;
        font-size: 14px;
        background: white;
        color: #333;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      
      .form-select:hover {
        border-color: #4A90E2;
      }
      
      .form-select:focus {
        outline: none;
        border-color: #4A90E2;
        box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
      }
      
      .save-btn {
        width: 100%;
        background: #4A90E2;
        color: white;
        border: none;
        padding: 14px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 15px;
        font-weight: 600;
        margin-top: 8px;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
      }
      
      .save-btn:hover {
        background: #357ABD;
        box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
        transform: translateY(-1px);
      }
      
      .save-btn:active {
        transform: translateY(0);
      }
      
      .save-confirmation {
        margin-top: 12px;
        padding: 10px;
        background: #50E3C2;
        color: white;
        border-radius: 6px;
        text-align: center;
        font-size: 13px;
        font-weight: 500;
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      .save-confirmation.show {
        opacity: 1;
      }
    `;
    
    settingsPopupShadowRoot.appendChild(style);
    
    // Create popup structure
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
      <div class="header">
        <div class="title">🔍 ExplainIt!</div>
        <button class="close-btn">×</button>
      </div>
      <div class="content">
        <div class="form-group">
          <label class="form-label">
            <span>🌍</span>
            <span>Explanation Language</span>
          </label>
          <div class="form-description">Your explanations will be provided in this language.</div>
          <select id="settings-language-select" class="form-select">
            <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English</option>
            <option value="ru" ${settings.language === 'ru' ? 'selected' : ''}>Русский</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">
            <span>🎯</span>
            <span>Explanation Tone</span>
          </label>
          <div class="form-description">Choose how detailed and accessible the explanation should be.</div>
          <select id="settings-tone-select" class="form-select">
            <option value="simple" ${settings.tone === 'simple' ? 'selected' : ''}>Simple words</option>
            <option value="kid" ${settings.tone === 'kid' ? 'selected' : ''}>Like I'm 5</option>
            <option value="expert" ${settings.tone === 'expert' ? 'selected' : ''}>Expert level</option>
          </select>
        </div>
        <button id="settings-save-btn" class="save-btn">Save Settings</button>
        <div id="settings-confirmation" class="save-confirmation">✓ Settings saved successfully!</div>
      </div>
    `;
    
    settingsPopupShadowRoot.appendChild(popup);
    
    // Add event handlers
    const closeBtn = settingsPopupShadowRoot.querySelector('.close-btn');
    closeBtn.addEventListener('click', removeSettingsPopup);
    
    const saveBtn = settingsPopupShadowRoot.querySelector('#settings-save-btn');
    const confirmation = settingsPopupShadowRoot.querySelector('#settings-confirmation');
    
    saveBtn.addEventListener('click', () => {
      const languageSelect = settingsPopupShadowRoot.querySelector('#settings-language-select');
      const toneSelect = settingsPopupShadowRoot.querySelector('#settings-tone-select');
      
      const newSettings = {
        language: languageSelect.value,
        tone: toneSelect.value
      };
      
      // Save settings
      chrome.storage.sync.set(newSettings, () => {
        // Update current settings
        currentSettings = newSettings;
        
        // Show confirmation
        confirmation.classList.add('show');
        setTimeout(() => {
          confirmation.classList.remove('show');
        }, 2000);
      });
    });
    
    // Add to page
    document.body.appendChild(container);
    settingsPopup = container;
  });
}

/**
 * Remove settings popup
 */
function removeSettingsPopup() {
  if (settingsPopup && settingsPopup.parentNode) {
    settingsPopup.parentNode.removeChild(settingsPopup);
    settingsPopup = null;
    settingsPopupShadowRoot = null;
  }
}

// Close on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (inlinePopup) {
      removeInlinePopup();
    }
    if (settingsPopup) {
      removeSettingsPopup();
    }
  }
});

// Close on click outside
document.addEventListener('click', (e) => {
  if (inlinePopup && !inlinePopup.contains(e.target)) {
    removeInlinePopup();
  }
  if (settingsPopup && !settingsPopup.contains(e.target)) {
    removeSettingsPopup();
  }
});
