/**
 * Tests for background.js — API format correctness and retry logic.
 * Uses mocked fetch — no real API keys needed.
 *
 * Real bugs these tests catch:
 *  - Anthropic called with Authorization header → API returns 401 (should use x-api-key)
 *  - Gemini key sent in header instead of URL → API ignores it, returns 401
 *  - Groq called with Anthropic format → API returns 400 (it's OpenAI-compatible)
 *  - Response parsed from wrong field → result is undefined, shown as "Empty response"
 *  - 401 auth error is retried → wastes time, still fails, burns quota
 *  - 500 server error is NOT retried → user sees error when a retry would have worked
 *  - Empty choices/content array causes unhandled crash instead of clean error
 */

// ─── Mock chrome APIs before importing background.js ─────────────────────────

global.chrome = {
  runtime: { onMessage: { addListener: jest.fn() } },
  storage: { local: { get: jest.fn() } },
  tabs:    { query: jest.fn() }
};

global.fetch = jest.fn();

const {
  buildPrompt,
  callOpenAICompatible,
  callAnthropic,
  callGemini,
  callProvider,
  fetchExplanationWithResilience
} = require('../background.js');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockFetchOk(json) {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(json)
  });
}

function mockFetchFail(status, message = 'Error from server') {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ error: { message } })
  });
}

function mockFetchNetworkError(message = 'network error') {
  global.fetch.mockRejectedValueOnce(new Error(message));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

// ─── callOpenAICompatible ─────────────────────────────────────────────────────

describe('callOpenAICompatible', () => {
  const url   = 'https://api.openai.com/v1/chat/completions';
  const key   = 'sk-testkey';
  const model = 'gpt-4o-mini';
  const okResponse = { choices: [{ message: { content: 'Great explanation' } }] };

  test('sends Authorization: Bearer header', async () => {
    mockFetchOk(okResponse);
    await callOpenAICompatible(url, key, model, 'test prompt');

    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.headers['Authorization']).toBe(`Bearer ${key}`);
  });

  test('does NOT send x-api-key header (that is Anthropic format)', async () => {
    mockFetchOk(okResponse);
    await callOpenAICompatible(url, key, model, 'test prompt');

    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.headers['x-api-key']).toBeUndefined();
  });

  test('extracts result from choices[0].message.content', async () => {
    mockFetchOk(okResponse);
    const result = await callOpenAICompatible(url, key, model, 'test');
    expect(result).toBe('Great explanation');
  });

  test('throws "Empty response" when choices array is empty', async () => {
    mockFetchOk({ choices: [] });
    await expect(callOpenAICompatible(url, key, model, 'test'))
      .rejects.toThrow('Empty response from provider');
  });

  test('throws "Empty response" when content field is missing', async () => {
    mockFetchOk({ choices: [{ message: {} }] });
    await expect(callOpenAICompatible(url, key, model, 'test'))
      .rejects.toThrow('Empty response from provider');
  });

  test('throws with API error message on HTTP error', async () => {
    mockFetchFail(401, 'Incorrect API key provided');
    await expect(callOpenAICompatible(url, key, model, 'test'))
      .rejects.toThrow('Incorrect API key provided');
  });

  test('attaches status code to thrown error (needed for retry detection)', async () => {
    mockFetchFail(500, 'Internal Server Error');
    const err = await callOpenAICompatible(url, key, model, 'test').catch(e => e);
    expect(err.status).toBe(500);
  });

  test('sends POST with JSON body', async () => {
    mockFetchOk(okResponse);
    await callOpenAICompatible(url, key, model, 'explain gravity');

    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.messages[0].content).toBe('explain gravity');
    expect(body.model).toBe(model);
  });
});

// ─── callAnthropic ────────────────────────────────────────────────────────────

