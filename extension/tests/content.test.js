/**
 * @jest-environment jsdom
 */

describe('content.js selection flow', () => {
  let currentSelectionText = '';

  const selectionMock = {
    rangeCount: 1,
    toString: () => currentSelectionText,
    getRangeAt: () => ({
      getBoundingClientRect: () => ({ left: 10, right: 40, top: 20, bottom: 40 })
    }),
    removeAllRanges: jest.fn()
  };

  function loadModule() {
    jest.resetModules();
    document.body.innerHTML = '<main id="root">page</main>';
    window.getSelection = jest.fn(() => selectionMock);
    return require('../content.js');
  }

  beforeEach(() => {
    jest.useFakeTimers();
    currentSelectionText = '';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  test('validateText truncates long text to 2000 chars', () => {
    const mod = loadModule();
    const input = 'a'.repeat(2100);
    const result = mod.validateText(input);

    expect(result).toHaveLength(2000);
  });

  test('handleSelection renders floating icon for valid text', () => {
    const mod = loadModule();
    currentSelectionText = 'Explain this sentence please';

    mod.handleSelection();
    jest.advanceTimersByTime(350);

    const container = document.getElementById('explainit-icon-container');
    expect(container).toBeTruthy();

    const iconButton = container.shadowRoot.querySelector('.explainit-icon');
    expect(iconButton.getAttribute('role')).toBe('button');
    expect(iconButton.getAttribute('tabindex')).toBe('0');

    const settingsButton = container.shadowRoot.querySelector('.settings-gear');
    expect(settingsButton.getAttribute('role')).toBe('button');
    expect(settingsButton.getAttribute('tabindex')).toBe('0');
  });

  test('handleSelection removes icon for short text', () => {
    const mod = loadModule();

    currentSelectionText = 'valid text';
    mod.handleSelection();
    jest.advanceTimersByTime(350);
    expect(document.getElementById('explainit-icon-container')).toBeTruthy();

    currentSelectionText = 'hi';
    mod.handleSelection();
    jest.advanceTimersByTime(350);

    expect(document.getElementById('explainit-icon-container')).toBeNull();
  });
});
