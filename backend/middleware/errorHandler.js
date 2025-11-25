/**
 * US-020: Backend Error Handling
 * TASK-086: Create error handler middleware
 * TASK-087: Error response formatter
 */

/**
 * TASK-089: Map OpenAI errors to HTTP codes
 */
function mapOpenAIError(error) {
  if (error.status) {
    switch (error.status) {
      case 401:
        return {
          status: 500,
          code: 'OPENAI_AUTH_ERROR',
          message: 'AI service authentication failed'
        };
      case 429:
        return {
          status: 503,
          code: 'RATE_LIMIT_ERROR',
          message: 'Service temporarily busy, please try again in a moment'
        };
      case 500:
      case 502:
      case 503:
        return {
          status: 502,
          code: 'OPENAI_ERROR',
          message: 'AI service temporarily unavailable'
        };
      default:
        return {
          status: 500,
          code: 'OPENAI_ERROR',
          message: 'AI service error'
        };
    }
  }
  
  // Timeout errors
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    return {
      status: 504,
      code: 'GATEWAY_TIMEOUT',
      message: 'AI service took too long to respond'
    };
  }
  
  return null;
}

/**
 * TASK-090: Generate request ID for logging
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * TASK-086: Main error handler middleware
 * TASK-088: Error logging
 */
function errorHandler(err, req, res, next) {
  const requestId = generateRequestId();
  
  // US-020: Log full error details server-side
  console.error(`[Error ${requestId}]`, {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
    body: req.body
  });
  
  // Check if it's an OpenAI error
  const openAIError = mapOpenAIError(err);
  if (openAIError) {
    return res.status(openAIError.status).json({
      error: openAIError.message,
      code: openAIError.code,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
  
  // Validation errors (already handled by validate middleware, but just in case)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: err.message,
      code: 'VALIDATION_ERROR',
      requestId,
      timestamp: new Date().toISOString()
    });
  }
  
  // US-020: Generic 500 error (no stack trace to client)
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(status).json({
    error: message,
    code: 'INTERNAL_ERROR',
    requestId,
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
