/**
 * Data Sanitization Utilities
 * SECURITY: Prevents logging of sensitive user data
 * 
 * Masks or hashes user-generated content in logs
 */

const crypto = require('crypto');

/**
 * Hash text for audit trail without exposing content
 * @param {string} text - Text to hash
 * @returns {string} SHA-256 hash
 */
function hashText(text) {
  if (!text || typeof text !== 'string') return 'invalid';
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
}

/**
 * Truncate and mask text for logging
 * Shows only first/last few characters
 * @param {string} text - Text to mask
 * @param {number} visibleChars - Number of chars to show at start/end
 * @returns {string} Masked text
 */
function maskText(text, visibleChars = 10) {
  if (!text || typeof text !== 'string') return '[empty]';
  
  const length = text.length;
  
  if (length <= visibleChars * 2) {
    return `[${length} chars]`;
  }
  
  const start = text.substring(0, visibleChars);
  const end = text.substring(length - visibleChars);
  const maskedLength = length - (visibleChars * 2);
  
  return `${start}...[${maskedLength} chars]...${end}`;
}

/**
 * Sanitize request body for logging
 * SECURITY: Removes or masks sensitive data
 * 
 * @param {object} body - Request body
 * @param {string} logLevel - 'minimal', 'metadata', 'full' (dev only)
 * @returns {object} Sanitized body
 */
function sanitizeRequestBody(body, logLevel = 'metadata') {
  if (!body || typeof body !== 'object') {
    return {};
  }
  
  const sanitized = {};
  
  // Always include metadata
  if (body.language) sanitized.language = body.language;
  if (body.tone) sanitized.tone = body.tone;
  
  // Handle text based on log level
  if (body.text) {
    switch (logLevel) {
      case 'minimal':
        // Only metadata
        sanitized.textLength = body.text.length;
        sanitized.textHash = hashText(body.text);
        break;
      
      case 'metadata':
        // Metadata + masked preview
        sanitized.textLength = body.text.length;
        sanitized.textHash = hashText(body.text);
        sanitized.textPreview = maskText(body.text, 15);
        break;
      
      case 'full':
        // Full text (development only!)
        if (process.env.NODE_ENV === 'development') {
          sanitized.text = body.text;
          sanitized.textLength = body.text.length;
        } else {
          // Fallback to metadata in production
          sanitized.textLength = body.text.length;
          sanitized.textHash = hashText(body.text);
          sanitized.textPreview = maskText(body.text, 15);
        }
        break;
      
      default:
        sanitized.textLength = body.text.length;
        sanitized.textHash = hashText(body.text);
    }
  }
  
  return sanitized;
}

/**
 * Sanitize response for logging
 * @param {object} response - Response data
 * @param {string} logLevel - Log level
 * @returns {object} Sanitized response
 */
function sanitizeResponse(response, logLevel = 'metadata') {
  if (!response || typeof response !== 'object') {
    return {};
  }
  
  const sanitized = {};
  
  // Include metadata
  if (response.model) sanitized.model = response.model;
  if (response.usage) sanitized.usage = response.usage;
  if (response.cost) sanitized.cost = response.cost;
  
  // Handle result based on log level
  if (response.result) {
    switch (logLevel) {
      case 'minimal':
        sanitized.resultLength = response.result.length;
        sanitized.resultHash = hashText(response.result);
        break;
      
      case 'metadata':
        sanitized.resultLength = response.result.length;
        sanitized.resultHash = hashText(response.result);
        sanitized.resultPreview = maskText(response.result, 20);
        break;
      
      case 'full':
        if (process.env.NODE_ENV === 'development') {
          sanitized.result = response.result;
        } else {
          sanitized.resultLength = response.result.length;
          sanitized.resultPreview = maskText(response.result, 20);
        }
        break;
      
      default:
        sanitized.resultLength = response.result.length;
    }
  }
  
  return sanitized;
}

/**
 * Get log level from environment
 * @returns {string} Log level
 */
function getLogLevel() {
  const level = process.env.LOG_LEVEL || 'metadata';
  const validLevels = ['minimal', 'metadata', 'full'];
  
  if (!validLevels.includes(level)) {
    console.warn(`[Sanitize] Invalid LOG_LEVEL: ${level}, using 'metadata'`);
    return 'metadata';
  }
  
  // Never allow 'full' in production
  if (level === 'full' && process.env.NODE_ENV === 'production') {
    console.warn('[Sanitize] LOG_LEVEL=full not allowed in production, using metadata');
    return 'metadata';
  }
  
  return level;
}

module.exports = {
  hashText,
  maskText,
  sanitizeRequestBody,
  sanitizeResponse,
  getLogLevel
};