describe('callAnthropic', () => {
  const key   = 'sk-ant-testkey';
  const model = 'claude-3-5-haiku-20241022';
  const okResponse = { content: [{ text: 'Anthropic explanation' }] };

  test('sends x-api-key header — NOT Authorization', async () => {
    mockFetchOk(okResponse);
    await callAnthropic(key, model, 'test prompt');

    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.headers['x-api-key']).toBe(key);
    expect(opts.headers['Authorization']).toBeUndefined();
  });

  test('sends required anthropic-version header', async () => {
    mockFetchOk(okResponse);
    await callAnthropic(key, model, 'test');

    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.headers['anthropic-version']).toBeTruthy();
  });

  test('calls api.anthropic.com, not openai.com', async () => {
    mockFetchOk(okResponse);
    await callAnthropic(key, model, 'test');

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('anthropic.com');
    expect(url).not.toContain('openai.com');
  });

  test('extracts result from content[0].text', async () => {
    mockFetchOk(okResponse);
    const result = await callAnthropic(key, model, 'test');
    expect(result).toBe('Anthropic explanation');
  });

  test('throws "Empty response" when content array is empty', async () => {
    mockFetchOk({ content: [] });
    await expect(callAnthropic(key, model, 'test'))
      .rejects.toThrow('Empty response from provider');
  });

  test('throws "Empty response" when text field is missing', async () => {
    mockFetchOk({ content: [{ type: 'text' }] });
    await expect(callAnthropic(key, model, 'test'))
      .rejects.toThrow('Empty response from provider');
  });

  test('attaches status code to thrown error', async () => {
    mockFetchFail(429, 'Rate limit exceeded');
    const err = await callAnthropic(key, model, 'test').catch(e => e);
    expect(err.status).toBe(429);
  });
});

// ─── callGemini ───────────────────────────────────────────────────────────────

describe('callGemini', () => {
  const key   = 'AIzaTestKey';
  const model = 'gemini-1.5-flash';
  const okResponse = {
    candidates: [{ content: { parts: [{ text: 'Gemini explanation' }] } }]
  };

  test('puts API key in URL query param — NOT in any header', async () => {
    mockFetchOk(okResponse);
    await callGemini(key, model, 'test prompt');

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain(`key=${key}`);
    expect(opts.headers['Authorization']).toBeUndefined();
    expect(opts.headers['x-api-key']).toBeUndefined();
  });

  test('calls generativelanguage.googleapis.com', async () => {
    mockFetchOk(okResponse);
    await callGemini(key, model, 'test');

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('googleapis.com');
  });

  test('extracts result from candidates[0].content.parts[0].text', async () => {
    mockFetchOk(okResponse);
    const result = await callGemini(key, model, 'test');
    expect(result).toBe('Gemini explanation');
  });

  test('throws "Empty response" when candidates array is empty', async () => {
    mockFetchOk({ candidates: [] });
    await expect(callGemini(key, model, 'test'))
      .rejects.toThrow('Empty response from provider');
  });

  test('throws "Empty response" when parts array is empty', async () => {
    mockFetchOk({ candidates: [{ content: { parts: [] } }] });
    await expect(callGemini(key, model, 'test'))
      .rejects.toThrow('Empty response from provider');
  });

  test('attaches status code to thrown error', async () => {
    mockFetchFail(400, 'API key not valid');
    const err = await callGemini(key, model, 'test').catch(e => e);
    expect(err.status).toBe(400);
  });
});

// ─── callProvider dispatch ────────────────────────────────────────────────────

describe('callProvider: routing to correct API format', () => {
  test('openai → uses Authorization: Bearer (OpenAI format)', async () => {
    mockFetchOk({ choices: [{ message: { content: 'ok' } }] });
    await callProvider('openai', 'sk-key', 'text', 'simple', 'en');

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('openai.com');
    expect(opts.headers['Authorization']).toContain('Bearer');
  });

  test('groq → uses Authorization: Bearer (OpenAI-compatible), NOT x-api-key', async () => {
    mockFetchOk({ choices: [{ message: { content: 'ok' } }] });
    await callProvider('groq', 'gsk_key', 'text', 'simple', 'en');

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('groq.com');
    expect(opts.headers['Authorization']).toContain('Bearer');
    expect(opts.headers['x-api-key']).toBeUndefined();
  });

  test('anthropic → uses x-api-key header, NOT Authorization', async () => {
    mockFetchOk({ content: [{ text: 'ok' }] });
    await callProvider('anthropic', 'sk-ant-key', 'text', 'simple', 'en');

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('anthropic.com');
    expect(opts.headers['x-api-key']).toBeDefined();
    expect(opts.headers['Authorization']).toBeUndefined();
  });

  test('gemini → puts key in URL, NOT in any header', async () => {
    mockFetchOk({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] });
    await callProvider('gemini', 'AIzaKey', 'text', 'simple', 'en');

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('googleapis.com');
    expect(url).toContain('key=AIzaKey');
    expect(opts.headers['Authorization']).toBeUndefined();
  });

  test('unknown provider defaults to OpenAI format (does not throw)', async () => {
    mockFetchOk({ choices: [{ message: { content: 'ok' } }] });
    await expect(callProvider('unknown', 'sk-key', 'text', 'simple', 'en'))
      .resolves.toBe('ok');
  });
});

