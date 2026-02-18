/**
 * ExplainIt! Popup Script
 * Multi-provider support: OpenAI, Anthropic, Google Gemini, Groq
 * API keys stored locally per provider; preferences synced across devices.
 */

// ─── State ────────────────────────────────────────────────────────────────────

let currentScreen = 'result';
let currentState = 'empty';

const DEFAULT_SETTINGS = {
  language: 'en',
  tone: 'simple',
  provider: 'openai',
  apiKeys: {}   // { openai: '...', anthropic: '...', gemini: '...', groq: '...' }
};

// Runtime settings (mutable, can include unsaved edits in Settings screen)
let settings = {
  ...DEFAULT_SETTINGS,
  apiKeys: {}
};

// Last successfully loaded/saved settings
let persistedSettings = {
  ...DEFAULT_SETTINGS,
  apiKeys: {}
};

// Tracks API key edits per provider during a settings session (unsaved)
let draftApiKeys = {};
let keyStatusByProvider = {};
let keyStatusMessageByProvider = {};

let loadingTimeoutId = null;
let abortController = null;

// ─── Provider metadata (mirrors config.js PROVIDERS) ─────────────────────────

const PROVIDER_META = {
  openai:    { name: 'OpenAI',    keyUrl: 'https://platform.openai.com/api-keys',        placeholder: 'sk-...' },
  anthropic: { name: 'Anthropic', keyUrl: 'https://console.anthropic.com/settings/keys', placeholder: 'sk-ant-...' },
  gemini:    { name: 'Google',    keyUrl: 'https://aistudio.google.com/app/apikey',       placeholder: 'AIza...' },
  groq:      { name: 'Groq',      keyUrl: 'https://console.groq.com/keys',               placeholder: 'gsk_...' }
};

const KEY_STATUS_LABELS = {
  'not-set': 'Not set',
  saved: 'Saved',
  testing: 'Testing...',
  validated: 'Validated',
  invalid: 'Invalid'
};

function storageGet(area, keys) {
  return new Promise((resolve, reject) => {
    try {
      if (!area || typeof area.get !== 'function') {
        resolve({});
        return;
      }

      // Callback-style Chrome API
      if (area.get.length >= 2) {
        area.get(keys, (result) => {
          const runtimeError = chrome?.runtime?.lastError;
          if (runtimeError) {
            reject(new Error(runtimeError.message));
            return;
          }
          resolve(result || {});
        });
        return;
      }

      // Promise-style API
      const maybePromise = area.get(keys);
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then((value) => resolve(value || {})).catch(reject);
        return;
      }

      resolve(maybePromise || {});
    } catch (error) {
      reject(error);
    }
  });
}

function storageSet(area, data) {
  return new Promise((resolve, reject) => {
    try {
      if (!area || typeof area.set !== 'function') {
        resolve();
        return;
      }

      // Callback-style Chrome API
      if (area.set.length >= 2) {
        area.set(data, () => {
          const runtimeError = chrome?.runtime?.lastError;
          if (runtimeError) {
            reject(new Error(runtimeError.message));
            return;
          }
          resolve();
        });
        return;
      }

      // Promise-style API
      const maybePromise = area.set(data);
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(() => resolve()).catch(reject);
        return;
      }

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function cloneSettings(source = {}) {
  return {
    language: source.language || DEFAULT_SETTINGS.language,
    tone: source.tone || DEFAULT_SETTINGS.tone,
    provider: source.provider || DEFAULT_SETTINGS.provider,
    apiKeys: { ...(source.apiKeys || {}) }
  };
}

// ─── Screen / state switching ─────────────────────────────────────────────────

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });

  const target = document.getElementById(`${screenId}-screen`);
  if (target) {
    target.classList.add('active');
    target.style.display = 'flex';
    currentScreen = screenId;
  }
}

function showState(stateId) {
  if (currentState === 'loading' && stateId !== 'loading') {
    hideLoadingState();
  }

  document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));

  const target = document.getElementById(`${stateId}-state`);
  if (target) {
    target.classList.remove('hidden');
    currentState = stateId;
  }
}

