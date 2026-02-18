/**
 * ExplainIt! Popup Script
 * Multi-provider support: OpenAI, Anthropic, Google Gemini, Groq
 * API keys stored locally per provider; preferences synced across devices.
 */

// ─── State ────────────────────────────────────────────────────────────────────

let currentScreen = 'result';
let currentState = 'empty';

// Runtime settings (loaded from storage on init)
let settings = {
  language: 'en',
  tone: 'simple',
  provider: 'openai',
  apiKeys: {}   // { openai: '...', anthropic: '...', gemini: '...', groq: '...' }
};

// Tracks API key edits per provider during a settings session (unsaved)
let draftApiKeys = {};

let loadingTimeoutId = null;
let abortController = null;

// ─── Provider metadata (mirrors config.js PROVIDERS) ─────────────────────────

const PROVIDER_META = {
  openai:    { name: 'OpenAI',    keyUrl: 'https://platform.openai.com/api-keys',        placeholder: 'sk-...' },
  anthropic: { name: 'Anthropic', keyUrl: 'https://console.anthropic.com/settings/keys', placeholder: 'sk-ant-...' },
  gemini:    { name: 'Google',    keyUrl: 'https://aistudio.google.com/app/apikey',       placeholder: 'AIza...' },
  groq:      { name: 'Groq',      keyUrl: 'https://console.groq.com/keys',               placeholder: 'gsk_...' }
};

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
  try {
    // Language + tone are synced across devices (preferences, not secrets)
    const [syncStored, localStored] = await Promise.all([
      chrome.storage.sync.get(['language', 'tone']),
      chrome.storage.local.get(['provider', 'apiKeys'])
    ]);

    settings = {
      language: syncStored.language || 'en',
      tone:     syncStored.tone     || 'simple',
      provider: localStored.provider || 'openai',
      apiKeys:  localStored.apiKeys  || {}
    };

    console.log('[ExplainIt] Settings loaded:', { ...settings, apiKeys: '[redacted]' });
    updateSettingsUI();
  } catch (error) {
    console.error('[ExplainIt] Error loading settings:', error);
    settings = { language: 'en', tone: 'simple', provider: 'openai', apiKeys: {} };
  }
}

// ─── Settings: save ───────────────────────────────────────────────────────────

async function saveSettings(newSettings) {
  if (!validateSettings(newSettings)) {
    return { success: false, error: 'Invalid settings values' };
  }

  try {
    const { language, tone, provider, apiKeys } = newSettings;

    // Preferences → sync storage (cross-device)
    await chrome.storage.sync.set({ language, tone });

    // Provider + API keys → local storage only (security)
    await chrome.storage.local.set({ provider, apiKeys });

    settings = { ...settings, ...newSettings };
    console.log('[ExplainIt] Settings saved');
    return { success: true };
  } catch (error) {
    console.error('[ExplainIt] Error saving settings:', error);

    // Fallback: save everything to local
    try {
      const { language, tone, provider, apiKeys } = newSettings;
      await chrome.storage.local.set({ language, tone, provider, apiKeys });
      settings = { ...settings, ...newSettings };
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

  if (s.language && !validLanguages.includes(s.language)) return false;
  if (s.tone     && !validTones.includes(s.tone))         return false;
  if (s.provider && !validProviders.includes(s.provider)) return false;

  return true;
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

  if (keyInput) {
    keyInput.placeholder = meta.placeholder;
    // Show saved or draft key (draft takes precedence)
    keyInput.value = draftApiKeys[providerId] !== undefined
      ? draftApiKeys[providerId]
      : (settings.apiKeys[providerId] || '');
  }

  if (keyLink) {
    keyLink.href = meta.keyUrl;
    keyLink.textContent = `Get ${meta.name} API key →`;
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
      draftApiKeys = {};
      settings.provider = document.querySelector('input[name="provider"]:checked')?.value || settings.provider;
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
  if (toggleKeyBtn && apiKeyInput) {
    toggleKeyBtn.addEventListener('click', () => {
      const isHidden = apiKeyInput.type === 'password';
      apiKeyInput.type = isHidden ? 'text' : 'password';
      toggleKeyBtn.title = isHidden ? 'Hide key' : 'Show key';
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
      const isNoKeyError = response?.error?.toLowerCase().includes('no api key') ||
                           response?.error?.toLowerCase().includes('api key');
      throw Object.assign(new Error(response?.error || 'Failed to fetch explanation'), { isNoKeyError });
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
    showErrorState(error.message, text, error.isNoKeyError);
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
