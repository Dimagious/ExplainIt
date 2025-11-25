/**
 * US-016: OpenAI API Integration
 * TASK-068: Install openai SDK
 * TASK-069: Create OpenAI client wrapper
 */

const OpenAI = require('openai');
const { buildPrompt, getToneLabel, getLanguageLabel } = require('./promptBuilder');

// TASK-069: Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 25000, // TASK-071: 25 second timeout
});

/**
 * TASK-070: Implement API call logic
 * TASK-072: Add error mapping
 * TASK-073: Add usage tracking/logging
 * 
 * @param {string} text - The text to explain
 * @param {string} tone - "simple" | "kid" | "expert"
 * @param {string} language - "en" | "ru"
 * @returns {Promise<string>} - The explanation
 */
async function generateExplanation(text, tone, language) {
  const startTime = Date.now();
  
  try {
    // US-017/018/019: Build appropriate prompt
    const prompt = buildPrompt(text, tone, language);
    
    console.log(`[OpenAI] Calling API: ${getLanguageLabel(language)} / ${getToneLabel(tone)}`);
    
    // US-016: Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // US-016: Cost-effective model
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides clear explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500, // US-016: Enough for explanations
      temperature: 0.7, // US-016: Balanced creativity
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });
    
    const duration = Date.now() - startTime;
    const explanation = response.choices[0].message.content.trim();
    
    // TASK-073: Log usage and cost tracking
    const usage = response.usage;
    const estimatedCost = calculateCost(usage.prompt_tokens, usage.completion_tokens);
    
    console.log(`[OpenAI] Success in ${duration}ms:`, {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCost: `$${estimatedCost.toFixed(6)}`,
      explanationLength: explanation.length
    });
    
    return explanation;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // TASK-072: Map OpenAI errors to meaningful messages
    console.error(`[OpenAI] Error after ${duration}ms:`, {
      type: error.constructor.name,
      status: error.status,
      code: error.code,
      message: error.message
    });
    
    // US-016: Handle specific error types
    if (error.status === 401) {
      throw new Error('OpenAI API authentication failed');
    } else if (error.status === 429) {
      throw Object.assign(new Error('OpenAI rate limit exceeded'), { status: 429 });
    } else if (error.status >= 500) {
      throw Object.assign(new Error('OpenAI server error'), { status: error.status });
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw Object.assign(new Error('OpenAI request timeout'), { code: 'ETIMEDOUT' });
    }
    
    // Generic error
    throw error;
  }
}

/**
 * TASK-073: Calculate estimated cost
 * gpt-4o-mini pricing (as of 2024):
 * - Input: $0.150 / 1M tokens
 * - Output: $0.600 / 1M tokens
 * 
 * @param {number} promptTokens
 * @param {number} completionTokens
 * @returns {number} - Cost in USD
 */
function calculateCost(promptTokens, completionTokens) {
  const inputCost = (promptTokens / 1000000) * 0.150;
  const outputCost = (completionTokens / 1000000) * 0.600;
  return inputCost + outputCost;
}

/**
 * Health check for OpenAI service
 * @returns {Promise<boolean>}
 */
async function checkOpenAIHealth() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5
    });
    return !!response.choices[0];
  } catch (error) {
    console.error('[OpenAI] Health check failed:', error.message);
    return false;
  }
}

module.exports = {
  generateExplanation,
  checkOpenAIHealth,
  calculateCost
};