// ─── Settings: load ───────────────────────────────────────────────────────────

async function loadSettings() {
  let syncStored = {};
  let localStored = {};

  // Language + tone are synced across devices (preferences, not secrets)
  try {
    syncStored = await storageGet(chrome.storage.sync, ['language', 'tone']);
  } catch (error) {
    console.error('[ExplainIt] Error loading sync settings:', error);

    // Fallback: read language/tone from local if sync is unavailable
    try {
      const localSyncFallback = await storageGet(chrome.storage.local, ['language', 'tone']);
      syncStored = {
        language: localSyncFallback.language,
        tone: localSyncFallback.tone
      };
    } catch (fallbackError) {
      console.error('[ExplainIt] Error loading local fallback for sync settings:', fallbackError);
      syncStored = {};
    }
  }

  // Provider + API keys are local only (security)
  try {
    localStored = await storageGet(chrome.storage.local, ['provider', 'apiKeys']);
  } catch (error) {
    console.error('[ExplainIt] Error loading local settings:', error);
    localStored = {};
  }

  const loaded = cloneSettings({
    language: syncStored.language || localStored.language || DEFAULT_SETTINGS.language,
    tone: syncStored.tone || localStored.tone || DEFAULT_SETTINGS.tone,
    provider: localStored.provider || DEFAULT_SETTINGS.provider,
    apiKeys: localStored.apiKeys || {}
  });

  settings = cloneSettings(loaded);
  persistedSettings = cloneSettings(loaded);
  initializeKeyStatuses();

  console.log('[ExplainIt] Settings loaded:', { ...settings, apiKeys: '[redacted]' });
  updateSettingsUI();
}

// ─── Settings: save ───────────────────────────────────────────────────────────

async function saveSettings(newSettings) {
  if (!validateSettings(newSettings)) {
    return { success: false, error: 'Invalid settings values' };
  }

  const nextSettings = cloneSettings({ ...settings, ...newSettings });

  try {
    const { language, tone, provider, apiKeys } = nextSettings;

    // Preferences → sync storage (cross-device)
    await storageSet(chrome.storage.sync, { language, tone });

    // Provider + API keys → local storage only (security)
    await storageSet(chrome.storage.local, { provider, apiKeys });

    settings = cloneSettings(nextSettings);
    persistedSettings = cloneSettings(nextSettings);
    console.log('[ExplainIt] Settings saved');
    return { success: true };
  } catch (error) {
    console.error('[ExplainIt] Error saving settings:', error);

    // Fallback: save everything to local
    try {
      const { language, tone, provider, apiKeys } = nextSettings;
      await storageSet(chrome.storage.local, { language, tone, provider, apiKeys });
      settings = cloneSettings(nextSettings);
      persistedSettings = cloneSettings(nextSettings);
      return { success: true, fallback: true };
    } catch (localError) {
      console.error('[ExplainIt] Local storage fallback failed:', localError);
      return { success: false, error: 'Failed to save settings' };
    }
  }
}

// ─── Settings: validate ───────────────────────────────────────────────────────

function validateSettings(s) {
  const validLanguages = ['en', 'ru'];
  const validTones = ['simple', 'kid', 'expert'];
  const validProviders = ['openai', 'anthropic', 'gemini', 'groq'];

  // Use !== undefined so empty string '' is treated as invalid (not skipped as falsy)
  if (s.language !== undefined && !validLanguages.includes(s.language)) return false;
  if (s.tone     !== undefined && !validTones.includes(s.tone))         return false;
  if (s.provider !== undefined && !validProviders.includes(s.provider)) return false;

  return true;
}

function inferKeyStatusFromValue(value) {
  return value && value.trim().length > 0 ? 'saved' : 'not-set';
}

function initializeKeyStatuses() {
  keyStatusByProvider = {};
  keyStatusMessageByProvider = {};

  Object.keys(PROVIDER_META).forEach((providerId) => {
    const keyValue = settings.apiKeys?.[providerId] || '';
    keyStatusByProvider[providerId] = inferKeyStatusFromValue(keyValue);
    keyStatusMessageByProvider[providerId] = '';
  });
}

