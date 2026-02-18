/**
 * ExplainIt! Inline Popup
 * Shows explanation directly on the page (better UX than extension popup)
 * 
 * SECURITY: Uses textContent to prevent XSS attacks
 * ARCHITECTURE: Uses config.js for environment-based settings
 */

let inlinePopup = null;
let popupShadowRoot = null;
let retryCount = 0;
let currentText = null;
let currentSettings = { language: 'en', tone: 'simple', provider: 'openai', apiKeys: {} };

const INLINE_DEFAULT_SETTINGS = {
  language: 'en',
  tone: 'simple',
  provider: 'openai',
  apiKeys: {}
};

const INLINE_PROVIDER_META = {
  openai: {
    name: 'OpenAI',
    placeholder: 'sk-...',
    keyUrl: 'https://platform.openai.com/api-keys'
  },
  anthropic: {
    name: 'Anthropic',
    placeholder: 'sk-ant-...',
    keyUrl: 'https://console.anthropic.com/settings/keys'
  },
  gemini: {
    name: 'Google',
    placeholder: 'AIza...',
    keyUrl: 'https://aistudio.google.com/app/apikey'
  },
  groq: {
    name: 'Groq',
    placeholder: 'gsk_...',
    keyUrl: 'https://console.groq.com/keys'
  }
};

const INLINE_KEY_STATUS_LABELS = {
  'not-set': 'Not set',
  saved: 'Saved',
  testing: 'Testing...',
  validated: 'Validated',
  invalid: 'Invalid'
};

function inlineStorageGet(area, keys, callback) {
  try {
    if (!area || typeof area.get !== 'function') {
      callback(new Error('Storage area unavailable'), {});
      return;
    }

    area.get(keys, (result) => {
      const runtimeError = chrome?.runtime?.lastError;
      if (runtimeError) {
        callback(new Error(runtimeError.message), {});
        return;
      }
      callback(null, result || {});
    });
  } catch (error) {
    callback(error, {});
  }
}

function inlineStorageSet(area, payload, callback) {
  try {
    if (!area || typeof area.set !== 'function') {
      callback(new Error('Storage area unavailable'));
      return;
    }

    area.set(payload, () => {
      const runtimeError = chrome?.runtime?.lastError;
      callback(runtimeError ? new Error(runtimeError.message) : null);
    });
  } catch (error) {
    callback(error);
  }
}

function loadInlineSettings(callback) {
  inlineStorageGet(chrome.storage.sync, ['language', 'tone'], (syncError, syncStored) => {
    if (syncError) {
      console.error('[InlinePopup] Failed to load sync settings:', syncError);
    }

    inlineStorageGet(
      chrome.storage.local,
      ['provider', 'apiKeys', 'language', 'tone'],
      (localError, localStored) => {
        if (localError) {
          console.error('[InlinePopup] Failed to load local settings:', localError);
        }

        currentSettings = {
          language: syncStored.language || localStored.language || INLINE_DEFAULT_SETTINGS.language,
          tone: syncStored.tone || localStored.tone || INLINE_DEFAULT_SETTINGS.tone,
          provider: localStored.provider || INLINE_DEFAULT_SETTINGS.provider,
          apiKeys: { ...(localStored.apiKeys || {}) }
        };

        callback(currentSettings);
      }
    );
  });
}

function saveInlineSettings(nextSettings, callback) {
  const normalized = {
    language: nextSettings.language || INLINE_DEFAULT_SETTINGS.language,
    tone: nextSettings.tone || INLINE_DEFAULT_SETTINGS.tone,
    provider: nextSettings.provider || INLINE_DEFAULT_SETTINGS.provider,
    apiKeys: { ...(nextSettings.apiKeys || {}) }
  };

  inlineStorageSet(
    chrome.storage.sync,
    { language: normalized.language, tone: normalized.tone },
    (syncError) => {
      if (syncError) {
        console.error('[InlinePopup] Failed to save sync settings:', syncError);
      }

      inlineStorageSet(
        chrome.storage.local,
        { provider: normalized.provider, apiKeys: normalized.apiKeys },
        (localError) => {
          if (localError) {
            callback({
              success: false,
              error: 'Failed to save settings to local storage'
            });
            return;
          }

          currentSettings = normalized;
          callback({ success: true, fallback: !!syncError });
        }
      );
    }
  );
}

/**
 * Create inline popup window
 */
