/**
 * @jest-environment jsdom
 *
 * Tests for popup.js — settings logic, storage routing, draft key management.
 * No real API keys or network needed.
 *
 * Real bugs these tests catch:
 *  - API keys accidentally saved to chrome.storage.sync (security: keys would
 *    appear on all user's devices and in Google's sync servers)
 *  - provider accidentally saved to sync (fine, but inconsistent)
 *  - draftApiKeys merge overwrites already-saved keys for other providers
 *    (user adds OpenAI key, switches to Anthropic, saves → OpenAI key is gone)
 *  - validateSettings accepts invalid providers like 'facebook' or 'gpt-5'
 *  - onProviderSwitch loses the key the user typed before switching
 *  - isNoKeyError detection misses error messages → shows Retry instead of Open Settings
 */

// ─── Set up chrome mock BEFORE requiring popup.js ────────────────────────────

const mockSyncGet   = jest.fn();
const mockSyncSet   = jest.fn();
const mockLocalGet  = jest.fn();
const mockLocalSet  = jest.fn();
const mockSendMsg   = jest.fn();

global.chrome = {
  storage: {
    sync:  { get: mockSyncGet,  set: mockSyncSet  },
    local: { get: mockLocalGet, set: mockLocalSet }
  },
  runtime: { sendMessage: mockSendMsg }
};

// Default: no saved settings, no API keys
mockSyncGet.mockResolvedValue({});
mockLocalGet.mockResolvedValue({});
mockSyncSet.mockResolvedValue(undefined);
mockLocalSet.mockResolvedValue(undefined);
mockSendMsg.mockResolvedValue({ success: false, error: 'No text stored' });

// ─── Minimal DOM for popup.js to initialise without crashing ─────────────────

document.body.innerHTML = `
  <div id="result-screen"  class="screen active" style="display:flex; flex-direction:column">
    <button id="settings-btn"></button>
    <div id="loading-state" class="content-section hidden"></div>
    <div id="result-state"  class="content-section hidden">
      <p  id="original-text-content"></p>
      <div id="explanation-content"></div>
      <span id="settings-badge"></span>
    </div>
    <div id="error-state" class="content-section hidden">
      <p id="error-message"></p>
      <button id="retry-btn"></button>
      <button id="error-settings-btn" class="hidden"></button>
    </div>
    <div id="empty-state" class="content-section"></div>
    <div id="text-preview"></div>
    <p   id="timeout-warning" class="hidden"></p>
  </div>
  <div id="settings-screen" class="screen" style="display:none; flex-direction:column">
    <button id="back-btn" type="button"></button>
    <div id="welcome-notice" class="hidden"></div>
    <form id="settings-form">
      <input type="radio" name="provider" value="openai" />
      <input type="radio" name="provider" value="anthropic" />
      <input type="radio" name="provider" value="gemini" />
      <input type="radio" name="provider" value="groq" />
      <input id="api-key-input" type="password" />
      <a    id="get-key-link" href="#">link</a>
      <select id="language-select">
        <option value="en">en</option>
        <option value="ru">ru</option>
      </select>
      <select id="tone-select">
        <option value="simple">simple</option>
        <option value="kid">kid</option>
        <option value="expert">expert</option>
      </select>
      <button id="save-btn" type="submit">Save</button>
    </form>
    <div id="save-confirmation" class="hidden"></div>
  </div>
`;

// ─── Import popup.js (init() runs immediately in jsdom) ───────────────────────

const {
  validateSettings,
  saveSettings,
  loadSettings,
  onProviderSwitch,
  fetchExplanation
} = require('../popup.js');

// Allow init() async chain to settle before any test runs
beforeAll(() => new Promise(r => setTimeout(r, 50)));

// ─── validateSettings ─────────────────────────────────────────────────────────