function updateKeyStatusUI(providerId = settings.provider) {
  const statusEl = document.getElementById('api-key-status');
  if (!statusEl) return;

  const status = keyStatusByProvider[providerId] || 'not-set';
  const message = keyStatusMessageByProvider[providerId] || '';
  const label = KEY_STATUS_LABELS[status] || KEY_STATUS_LABELS['not-set'];

  statusEl.textContent = message ? `${label}: ${message}` : label;
  statusEl.className = `key-status ${status}`;
}

function setKeyStatus(providerId, status, message = '') {
  keyStatusByProvider[providerId] = status;
  keyStatusMessageByProvider[providerId] = message;

  if (providerId === settings.provider) {
    updateKeyStatusUI(providerId);
  }
}

function isKeyRelatedErrorMessage(message = '') {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('no api key') ||
    normalized.includes('api key') ||
    normalized.includes('incorrect api key') ||
    normalized.includes('unauthorized') ||
    normalized.includes('401')
  );
}

function mapUserFacingError(message = '', keyRelatedHint = false) {
  const normalized = message.toLowerCase();

  if (isKeyRelatedErrorMessage(message) || keyRelatedHint) {
    return {
      message: 'API key issue detected.\nOpen Settings, verify provider/key, then click "Test key".',
      isKeyRelated: true
    };
  }

  if (normalized.includes('rate limit') || normalized.includes('429')) {
    return {
      message: 'Provider rate limit reached.\nWait a bit and retry, or switch to another provider.',
      isKeyRelated: false
    };
  }

  if (
    normalized.includes('timed out') ||
    normalized.includes('timeout') ||
    normalized.includes('network') ||
    normalized.includes('fetch')
  ) {
    return {
      message: 'Network/provider timeout.\nCheck connection and retry in a few seconds.',
      isKeyRelated: false
    };
  }

  return {
    message: message || 'Failed to generate explanation. Please try again.',
    isKeyRelated: false
  };
}

// ─── Settings UI ──────────────────────────────────────────────────────────────

function updateSettingsUI() {
  // Language + tone
  const langEl = document.getElementById('language-select');
  const toneEl = document.getElementById('tone-select');
  if (langEl) langEl.value = settings.language;
  if (toneEl) toneEl.value = settings.tone;

  // Provider radio
  const radio = document.querySelector(`input[name="provider"][value="${settings.provider}"]`);
  if (radio) radio.checked = true;

  // Reset draft keys to saved values at session start
  draftApiKeys = {};

  // Populate API key field for current provider
  updateApiKeyField(settings.provider);
}

/**
 * Update the API key input + link for a given provider
 */
function updateApiKeyField(providerId) {
  const meta = PROVIDER_META[providerId] || PROVIDER_META.openai;
  const keyInput = document.getElementById('api-key-input');
  const keyLink  = document.getElementById('get-key-link');
  const testKeyBtn = document.getElementById('test-key-btn');

  let keyValue = '';
  if (keyInput) {
    keyInput.placeholder = meta.placeholder;
    // Show saved or draft key (draft takes precedence)
    keyValue = draftApiKeys[providerId] !== undefined
      ? draftApiKeys[providerId]
      : (settings.apiKeys[providerId] || '');
    keyInput.value = keyValue;
  }

  if (keyLink) {
    keyLink.href = meta.keyUrl;
    keyLink.textContent = `Get ${meta.name} API key →`;
  }

  if (!keyStatusByProvider[providerId]) {
    keyStatusByProvider[providerId] = inferKeyStatusFromValue(keyValue);
    keyStatusMessageByProvider[providerId] = '';
  }

  updateKeyStatusUI(providerId);

  if (testKeyBtn) {
    testKeyBtn.disabled = !keyValue.trim();
  }
}

/**
 * Called when user clicks a different provider card
 */
function onProviderSwitch(newProviderId) {
  const currentProvider = settings.provider;

  // Persist current key field value to draft
  const keyInput = document.getElementById('api-key-input');
  if (keyInput) {
    draftApiKeys[currentProvider] = keyInput.value;
  }

  // Update in-memory current provider
  settings.provider = newProviderId;

  // Load key for the newly selected provider
  updateApiKeyField(newProviderId);
}

