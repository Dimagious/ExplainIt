/**
 * US-014: POST /explain Endpoint
 * TASK-058: Create /explain route
 * 
 * MVP: Free version without authentication
 * TODO: Add Stripe subscription + authentication later
 */

const express = require('express');
const router = express.Router();
const { validateExplainRequest } = require('../middleware/validate');
const { generateExplanation } = require('../services/openai');

/**
 * POST /api/v1/explain
 * 
 * Request body:
 * {
 *   text: string (3-2000 chars),
 *   tone: "simple" | "kid" | "expert",
 *   language: "en" | "ru"
 * }
 * 
 * Response:
 * {
 *   result: string
 * }
 */
router.post('/explain', validateExplainRequest, async (req, res, next) => {
  try {
    const { text, tone, language } = req.body;
    
    console.log(`[Explain] Request received: language=${language}, tone=${tone}, textLength=${text.length}`);
    
    // US-016: Call OpenAI service
    const startTime = Date.now();
    const explanation = await generateExplanation(text, tone, language);
    const duration = Date.now() - startTime;
    
    console.log(`[Explain] Generated in ${duration}ms`);
    
    // US-014: Return result
    res.status(200).json({
      result: explanation
    });
    
  } catch (error) {
    // US-020: Pass error to error handler middleware
    next(error);
  }
});

module.exports = router;