describe('validateSettings', () => {
  test('accepts all valid providers', () => {
    expect(validateSettings({ provider: 'openai' })).toBe(true);
    expect(validateSettings({ provider: 'anthropic' })).toBe(true);
    expect(validateSettings({ provider: 'gemini' })).toBe(true);
    expect(validateSettings({ provider: 'groq' })).toBe(true);
  });

  test('rejects unknown providers', () => {
    expect(validateSettings({ provider: 'facebook' })).toBe(false);
    expect(validateSettings({ provider: 'gpt-5' })).toBe(false);
    expect(validateSettings({ provider: '' })).toBe(false);
    expect(validateSettings({ provider: 'OPENAI' })).toBe(false); // case-sensitive
  });

  test('accepts valid languages', () => {
    expect(validateSettings({ language: 'en' })).toBe(true);
    expect(validateSettings({ language: 'ru' })).toBe(true);
  });

  test('rejects unsupported languages', () => {
    expect(validateSettings({ language: 'fr' })).toBe(false);
    expect(validateSettings({ language: 'de' })).toBe(false);
    expect(validateSettings({ language: 'EN' })).toBe(false); // case-sensitive
  });

  test('accepts valid tones', () => {
    expect(validateSettings({ tone: 'simple' })).toBe(true);
    expect(validateSettings({ tone: 'kid' })).toBe(true);
    expect(validateSettings({ tone: 'expert' })).toBe(true);
  });

  test('rejects unknown tones', () => {
    expect(validateSettings({ tone: 'genius' })).toBe(false);
    expect(validateSettings({ tone: 'casual' })).toBe(false);
  });

  test('accepts partial settings — only validates fields that are present', () => {
    // Not all fields required; validateSettings is called with form state
    expect(validateSettings({ language: 'ru' })).toBe(true);
    expect(validateSettings({ tone: 'expert' })).toBe(true);
    expect(validateSettings({})).toBe(true);
  });
});

// ─── saveSettings — storage routing (CRITICAL security test) ─────────────────

describe('saveSettings: storage routing', () => {
  beforeEach(() => {
    mockSyncSet.mockClear();
    mockLocalSet.mockClear();
    mockSyncSet.mockResolvedValue(undefined);
    mockLocalSet.mockResolvedValue(undefined);
  });

  test('API keys go to LOCAL storage — never to sync storage', async () => {
    await saveSettings({
      language: 'en',
      tone: 'simple',
      provider: 'openai',
      apiKeys: { openai: 'sk-supersecretkey' }
    });

    // Keys MUST be in local
    expect(mockLocalSet).toHaveBeenCalledWith(
      expect.objectContaining({ apiKeys: { openai: 'sk-supersecretkey' } })
    );
    // Keys must NOT appear in sync calls
    const syncCalls = mockSyncSet.mock.calls.flat();
    const syncCallsStr = JSON.stringify(syncCalls);
    expect(syncCallsStr).not.toContain('sk-supersecretkey');
    expect(syncCallsStr).not.toContain('apiKeys');
  });

  test('provider goes to LOCAL storage — not sync', async () => {
    await saveSettings({
      language: 'en', tone: 'simple', provider: 'anthropic', apiKeys: {}
    });

    expect(mockLocalSet).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'anthropic' })
    );
    expect(mockSyncSet).not.toHaveBeenCalledWith(
      expect.objectContaining({ provider: expect.anything() })
    );
  });

  test('language goes to SYNC storage (cross-device preference)', async () => {
    await saveSettings({
      language: 'ru', tone: 'simple', provider: 'openai', apiKeys: {}
    });

    expect(mockSyncSet).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'ru' })
    );
  });

  test('tone goes to SYNC storage (cross-device preference)', async () => {
    await saveSettings({
      language: 'en', tone: 'expert', provider: 'openai', apiKeys: {}
    });

    expect(mockSyncSet).toHaveBeenCalledWith(
      expect.objectContaining({ tone: 'expert' })
    );
  });

  test('saving does not return an error on happy path', async () => {
    const result = await saveSettings({
      language: 'en', tone: 'simple', provider: 'openai',
      apiKeys: { openai: 'sk-key' }
    });
    expect(result.success).toBe(true);
  });

  test('rejects invalid settings and does not call storage', async () => {
    const result = await saveSettings({
      language: 'en', tone: 'simple', provider: 'facebook', apiKeys: {}
    });

    expect(result.success).toBe(false);
    expect(mockSyncSet).not.toHaveBeenCalled();
    expect(mockLocalSet).not.toHaveBeenCalled();
  });
});

// ─── onProviderSwitch — draft key management ──────────────────────────────────

