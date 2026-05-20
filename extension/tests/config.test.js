/**
 * Tests for config.js — pure functions, no API keys needed.
 *
 * Real bugs these tests would catch:
 *  - getPrompt doesn't replace {text} → every prompt would contain the literal string
 *  - Wrong language returns wrong-language template (Russian prompt for English user)
 *  - validateText accepts texts over 2000 chars → request should be rejected
 *  - validateText doesn't strip whitespace → " " passes as valid text
 *  - escapeHtml misses an HTML entity → XSS vulnerability in the UI
 *  - PROVIDERS config points to wrong URL → all calls for that provider fail
 */

const {
  getPrompt,
  validateText,
  escapeHtml,
  PROVIDERS,
  PROMPTS,
  META_PROMPTS,
  LANGUAGE_NAMES
} = require('../config.js');

// ─── getPrompt ────────────────────────────────────────────────────────────────

describe('getPrompt', () => {
  test('replaces {text} placeholder — no literal {text} in output', () => {
    const prompt = getPrompt('simple', 'en', 'quantum physics');
    expect(prompt).not.toContain('{text}');
    expect(prompt).toContain('quantum physics');
  });

  test('all tone+language combos replace the placeholder', () => {
    const tones = ['simple', 'kid', 'expert'];
    const langs = ['en', 'ru'];
    const userText = 'some unique test phrase 42';

    for (const tone of tones) {
      for (const lang of langs) {
        const prompt = getPrompt(tone, lang, userText);
        expect(prompt).not.toContain('{text}');
        expect(prompt).toContain(userText);
      }
    }
  });

  test('different tones produce different prompts', () => {
    const simple = getPrompt('simple', 'en', 'test');
    const kid    = getPrompt('kid',    'en', 'test');
    const expert = getPrompt('expert', 'en', 'test');

    expect(simple).not.toBe(kid);
    expect(simple).not.toBe(expert);
    expect(kid).not.toBe(expert);
  });

  test('Russian language uses Russian-language template (contains Cyrillic)', () => {
    const prompt = getPrompt('simple', 'ru', 'тест');
    // Russian prompts use Cyrillic header like "Текст:"
    expect(prompt).toContain('Текст:');
    // Must NOT contain the English header
    expect(prompt).not.toContain('Text:');
  });

  test('English language uses English template', () => {
    const prompt = getPrompt('simple', 'en', 'test');
    expect(prompt).toContain('Text:');
    expect(prompt).not.toContain('Текст:');
  });

  test('unknown tone falls back to simple — does not throw, includes text', () => {
    expect(() => getPrompt('genius', 'en', 'test')).not.toThrow();
    const prompt = getPrompt('genius', 'en', 'test');
    expect(prompt).toContain('test');
  });

  test('languages without a native template go through the meta-prompt path with target-language steer', () => {
    expect(() => getPrompt('simple', 'fr', 'test')).not.toThrow();
    const prompt = getPrompt('simple', 'fr', 'test');
    // Meta-prompt instruction is in English ("Text:")
    expect(prompt).toContain('Text:');
    // Critically, it must name the target language so the LLM actually answers in French.
    expect(prompt).toContain('French');
    expect(prompt).toContain('Output ONLY in French');
  });

  test('completely unknown language code falls back to English target', () => {
    const prompt = getPrompt('simple', 'xx-fake', 'test');
    // Should use LANGUAGE_NAMES.en = 'English' as the steer
    expect(prompt).toContain('English');
    expect(prompt).not.toContain('xx-fake');
  });

  test('text with HTML special characters is NOT escaped in the prompt', () => {
    // The prompt is sent directly to AI — the AI should see the raw text, not &lt; etc.
    const rawText = '<script>alert("xss")</script>';
    const prompt = getPrompt('simple', 'en', rawText);
    expect(prompt).toContain(rawText);
    expect(prompt).not.toContain('&lt;');
  });

  test('kid tone en prompt mentions child-appropriate explanation style', () => {
    const prompt = getPrompt('kid', 'en', 'gravity');
    const lower = prompt.toLowerCase();
    // Must reference young age / simple style
    expect(lower).toMatch(/5.year|child|simple/);
  });

  test('expert tone en prompt targets professional audience', () => {
    const prompt = getPrompt('expert', 'en', 'gravity');
    const lower = prompt.toLowerCase();
    expect(lower).toMatch(/professional|technical|expert/);
  });
});