async function validateProviderKey(providerId, apiKey) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'VALIDATE_API_KEY',
      provider: providerId,
      apiKey
    });

    if (!response?.success) {
      return { success: false, error: response?.error || 'Provider rejected API key' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || 'Validation request failed' };
  }
}

// ─── Save confirmation ────────────────────────────────────────────────────────

function showSaveConfirmation(type = 'saved', errorMessage = null) {
  const el = document.getElementById('save-confirmation');
  if (!el) return;

  if (type === 'saved') {
    el.textContent = '✓ Settings saved successfully!';
    el.className = 'save-confirmation success';
  } else if (type === 'saved-local') {
    el.textContent = '✓ Settings saved locally (sync unavailable)';
    el.className = 'save-confirmation warning';
  } else {
    el.textContent = `⚠ Failed to save: ${errorMessage || 'Unknown error'}`;
    el.className = 'save-confirmation error';
  }

  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2000);
}

// ─── Settings badge (shown on result screen) ──────────────────────────────────

function updateSettingsBadge(usedSettings) {
  const badge = document.getElementById('settings-badge');
  if (!badge) return;

  const s = usedSettings || settings;
  const langEmoji = s.language === 'ru' ? '🇷🇺' : '🇬🇧';
  const toneMap = { simple: 'Simple', kid: "Like I'm 5", expert: 'Expert' };
  const providerName = (PROVIDER_META[s.provider] || PROVIDER_META.openai).name;

  badge.textContent = `${providerName} · ${langEmoji} · ${toneMap[s.tone] || 'Simple'}`;
}

// ─── Event listeners ──────────────────────────────────────────────────────────

function setupEventListeners() {
  // Open settings screen
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      settings = cloneSettings(persistedSettings);
      draftApiKeys = {}; // Reset draft on each open
      updateSettingsUI();
      document.getElementById('welcome-notice')?.classList.add('hidden');
      showScreen('settings');
    });
  }

  // Back button — discard unsaved changes
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      settings = cloneSettings(persistedSettings);
      draftApiKeys = {};
      // Reload UI with saved values
      updateSettingsUI();
      showScreen('result');
    });
  }

  // Provider card clicks
  document.querySelectorAll('input[name="provider"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      onProviderSwitch(e.target.value);
    });
  });

  // Show / hide API key toggle
  const toggleKeyBtn = document.getElementById('toggle-key-btn');
  const apiKeyInput  = document.getElementById('api-key-input');
  const testKeyBtn = document.getElementById('test-key-btn');
  if (toggleKeyBtn && apiKeyInput) {
    toggleKeyBtn.addEventListener('click', () => {
      const isHidden = apiKeyInput.type === 'password';
      apiKeyInput.type = isHidden ? 'text' : 'password';
      toggleKeyBtn.title = isHidden ? 'Hide key' : 'Show key';
    });

    apiKeyInput.addEventListener('input', () => {
      const provider = settings.provider;
      const keyValue = apiKeyInput.value.trim();
      draftApiKeys[provider] = keyValue;
      setKeyStatus(provider, inferKeyStatusFromValue(keyValue));
      if (testKeyBtn) {
        testKeyBtn.disabled = !keyValue;
      }
    });
  }

  if (testKeyBtn) {
    testKeyBtn.addEventListener('click', async () => {
      const provider = settings.provider;
      const keyValue = apiKeyInput?.value?.trim() || '';

      if (!keyValue) {
        setKeyStatus(provider, 'not-set');
        return;
      }

      setKeyStatus(provider, 'testing');
      testKeyBtn.disabled = true;
      testKeyBtn.textContent = 'Testing...';

      const result = await validateProviderKey(provider, keyValue);

      testKeyBtn.disabled = false;
      testKeyBtn.textContent = 'Test key';

      if (result.success) {
        setKeyStatus(provider, 'validated');
      } else {
        const shortError = (result.error || 'Invalid key').slice(0, 60);
        setKeyStatus(provider, 'invalid', shortError);
      }
    });
  }

  // Settings form submit
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const language  = document.getElementById('language-select').value;
      const tone      = document.getElementById('tone-select').value;
      const provider  = document.querySelector('input[name="provider"]:checked')?.value || settings.provider;
      const keyInput  = document.getElementById('api-key-input');
      const currentKey = keyInput?.value?.trim() || '';

      // Finalize draft keys
      draftApiKeys[provider] = currentKey;
      const mergedKeys = { ...settings.apiKeys, ...draftApiKeys };

      const saveBtn = document.getElementById('save-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const result = await saveSettings({ language, tone, provider, apiKeys: mergedKeys });

      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Settings';

      if (result.success) {
        setKeyStatus(provider, inferKeyStatusFromValue(currentKey));
        showSaveConfirmation(result.fallback ? 'saved-local' : 'saved');
        draftApiKeys = {};
        setTimeout(() => showScreen('result'), 1500);
      } else {
        showSaveConfirmation('error', result.error);
      }
    });
  }

  // Copy button
  const copyBtn = document.getElementById('copy-btn');
  if (copyBtn) copyBtn.addEventListener('click', handleCopy);

  // Retry button
  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) retryBtn.addEventListener('click', handleRetry);

  // "Open Settings" button in error state (for "no API key" errors)
  const errSettingsBtn = document.getElementById('error-settings-btn');
  if (errSettingsBtn) {
    errSettingsBtn.addEventListener('click', () => {
      draftApiKeys = {};
      updateSettingsUI();
      showScreen('settings');
      document.getElementById('welcome-notice')?.classList.remove('hidden');
    });
  }
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