describe('onProviderSwitch: preserves API keys across provider switches', () => {
  beforeEach(async () => {
    // Set up saved state: openai key exists, anthropic key exists, no gemini key
    mockLocalGet.mockResolvedValue({
      provider: 'openai',
      apiKeys: { openai: 'sk-saved-openai', anthropic: 'sk-ant-saved' }
    });
    mockSyncGet.mockResolvedValue({ language: 'en', tone: 'simple' });
    await loadSettings();
  });

  test('loads saved key for current provider into input on init', () => {
    const input = document.getElementById('api-key-input');
    // After loadSettings with openai as current provider, input should show openai key
    expect(input.value).toBe('sk-saved-openai');
  });

  test('saves typed key to draft before switching — key is not lost', () => {
    const input = document.getElementById('api-key-input');
    input.value = 'sk-modified-openai'; // User typed a new key

    onProviderSwitch('anthropic');   // Switch away
    onProviderSwitch('openai');      // Switch back

    // The modified key must be shown (from draft), not the original saved value
    expect(input.value).toBe('sk-modified-openai');
  });

  test('loads the saved key of the new provider when switching', () => {
    const input = document.getElementById('api-key-input');

    onProviderSwitch('anthropic');

    expect(input.value).toBe('sk-ant-saved');
  });

  test('shows empty input for a provider with no saved key', () => {
    const input = document.getElementById('api-key-input');

    onProviderSwitch('gemini'); // no saved key for gemini

    expect(input.value).toBe('');
  });

  test('switching twice does not overwrite the first draft', () => {
    const input = document.getElementById('api-key-input');
    input.value = 'sk-new-openai-key';

    onProviderSwitch('anthropic');   // openai key saved to draft
    input.value = 'sk-new-anthropic-key';
    onProviderSwitch('openai');      // anthropic key saved to draft, openai draft loaded

    expect(input.value).toBe('sk-new-openai-key');
  });

  test('back button discards unsaved provider switch', () => {
    const input = document.getElementById('api-key-input');
    const anthropicRadio = document.querySelector('input[name="provider"][value="anthropic"]');
    const backBtn = document.getElementById('back-btn');

    anthropicRadio.checked = true;
    anthropicRadio.dispatchEvent(new Event('change', { bubbles: true }));
    expect(input.value).toBe('sk-ant-saved');

    backBtn.click();

    const checked = document.querySelector('input[name="provider"]:checked');
    expect(checked?.value).toBe('openai');
    expect(input.value).toBe('sk-saved-openai');
  });
});

// ─── fetchExplanation: real error UX path ─────────────────────────────────────

describe('fetchExplanation: API key errors vs retryable errors', () => {
  test('shows "Open Settings" for missing API key errors', async () => {
    mockSendMsg.mockResolvedValueOnce({
      success: false,
      error: 'No API key configured. Open Settings and add your API key.'
    });

    await fetchExplanation('test text');

    expect(document.getElementById('retry-btn').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('error-settings-btn').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('error-message').textContent).toContain('API key issue detected');
  });

  test('shows Retry for non-key errors', async () => {
    mockSendMsg.mockResolvedValueOnce({
      success: false,
      error: 'Internal Server Error'
    });

    await fetchExplanation('test text');

    expect(document.getElementById('retry-btn').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('error-settings-btn').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('error-message').textContent).toContain('Internal Server Error');
  });
});

// ─── loadSettings: defaults ───────────────────────────────────────────────────

describe('loadSettings: default values when storage is empty', () => {
  beforeEach(() => {
    mockSyncGet.mockResolvedValue({});
    mockLocalGet.mockResolvedValue({});
  });

  test('defaults to English language', async () => {
    await loadSettings();
    const select = document.getElementById('language-select');
    expect(select.value).toBe('en');
  });

  test('defaults to simple tone', async () => {
    await loadSettings();
    const select = document.getElementById('tone-select');
    expect(select.value).toBe('simple');
  });

  test('defaults to openai provider', async () => {
    await loadSettings();
    const radio = document.querySelector('input[name="provider"]:checked');
    expect(radio?.value).toBe('openai');
  });
});

describe('loadSettings: fallback behavior when sync is unavailable', () => {
  test('loads language and tone from local fallback when sync.get fails', async () => {
    mockSyncGet.mockRejectedValue(new Error('Sync unavailable'));
    mockLocalGet.mockImplementation((keys) => {
      if (Array.isArray(keys) && keys.includes('provider')) {
        return Promise.resolve({
          provider: 'groq',
          apiKeys: { groq: 'gsk-local' }
        });
      }

      if (Array.isArray(keys) && keys.includes('language')) {
        return Promise.resolve({
          language: 'ru',
          tone: 'expert'
        });
      }

      return Promise.resolve({});
    });

    await loadSettings();

    expect(document.getElementById('language-select').value).toBe('ru');
    expect(document.getElementById('tone-select').value).toBe('expert');

    const checked = document.querySelector('input[name="provider"]:checked');
    expect(checked?.value).toBe('groq');
    expect(document.getElementById('api-key-input').value).toBe('gsk-local');
  });
});