function createInlinePopup(selectedText, options = {}) {
  const openSettings = options.openSettings === true;
  const skipImmediateFetch = options.skipImmediateFetch === true;

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

    .api-key-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .form-input {
      width: 100%;
      padding: 10px 42px 10px 14px;
      border: 2px solid #e1e8ed;
      border-radius: 8px;
      font-size: 14px;
      color: #333;
      transition: all 0.2s;
      font-family: inherit;
    }

    .form-input:hover {
      border-color: #4A90E2;
    }

    .form-input:focus {
      outline: none;
      border-color: #4A90E2;
      box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
    }

    .toggle-key-btn {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      font-size: 14px;
    }

    .inline-key-row {
      margin-top: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .inline-key-status {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid transparent;
      color: #666;
      background: #f1f4f8;
    }

    .inline-key-status.not-set {
      color: #666;
      background: #f1f4f8;
      border-color: #d8e0e9;
    }

    .inline-key-status.saved {
      color: #1e5aa8;
      background: #e8f2fc;
      border-color: #bdd8f6;
    }

    .inline-key-status.testing {
      color: #8b5a00;
      background: rgba(245, 166, 35, 0.16);
      border-color: rgba(245, 166, 35, 0.4);
    }

    .inline-key-status.validated {
      color: #0c6b53;
      background: rgba(80, 227, 194, 0.2);
      border-color: rgba(80, 227, 194, 0.5);
    }

    .inline-key-status.invalid {
      color: #b42318;
      background: rgba(255, 107, 107, 0.14);
      border-color: rgba(255, 107, 107, 0.35);
    }

    .test-key-btn {
      background: #f7f9fc;
      color: #333;
      border: 1px solid #d8e0e9;
      border-radius: 8px;
      padding: 7px 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .test-key-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .form-link {
      color: #357ABD;
      text-decoration: none;
      font-weight: 600;
      margin-left: 4px;
    }

    .form-link:hover {
      text-decoration: underline;
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

    .save-note {
      margin-top: 10px;
      font-size: 12px;
      font-weight: 600;
      color: #666;
      min-height: 16px;
    }

    .save-note.success {
      color: #0E8C6D;
    }

    .save-note.warning {
      color: #C26A00;
    }

    .save-note.error {
      color: #D93025;
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
  loadInlineSettings(() => {
    let activeProvider = currentSettings.provider;
    const draftApiKeys = { ...(currentSettings.apiKeys || {}) };
    const hasSelectedText = typeof selectedText === 'string' && selectedText.trim().length > 0;
    const keyStatusByProvider = {};
    const keyStatusMessageByProvider = {};

    Object.keys(INLINE_PROVIDER_META).forEach((providerId) => {
      const hasKey = !!draftApiKeys[providerId];
      keyStatusByProvider[providerId] = hasKey ? 'saved' : 'not-set';
      keyStatusMessageByProvider[providerId] = '';
    });

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
        <div class="settings-form" id="inline-settings-form" style="display: ${openSettings ? 'block' : 'none'};">
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
              <span>🔑</span>
              <span>API Key</span>
            </label>
            <div class="form-description">
              Stored locally on this device only.
              <a id="inline-get-key-link" class="form-link" href="#" target="_blank" rel="noopener noreferrer">Get key →</a>
            </div>
            <div class="api-key-wrapper">
              <input
                id="inline-api-key-input"
                class="form-input"
                type="password"
                placeholder="Paste your API key"
                autocomplete="off"
                spellcheck="false"
              />
              <button id="inline-toggle-key-btn" class="toggle-key-btn" type="button" title="Show / hide key">👁️</button>
            </div>
            <div class="inline-key-row">
              <span id="inline-key-status" class="inline-key-status not-set">Not set</span>
              <button id="inline-test-key-btn" class="test-key-btn" type="button">Test key</button>
            </div>
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
          <button id="inline-save-settings-btn" class="explain-btn">${hasSelectedText ? 'Save & Explain' : 'Save Settings'}</button>
          <div id="inline-save-note" class="save-note"></div>
        </div>
        <div id="inline-result-area" style="display: ${openSettings ? 'none' : 'block'};">
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
    const providerSelect = popupShadowRoot.querySelector('#inline-provider-select');
    const keyInput = popupShadowRoot.querySelector('#inline-api-key-input');
    const toggleKeyBtn = popupShadowRoot.querySelector('#inline-toggle-key-btn');
    const getKeyLink = popupShadowRoot.querySelector('#inline-get-key-link');
    const keyStatus = popupShadowRoot.querySelector('#inline-key-status');
    const testKeyBtn = popupShadowRoot.querySelector('#inline-test-key-btn');
    const saveNote = popupShadowRoot.querySelector('#inline-save-note');

    const renderInlineKeyStatus = (providerId) => {
      if (!keyStatus) return;
      const status = keyStatusByProvider[providerId] || 'not-set';
      const message = keyStatusMessageByProvider[providerId] || '';
      const label = INLINE_KEY_STATUS_LABELS[status] || INLINE_KEY_STATUS_LABELS['not-set'];

      keyStatus.textContent = message ? `${label}: ${message}` : label;
      keyStatus.className = `inline-key-status ${status}`;
    };

    const setInlineKeyStatus = (providerId, status, message = '') => {
      keyStatusByProvider[providerId] = status;
      keyStatusMessageByProvider[providerId] = message;
      if (providerId === activeProvider) {
        renderInlineKeyStatus(providerId);
      }
    };

    const updateApiKeyField = (providerId) => {
      const meta = INLINE_PROVIDER_META[providerId] || INLINE_PROVIDER_META.openai;
      activeProvider = providerId;
      if (getKeyLink) {
        getKeyLink.href = meta.keyUrl;
        getKeyLink.textContent = `Get ${meta.name} key →`;
      }
      if (keyInput) {
        keyInput.placeholder = meta.placeholder;
        keyInput.value = draftApiKeys[providerId] || '';
      }
      if (providerSelect) {
        providerSelect.value = providerId;
      }
      renderInlineKeyStatus(providerId);
      if (testKeyBtn) {
        testKeyBtn.disabled = !(keyInput && keyInput.value.trim());
      }
    };

    updateApiKeyField(activeProvider);

    if (providerSelect) {
      providerSelect.addEventListener('change', () => {
        if (keyInput) {
          draftApiKeys[activeProvider] = keyInput.value.trim();
          setInlineKeyStatus(activeProvider, draftApiKeys[activeProvider] ? 'saved' : 'not-set');
        }
        updateApiKeyField(providerSelect.value);
      });
    }

    if (toggleKeyBtn && keyInput) {
      toggleKeyBtn.addEventListener('click', () => {
        const hidden = keyInput.type === 'password';
        keyInput.type = hidden ? 'text' : 'password';
      });
    }

    if (keyInput) {
      keyInput.addEventListener('input', () => {
        const keyValue = keyInput.value.trim();
        draftApiKeys[activeProvider] = keyValue;
        setInlineKeyStatus(activeProvider, keyValue ? 'saved' : 'not-set');
        if (testKeyBtn) {
          testKeyBtn.disabled = !keyValue;
        }
      });
    }

    if (testKeyBtn) {
      testKeyBtn.addEventListener('click', async () => {
        const apiKey = keyInput?.value?.trim() || '';
        if (!apiKey) {
          setInlineKeyStatus(activeProvider, 'not-set');
          return;
        }

        setInlineKeyStatus(activeProvider, 'testing');
        testKeyBtn.disabled = true;
        testKeyBtn.textContent = 'Testing...';

        try {
          const response = await chrome.runtime.sendMessage({
            type: 'VALIDATE_API_KEY',
            provider: activeProvider,
            apiKey
          });

          if (response?.success) {
            setInlineKeyStatus(activeProvider, 'validated');
          } else {
            const shortError = (response?.error || 'Invalid key').slice(0, 60);
            setInlineKeyStatus(activeProvider, 'invalid', shortError);
          }
        } catch (error) {
          const shortError = (error?.message || 'Validation failed').slice(0, 60);
          setInlineKeyStatus(activeProvider, 'invalid', shortError);
        } finally {
          testKeyBtn.textContent = 'Test key';
          testKeyBtn.disabled = !(keyInput && keyInput.value.trim());
        }
      });
    }

    settingsBtn.addEventListener('click', () => {
      // Toggle settings form visibility
      if (settingsForm.style.display === 'none') {
        settingsForm.style.display = 'block';
        resultArea.style.display = 'none';
      } else {
        settingsForm.style.display = 'none';
        resultArea.style.display = 'block';
        saveNote.textContent = '';
        saveNote.className = 'save-note';
      }
    });

    const saveSettingsBtn = popupShadowRoot.querySelector('#inline-save-settings-btn');
    saveSettingsBtn.addEventListener('click', () => {
      const languageSelect = popupShadowRoot.querySelector('#inline-language-select');
      const toneSelect = popupShadowRoot.querySelector('#inline-tone-select');

      if (keyInput) {
        draftApiKeys[activeProvider] = keyInput.value.trim();
      }

      const nextSettings = {
        provider: activeProvider,
        language: languageSelect.value,
        tone: toneSelect.value,
        apiKeys: {
          ...(currentSettings.apiKeys || {}),
          ...draftApiKeys
        }
      };

      saveSettingsBtn.disabled = true;
      saveSettingsBtn.textContent = 'Saving...';

      saveInlineSettings(nextSettings, (result) => {
        saveSettingsBtn.disabled = false;
        saveSettingsBtn.textContent = hasSelectedText ? 'Save & Explain' : 'Save Settings';

        if (!result.success) {
          saveNote.textContent = result.error || 'Failed to save settings';
          saveNote.className = 'save-note error';
          return;
        }

        saveNote.textContent = result.fallback
          ? 'Saved locally (sync unavailable)'
          : 'Settings saved';
        saveNote.className = `save-note ${result.fallback ? 'warning' : 'success'}`;

        if (hasSelectedText) {
          settingsForm.style.display = 'none';
          resultArea.style.display = 'block';
          resultArea.innerHTML = `
            <div class="loading">
              <div class="spinner"></div>
              <div class="loading-text">Generating explanation...</div>
            </div>
          `;
          fetchExplanation(selectedText);
        }
      });
    });

    // Add to page
    document.body.appendChild(container);
    inlinePopup = container;

    // Immediately fetch explanation
    if (!skipImmediateFetch && hasSelectedText) {
      fetchExplanation(selectedText);
    }
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

// Close on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (inlinePopup) {
      removeInlinePopup();
    }
  }
});

// Close on click outside
document.addEventListener('click', (e) => {
  if (inlinePopup && !inlinePopup.contains(e.target)) {
    removeInlinePopup();
  }
});