async function handleCopy() {
  const copyBtn         = document.getElementById('copy-btn');
  const explanationEl   = document.getElementById('explanation-content');
  const originalTextEl  = document.getElementById('original-text-content');
  const includeOriginal = document.getElementById('include-original');

  if (!explanationEl) return;

  let textToCopy = explanationEl.textContent;

  if (includeOriginal?.checked && originalTextEl) {
    textToCopy = `Original text:\n${originalTextEl.textContent}\n\n---\n\nExplanation:\n${explanationEl.textContent}`;
  }

  if (!textToCopy?.trim()) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      await fallbackCopy(textToCopy);
    }
    showCopySuccess(copyBtn);
  } catch (error) {
    console.error('[ExplainIt] Copy failed:', error);
    showCopyError(copyBtn);
  }
}

function fallbackCopy(text) {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;top:0;left:-9999px';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    ok ? resolve() : reject(new Error('execCommand failed'));
  });
}

function showCopySuccess(button) {
  if (!button) return;
  const orig = button.innerHTML;
  button.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.929a1 1 0 011.414 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L6.07 9.1l7.415-7.171z"/></svg> Copied!`;
  button.classList.add('success');
  button.disabled = true;
  setTimeout(() => { button.innerHTML = orig; button.classList.remove('success'); button.disabled = false; }, 2000);
}

function showCopyError(button) {
  if (!button) return;
  const orig = button.innerHTML;
  button.innerHTML = 'Failed';
  button.classList.add('error');
  button.disabled = true;
  setTimeout(() => { button.innerHTML = orig; button.classList.remove('error'); button.disabled = false; }, 2000);
}

// ─── Retry ────────────────────────────────────────────────────────────────────

function handleRetry() {
  console.log('[ExplainIt] Retry button clicked');
  showState('loading');
}

// ─── Loading state ────────────────────────────────────────────────────────────

function showLoadingState(selectedText = '') {
  showState('loading');

  const textPreview = document.getElementById('text-preview');
  if (textPreview && selectedText) {
    textPreview.textContent = selectedText.length > 100
      ? selectedText.substring(0, 100) + '...'
      : selectedText;
  }

  clearTimeout(loadingTimeoutId);
  loadingTimeoutId = setTimeout(() => {
    document.getElementById('timeout-warning')?.classList.remove('hidden');
  }, 3000);
}

function hideLoadingState() {
  clearTimeout(loadingTimeoutId);
  loadingTimeoutId = null;

  document.getElementById('timeout-warning')?.classList.add('hidden');

  const textPreview = document.getElementById('text-preview');
  if (textPreview) textPreview.textContent = '';

  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}