// ─── validateText ─────────────────────────────────────────────────────────────

describe('validateText', () => {
  test('rejects empty string', () => {
    const result = validateText('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('rejects null and undefined', () => {
    expect(validateText(null).valid).toBe(false);
    expect(validateText(undefined).valid).toBe(false);
  });

  test('rejects non-string types', () => {
    expect(validateText(42).valid).toBe(false);
    expect(validateText(true).valid).toBe(false);
    expect(validateText([]).valid).toBe(false);
  });

  test('rejects whitespace-only string after stripping', () => {
    expect(validateText('   ').valid).toBe(false);
    expect(validateText('\t\n').valid).toBe(false);
  });

  test('strips leading and trailing whitespace from result', () => {
    const result = validateText('  hello world  ');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('hello world');
  });

  test('accepts exactly 2000 characters', () => {
    const result = validateText('a'.repeat(2000));
    expect(result.valid).toBe(true);
  });

  test('rejects 2001 characters — boundary condition', () => {
    const result = validateText('a'.repeat(2001));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('2000');
  });

  test('returns sanitized text in the result', () => {
    const result = validateText('hello');
    expect(result.sanitized).toBe('hello');
  });

  test('accepts multilingual text (Russian, Chinese, emoji)', () => {
    expect(validateText('Привет мир').valid).toBe(true);
    expect(validateText('你好世界').valid).toBe(true);
    expect(validateText('Hello 👋').valid).toBe(true);
  });
});

// ─── escapeHtml ───────────────────────────────────────────────────────────────

describe('escapeHtml', () => {
  test('escapes < and > to prevent tag injection', () => {
    const result = escapeHtml('<b>bold</b>');
    expect(result).not.toContain('<b>');
    expect(result).toContain('&lt;b&gt;');
  });

  test('escapes script tag', () => {
    const result = escapeHtml('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  test('escapes double quotes', () => {
    expect(escapeHtml('"quoted"')).toContain('&quot;');
  });

  test('escapes single quotes', () => {
    expect(escapeHtml("it's")).toContain('&#039;');
  });

  test('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toContain('&amp;');
  });

  test('returns empty string for null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  test('returns empty string for undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  test('does not double-escape already-safe text', () => {
    const safe = 'Hello World 123';
    expect(escapeHtml(safe)).toBe(safe);
  });
});

// ─── PROVIDERS config integrity ───────────────────────────────────────────────

describe('PROVIDERS config', () => {
  const providerIds = ['openai', 'anthropic', 'gemini', 'groq'];

  test.each(providerIds)('%s has all required fields', (id) => {
    const p = PROVIDERS[id];
    expect(p.name).toBeTruthy();
    expect(p.label).toBeTruthy();
    expect(p.url).toMatch(/^https:\/\//);
    expect(p.model).toBeTruthy();
    expect(p.keyUrl).toMatch(/^https:\/\//);
    expect(p.keyPlaceholder).toBeTruthy();
  });

  test('OpenAI URL points to chat/completions endpoint', () => {
    expect(PROVIDERS.openai.url).toBe('https://api.openai.com/v1/chat/completions');
  });

  test('Anthropic URL points to messages endpoint', () => {
    expect(PROVIDERS.anthropic.url).toBe('https://api.anthropic.com/v1/messages');
  });

  test('Gemini base URL does NOT include the API key', () => {
    // Key is added dynamically as a query param — must not be in the base URL
    expect(PROVIDERS.gemini.url).not.toContain('key=');
  });

  test('Groq URL is on api.groq.com', () => {
    expect(PROVIDERS.groq.url).toContain('api.groq.com');
  });

  test('each provider has a distinct URL', () => {
    const urls = providerIds.map(id => PROVIDERS[id].url);
    const unique = new Set(urls);
    expect(unique.size).toBe(providerIds.length);
  });

  test('each provider has a distinct model', () => {
    const models = providerIds.map(id => PROVIDERS[id].model);
    const unique = new Set(models);
    expect(unique.size).toBe(providerIds.length);
  });
});

// ─── PROMPTS completeness ─────────────────────────────────────────────────────

describe('PROMPTS completeness', () => {
  const tones = ['simple', 'kid', 'expert'];
  const langs = ['en', 'ru'];

  test.each(tones)('tone "%s" has both en and ru templates', (tone) => {
    expect(PROMPTS[tone]).toBeDefined();
    expect(typeof PROMPTS[tone].en).toBe('string');
    expect(typeof PROMPTS[tone].ru).toBe('string');
    expect(PROMPTS[tone].en.length).toBeGreaterThan(10);
    expect(PROMPTS[tone].ru.length).toBeGreaterThan(10);
  });

  test.each(tones)('tone "%s" templates contain the {text} placeholder', (tone) => {
    expect(PROMPTS[tone].en).toContain('{text}');
    expect(PROMPTS[tone].ru).toContain('{text}');
  });

  test('Russian and English templates for same tone are different', () => {
    for (const tone of tones) {
      expect(PROMPTS[tone].en).not.toBe(PROMPTS[tone].ru);
    }
  });
});

// ─── Multi-language support (META_PROMPTS + LANGUAGE_NAMES) ──────────────────

describe('META_PROMPTS + LANGUAGE_NAMES', () => {
  const supportedLangs = [
    'en', 'ru',                                // native templates
    'es', 'zh', 'hi', 'ar', 'pt', 'de',        // meta-prompt path
    'fr', 'ja', 'ko', 'tr', 'vi'
  ];
  const tones = ['simple', 'kid', 'expert'];

  test('every supported language has a LANGUAGE_NAMES entry', () => {
    for (const lang of supportedLangs) {
      expect(LANGUAGE_NAMES[lang]).toBeTruthy();
      expect(typeof LANGUAGE_NAMES[lang]).toBe('string');
    }
  });

  test('every tone has a META_PROMPTS template with placeholders', () => {
    for (const tone of tones) {
      expect(META_PROMPTS[tone]).toBeTruthy();
      expect(META_PROMPTS[tone]).toContain('{LANGUAGE}');
      expect(META_PROMPTS[tone]).toContain('{text}');
    }
  });

  test('every supported language produces a non-empty prompt for every tone', () => {
    const userText = 'token-from-test';
    for (const lang of supportedLangs) {
      for (const tone of tones) {
        const prompt = getPrompt(tone, lang, userText);
        expect(prompt.length).toBeGreaterThan(20);
        expect(prompt).toContain(userText);
        expect(prompt).not.toContain('{text}');
        expect(prompt).not.toContain('{LANGUAGE}');
      }
    }
  });

  test('non-native languages reach the meta-prompt path and name the target language', () => {
    const cases = [
      ['es', 'Spanish'],
      ['zh', 'Chinese (Simplified)'],
      ['hi', 'Hindi'],
      ['ar', 'Arabic'],
      ['pt', 'Portuguese'],
      ['de', 'German'],
      ['fr', 'French'],
      ['ja', 'Japanese'],
      ['ko', 'Korean'],
      ['tr', 'Turkish'],
      ['vi', 'Vietnamese']
    ];
    for (const [code, name] of cases) {
      const prompt = getPrompt('simple', code, 'sample');
      expect(prompt).toContain(`Output ONLY in ${name}`);
    }
  });

  test('native EN/RU paths are NOT affected by the meta-prompt change', () => {
    // EN native template doesn't contain the meta-prompt's "Output ONLY in" steer
    expect(getPrompt('simple', 'en', 'x')).not.toContain('Output ONLY in');
    // RU native template still uses Cyrillic header
    expect(getPrompt('simple', 'ru', 'x')).toContain('Текст:');
  });
});
