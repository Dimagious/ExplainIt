/**
 * @jest-environment jsdom
 */

describe('inline-popup.js settings flow', () => {
  let syncStore;
  let localStore;
  let sendMessage;
  let createInlinePopup;
  let mapInlineErrorMessage;

  function pickValues(store, keys) {
    if (!Array.isArray(keys)) {
      return { ...store };
    }

    return keys.reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(store, key)) {
        acc[key] = store[key];
      }
      return acc;
    }, {});
  }

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '<div id="app"></div>';

    syncStore = { language: 'en', tone: 'simple' };
    localStore = { provider: 'openai', apiKeys: { openai: 'sk-existing' } };
    sendMessage = jest.fn().mockResolvedValue({ success: true, result: 'ok' });

    global.chrome = {
      runtime: {
        sendMessage,
        lastError: null
      },
      storage: {
        sync: {
          get: (keys, cb) => cb(pickValues(syncStore, keys)),
          set: (payload, cb) => {
            Object.assign(syncStore, payload);
            cb?.();
          }
        },
        local: {
          get: (keys, cb) => cb(pickValues(localStore, keys)),
          set: (payload, cb) => {
            Object.assign(localStore, payload);
            cb?.();
          }
        }
      }
    };

    global.window.ExplainItConfig = {
      CONFIG: { FEATURES: { CLIENT_VALIDATION: false } },
      validateText: (text) => ({ valid: true, sanitized: text })
    };

    const mod = require('../inline-popup.js');
    createInlinePopup = mod.createInlinePopup;
    mapInlineErrorMessage = mod.mapInlineErrorMessage;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('maps key-related errors to guidance message', () => {
    const msg = mapInlineErrorMessage('Incorrect API key provided');
    expect(msg).toContain('API key issue');
  });

  test('opens unified settings mode without immediate fetch', () => {
    createInlinePopup('selected text', { openSettings: true, skipImmediateFetch: true });

    const container = document.getElementById('explainit-popup-container');
    expect(container).toBeTruthy();

    const root = container.shadowRoot;
    const settingsForm = root.querySelector('#inline-settings-form');
    const resultArea = root.querySelector('#inline-result-area');
    const providerSelect = root.querySelector('#inline-provider-select');

    expect(settingsForm.style.display).toBe('block');
    expect(resultArea.style.display).toBe('none');
    expect(providerSelect.value).toBe('openai');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('saves provider/key/language/tone from inline settings', async () => {
    createInlinePopup('', { openSettings: true, skipImmediateFetch: true });

    const root = document.getElementById('explainit-popup-container').shadowRoot;
    const providerSelect = root.querySelector('#inline-provider-select');
    const keyInput = root.querySelector('#inline-api-key-input');
    const languageSelect = root.querySelector('#inline-language-select');
    const toneSelect = root.querySelector('#inline-tone-select');
    const saveBtn = root.querySelector('#inline-save-settings-btn');

    providerSelect.value = 'groq';
    providerSelect.dispatchEvent(new Event('change'));

    keyInput.value = 'gsk_test_key';
    keyInput.dispatchEvent(new Event('input'));

    languageSelect.value = 'ru';
    toneSelect.value = 'expert';

    saveBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(syncStore.language).toBe('ru');
    expect(syncStore.tone).toBe('expert');
    expect(localStore.provider).toBe('groq');
    expect(localStore.apiKeys.groq).toBe('gsk_test_key');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('tests provider key and shows validated status', async () => {
    sendMessage.mockResolvedValueOnce({ success: true });

    createInlinePopup('', { openSettings: true, skipImmediateFetch: true });

    const root = document.getElementById('explainit-popup-container').shadowRoot;
    const keyInput = root.querySelector('#inline-api-key-input');
    const testBtn = root.querySelector('#inline-test-key-btn');
    const status = root.querySelector('#inline-key-status');

    keyInput.value = 'sk-live';
    keyInput.dispatchEvent(new Event('input'));

    testBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'VALIDATE_API_KEY',
      provider: 'openai',
      apiKey: 'sk-live'
    });
    expect(status.textContent).toContain('Validated');
  });
});
