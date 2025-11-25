/**
 * Logger utility
 * Enhanced with sanitization support
 * 
 * SECURITY: Provides sanitization helpers for logging
 */

const { sanitizeRequestBody, sanitizeResponse, getLogLevel } = require('./sanitize');

const logger = {
  info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
  error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
  debug: (message, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  
  /**
   * Log request with sanitized body
   * @param {string} message - Log message
   * @param {object} req - Express request object
   */
  logRequest: (message, req) => {
    const logLevel = getLogLevel();
    const sanitized = sanitizeRequestBody(req.body, logLevel);
    
    console.log(`[INFO] ${message}`, {
      method: req.method,
      path: req.path,
      body: sanitized,
      ip: req.ip
    });
  },
  
  /**
   * Log response with sanitized data
   * @param {string} message - Log message
   * @param {object} data - Response data
   */
  logResponse: (message, data) => {
    const logLevel = getLogLevel();
    const sanitized = sanitizeResponse(data, logLevel);
    
    console.log(`[INFO] ${message}`, sanitized);
  }
};

module.exports = logger;

