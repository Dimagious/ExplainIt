/**
 * US-015: Request Validation
 * TASK-063: Create validation middleware using express-validator
 */

const { body, validationResult } = require('express-validator');

/**
 * TASK-064: Validation schema for /explain endpoint
 */
const explainValidationRules = [
  body('text')
    .exists().withMessage('text is required')
    .isString().withMessage('text must be a string')
    .trim()
    .isLength({ min: 3 }).withMessage('text must be at least 3 characters')
    .isLength({ max: 2000 }).withMessage('text must not exceed 2000 characters')
    .customSanitizer(value => {
      // TASK-066: Basic XSS sanitization - remove HTML tags
      return value.replace(/<[^>]*>/g, '');
    }),
  
  body('tone')
    .exists().withMessage('tone is required')
    .isIn(['simple', 'kid', 'expert']).withMessage('tone must be one of: simple, kid, expert'),
  
  body('language')
    .exists().withMessage('language is required')
    .isIn(['en', 'ru']).withMessage('language must be one of: en, ru')
];

/**
 * TASK-065: Validation middleware
 * TASK-067: Validation error formatter
 */
function validateExplainRequest(req, res, next) {
  // Run validation rules
  Promise.all(explainValidationRules.map(validation => validation.run(req)))
    .then(() => {
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        // US-015: Return 400 with validation errors
        const firstError = errors.array()[0];
        return res.status(400).json({
          error: firstError.msg,
          code: 'VALIDATION_ERROR',
          field: firstError.path,
          timestamp: new Date().toISOString()
        });
      }
      
      next();
    })
    .catch(next);
}

module.exports = {
  validateExplainRequest,
  explainValidationRules
};
