/**
 * ExplainIt! Configuration
 * Provider-based configuration for direct AI API access
 */

// AI Provider configurations
const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    label: 'GPT-4o mini',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    keyPrefix: 'sk-',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-...'
  },
  anthropic: {
    name: 'Anthropic',
    label: 'Claude Haiku',
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-haiku-20241022',
    keyPrefix: 'sk-ant-',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-...'
  },
  gemini: {
    name: 'Google Gemini',
    label: 'Gemini 1.5 Flash',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    model: 'gemini-1.5-flash',
    keyPrefix: 'AIza',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIza...'
  },
  groq: {
    name: 'Groq',
    label: 'Llama 3.3 70B',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    keyPrefix: 'gsk_',
    keyUrl: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_...'
  }
};

// Prompts for each tone and language (moved from backend/services/promptBuilder.js)
const PROMPTS = {
  simple: {
    en: 'Explain the following text in simple words that any adult can understand. Keep it concise (2-4 sentences). Do not use jargon.\n\nText:\n{text}',
    ru: 'Объясни следующий текст простыми словами, понятными любому взрослому человеку. Будь краток (2-4 предложения). Не используй жаргон.\n\nТекст:\n{text}'
  },
  kid: {
    en: "Explain the following text as if talking to a 5-year-old child. Use very simple words, short sentences, and a fun comparison if possible.\n\nText:\n{text}",
    ru: 'Объясни следующий текст так, как будто ты разговариваешь с 5-летним ребёнком. Используй очень простые слова, короткие предложения и интересное сравнение, если возможно.\n\nТекст:\n{text}'
  },
  expert: {
    en: 'Provide a precise, technical explanation of the following text for a professional audience. Use appropriate terminology and cover key nuances.\n\nText:\n{text}',
    ru: 'Предоставь точное техническое объяснение следующего текста для профессиональной аудитории. Используй соответствующую терминологию и раскрой ключевые нюансы.\n\nТекст:\n{text}'
  }
};

const CONFIG = {
  // Text validation
  VALIDATION: {
    MIN_TEXT_LENGTH: 1,
    MAX_TEXT_LENGTH: 2000,
    ALLOWED_CHARS_REGEX: /^[\s\S]*$/,
    STRIP_REGEX: /^\s+|\s+$/g
  },

  // Feature flags
  FEATURES: {
    INLINE_POPUP: true,
    CLIENT_VALIDATION: true
  },

  // Security
  SECURITY: {
    SANITIZE_OUTPUT: true,
    ESCAPE_HTML: true
  },

  // API settings
  API: {
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY_MS: 1000
  }
};

/**
 * Build prompt string from tone + language + text
 * @param {string} tone - 'simple' | 'kid' | 'expert'
 * @param {string} language - 'en' | 'ru'
 * @param {string} text - User-selected text
 * @returns {string} Prompt ready to send to AI
 */
function getPrompt(tone, language, text) {
  const tonePrompts = PROMPTS[tone] || PROMPTS.simple;
  const template = tonePrompts[language] || tonePrompts.en;
  return template.replace('{text}', text);
}

/**
 * Get provider config by ID
 * @param {string} providerId - Provider identifier
 * @returns {object} Provider configuration
 */
function getProvider(providerId) {
  return PROVIDERS[providerId] || PROVIDERS.openai;
}

/**
 * Validate text input
 * @param {string} text - Text to validate
 * @returns {{valid: boolean, error?: string, sanitized?: string}}
 */
function validateText(text) {
  if (!CONFIG.FEATURES.CLIENT_VALIDATION) {
    return { valid: true, sanitized: text };
  }

  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Text is required' };
  }

  const sanitized = text.replace(CONFIG.VALIDATION.STRIP_REGEX, '');

  if (sanitized.length < CONFIG.VALIDATION.MIN_TEXT_LENGTH) {
    return { valid: false, error: 'Text is too short' };
  }

  if (sanitized.length > CONFIG.VALIDATION.MAX_TEXT_LENGTH) {
    return {
      valid: false,
      error: `Text is too long (max ${CONFIG.VALIDATION.MAX_TEXT_LENGTH} characters)`
    };
  }

  return { valid: true, sanitized };
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function escapeHtml(text) {
  if (!text || typeof text !== 'string') return '';

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'/]/g, char => map[char]);
}

/**
 * Safely set text content (prevents XSS)
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text to set
 * @param {boolean} preserveFormatting - Use textContent (safe) or innerHTML with escaped content
 */
function safeSetContent(element, text, preserveFormatting = true) {
  if (!element || !text) return;

  if (preserveFormatting || !CONFIG.SECURITY.SANITIZE_OUTPUT) {
    element.textContent = text;
  } else {
    element.innerHTML = escapeHtml(text);
  }
}

// Universal export for all contexts (Service Worker, Content Script, Popup)
const globalObj = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);

globalObj.ExplainItConfig = {
  CONFIG,
  PROVIDERS,
  PROMPTS,
  getPrompt,
  getProvider,
  validateText,
  escapeHtml,
  safeSetContent
};

// For Service Worker: expose top-level globals after importScripts
if (typeof importScripts !== 'undefined') {
  globalObj.getPrompt = getPrompt;
  globalObj.getProvider = getProvider;
  globalObj.validateText = validateText;
  globalObj.PROVIDERS = PROVIDERS;
  globalObj.PROMPTS = PROMPTS;
  globalObj.CONFIG = CONFIG;
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    PROVIDERS,
    PROMPTS,
    getPrompt,
    getProvider,
    validateText,
    escapeHtml,
    safeSetContent
  };
}