// ─── fetchExplanationWithResilience — retry behavior ─────────────────────────

describe('fetchExplanationWithResilience: retry logic', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  async function runWithTimers(promise) {
    // Flush pending promises and timers iteratively until settled
    let result;
    const settled = promise.then(r => { result = r; });
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
      jest.runAllTimers();
    }
    await settled;
    return result;
  }

  test('succeeds on first try — fetch called exactly once', async () => {
    mockFetchOk({ choices: [{ message: { content: 'ok' } }] });

    const result = await runWithTimers(
      fetchExplanationWithResilience('openai', 'sk-key', 'hello', 'simple', 'en')
    );

    expect(result.success).toBe(true);
    expect(result.result).toBe('ok');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('retries on 500 and succeeds on second attempt', async () => {
    mockFetchFail(500, 'Internal Server Error'); // attempt 1 fails
    mockFetchOk({ choices: [{ message: { content: 'Retry worked' } }] }); // attempt 2

    const result = await runWithTimers(
      fetchExplanationWithResilience('openai', 'sk-key', 'hello', 'simple', 'en')
    );

    expect(result.success).toBe(true);
    expect(result.result).toBe('Retry worked');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('retries on 429 rate limit', async () => {
    mockFetchFail(429, 'Rate limit exceeded'); // attempt 1 fails
    mockFetchOk({ choices: [{ message: { content: 'ok after rate limit' } }] });

    const result = await runWithTimers(
      fetchExplanationWithResilience('openai', 'sk-key', 'hello', 'simple', 'en')
    );

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('does NOT retry on 401 auth error — fetch called only once', async () => {
    mockFetchFail(401, 'Incorrect API key provided');

    const result = await runWithTimers(
      fetchExplanationWithResilience('openai', 'sk-bad', 'hello', 'simple', 'en')
    );

    expect(result.success).toBe(false);
    // 401 should not be retried — wastes time, won't fix itself
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('does NOT retry on 400 bad request', async () => {
    mockFetchFail(400, 'Invalid request body');

    const result = await runWithTimers(
      fetchExplanationWithResilience('openai', 'sk-key', 'hello', 'simple', 'en')
    );

    expect(result.success).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('returns { success: false, error } after all retries exhausted', async () => {
    // All attempts fail with network error
    global.fetch.mockRejectedValue(new Error('network error'));

    const result = await runWithTimers(
      fetchExplanationWithResilience('openai', 'sk-key', 'hello', 'simple', 'en')
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

// ─── buildPrompt ─────────────────────────────────────────────────────────────

describe('buildPrompt', () => {
  test('no {text} placeholder remains in output', () => {
    const prompt = buildPrompt('my specific text', 'simple', 'en');
    expect(prompt).not.toContain('{text}');
    expect(prompt).toContain('my specific text');
  });

  test('simple and expert tones produce different system instructions', () => {
    const simple = buildPrompt('test', 'simple', 'en');
    const expert = buildPrompt('test', 'expert', 'en');
    expect(simple).not.toBe(expert);
  });

  test('Russian language produces Russian-language prompt', () => {
    const prompt = buildPrompt('тест', 'simple', 'ru');
    expect(prompt).toContain('Текст:');
    expect(prompt).not.toContain('Text:');
  });
});