// ─── Fetch explanation ────────────────────────────────────────────────────────

async function fetchExplanation(text) {
  console.log('[ExplainIt] Fetching explanation:', text.substring(0, 50) + '...');

  showLoadingState(text);

  abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController?.abort(), 30000);

  try {
    // Client-side validation
    if (typeof ExplainItConfig !== 'undefined' && ExplainItConfig.CONFIG.FEATURES.CLIENT_VALIDATION) {
      const validation = ExplainItConfig.validateText(text);
      if (!validation.valid) throw new Error(validation.error);
      text = validation.sanitized;
    }

    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_EXPLANATION',
      text,
      tone: settings.tone,
      language: settings.language
    });

    clearTimeout(timeoutId);

    if (!response?.success) {
      const rawError = response?.error || 'Failed to fetch explanation';
      throw Object.assign(new Error(rawError), { isNoKeyError: isKeyRelatedErrorMessage(rawError) });
    }

    hideLoadingState();
    showResult(text, response.result, settings);

  } catch (error) {
    clearTimeout(timeoutId);
    hideLoadingState();

    if (error.name === 'AbortError') {
      showState('empty');
      return;
    }

    console.error('[ExplainIt] Error fetching explanation:', error);
    const mapped = mapUserFacingError(error.message, error.isNoKeyError);
    showErrorState(mapped.message, text, mapped.isKeyRelated);
  } finally {
    abortController = null;
  }
}

// ─── Check for selected text ──────────────────────────────────────────────────

async function checkForSelectedText() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SELECTED_TEXT' });

    if (response?.success && response.text) {
      await fetchExplanation(response.text);
    } else {
      showState('empty');
    }
  } catch (error) {
    console.error('[ExplainIt] Error getting selected text:', error);
    showState('empty');
  }
}

// ─── Error state ──────────────────────────────────────────────────────────────

function showErrorState(errorMessage, originalText = '', isNoKeyError = false) {
  const errorMsgEl    = document.getElementById('error-message');
  const retryBtn      = document.getElementById('retry-btn');
  const errSettingsBtn = document.getElementById('error-settings-btn');

  if (errorMsgEl) errorMsgEl.textContent = errorMessage;

  // For "no API key" errors: hide Retry, show "Open Settings"
  if (isNoKeyError) {
    retryBtn?.classList.add('hidden');
    errSettingsBtn?.classList.remove('hidden');
  } else {
    retryBtn?.classList.remove('hidden');
    errSettingsBtn?.classList.add('hidden');

    if (originalText && retryBtn) {
      retryBtn.onclick = () => fetchExplanation(originalText);
    }
  }

  showState('error');
}

// ─── Result display ───────────────────────────────────────────────────────────

function showResult(originalText, explanation, usedSettings = null) {
  const s = usedSettings || settings;

  const origEl = document.getElementById('original-text-content');
  if (origEl) {
    origEl.textContent = originalText.length > 100
      ? originalText.substring(0, 100) + '...'
      : originalText;
  }

  const expEl = document.getElementById('explanation-content');
  if (expEl) expEl.textContent = explanation;

  updateSettingsBadge(s);

  hideLoadingState();
  showState('result');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  console.log('[ExplainIt] Initializing popup');

  await loadSettings();
  setupEventListeners();
  showScreen('result');

  // First-run check: if no API key for current provider → open Settings with welcome notice
  const hasKey = !!(settings.apiKeys[settings.provider]);
  if (!hasKey) {
    console.log('[ExplainIt] No API key found — opening Settings for first-run setup');
    document.getElementById('welcome-notice')?.classList.remove('hidden');
    showScreen('settings');
    return;
  }

  await checkForSelectedText();

  console.log('[ExplainIt] Popup ready');
}

// ─── Cleanup on popup close ───────────────────────────────────────────────────

window.addEventListener('unload', () => {
  hideLoadingState();
});

// ─── Start ────────────────────────────────────────────────────────────────────

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
    showSaveConfirmation,
    onProviderSwitch
  };
}
