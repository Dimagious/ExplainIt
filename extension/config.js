/**
 * ExplainIt! Configuration
 * Environment-based configuration for API endpoints and feature flags
 */

const CONFIG = {
  // Environment detection (development by default)
  ENV: (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest().version.includes('dev')) 
    ? 'development' 
    : 'production',
  
  // API Configuration
  API: {
    development: {
      BASE_URL: 'http://localhost:3000',
      EXPLAIN_ENDPOINT: '/api/v1/explain',
      MOCK_ENDPOINT: '/mock-explain',
      USE_MOCK: false, // Set to true to use mock endpoint
      TIMEOUT_MS: 30000,
      RETRY_ATTEMPTS: 2,
      RETRY_DELAY_MS: 1000
    },
    production: {
      BASE_URL: 'https://api.explainit.app', // TODO: Replace with actual production URL
      EXPLAIN_ENDPOINT: '/api/v1/explain',
      MOCK_ENDPOINT: '/mock-explain',
      USE_MOCK: false,
      TIMEOUT_MS: 30000,
      RETRY_ATTEMPTS: 3,
      RETRY_DELAY_MS: 2000
    }
  },
  
  // Text validation
  VALIDATION: {
    MIN_TEXT_LENGTH: 1,
    MAX_TEXT_LENGTH: 2000,
    ALLOWED_CHARS_REGEX: /^[\s\S]*$/, // Allow all characters by default
    STRIP_REGEX: /^\s+|\s+$/g // Strip leading/trailing whitespace
  },
  
  // Feature flags
  FEATURES: {
    INLINE_POPUP: true,
    FALLBACK_TO_MOCK: true, // Fallback to mock on 5xx/429
    CLIENT_VALIDATION: true,
    NETWORK_RESILIENCE: true
  },
  
  // Security
  SECURITY: {
    SANITIZE_OUTPUT: true, // Always sanitize user-generated content
    ESCAPE_HTML: true
  }
};

/**
 * Get current environment config
 */
function getConfig() {
  const env = CONFIG.ENV;
  return {
    ...CONFIG,
    api: CONFIG.API[env],
    getApiUrl: (useMock = false) => {
      const apiConfig = CONFIG.API[env];
      const endpoint = (useMock || apiConfig.USE_MOCK) 
        ? apiConfig.MOCK_ENDPOINT 
        : apiConfig.EXPLAIN_ENDPOINT;
      return apiConfig.BASE_URL + endpoint;
    }
  };
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
  
  // Strip whitespace
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
 * Escapes HTML special characters
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
 * @param {boolean} preserveFormatting - Use textContent (true) or innerHTML with escaped content (false)
 */
function safeSetContent(element, text, preserveFormatting = true) {
  if (!element || !text) return;
  
  if (preserveFormatting || !CONFIG.SECURITY.SANITIZE_OUTPUT) {
    // Use textContent for safety (no HTML interpretation)
    element.textContent = text;
  } else {
    // Use innerHTML with escaped content if needed
    element.innerHTML = escapeHtml(text);
  }
}

// Universal export for all contexts (Service Worker, Content Script, Popup)
// Use global object that works everywhere
const globalObj = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);

globalObj.ExplainItConfig = {
  CONFIG,
  getConfig,
  validateText,
  escapeHtml,
  safeSetContent
};

// For Service Worker specifically, also expose top-level functions
if (typeof importScripts !== 'undefined') {
  // We're in a Service Worker context
  globalObj.getConfig = getConfig;
  globalObj.validateText = validateText;
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    getConfig,
    validateText,
    escapeHtml,
    safeSetContent
  };
}

