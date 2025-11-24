/**
 * Application constants
 */

module.exports = {
  // Validation
  TEXT_MIN_LENGTH: 3,
  TEXT_MAX_LENGTH: 2000,
  
  // Supported tones
  TONES: ['simple', 'kid', 'expert'],
  
  // Supported languages
  LANGUAGES: ['en', 'ru'],
  
  // OpenAI configuration
  OPENAI_MODEL: 'gpt-4o-mini',
  OPENAI_MAX_TOKENS: 500,
  OPENAI_TEMPERATURE: 0.7,
  OPENAI_TIMEOUT: 25000,
  
  // Error codes
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    OPENAI_ERROR: 'OPENAI_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR'
  }
};

