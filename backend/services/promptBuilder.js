/**
 * US-017/018/019: Prompt Engineering
 * TASK-074-085: Create prompts for all tones and languages
 */

/**
 * Prompt templates for different tones and languages
 * US-017: Simple tone
 * US-018: Kid-friendly tone
 * US-019: Expert tone
 */
const PROMPTS = {
  // US-017: Simple tone prompts
  simple: {
    en: `Explain the following text in simple words that any adult can understand. Keep it concise (2-4 sentences). Avoid jargon and technical terms.

Text: {text}`,
    
    ru: `Объясни следующий текст простыми словами, понятными любому взрослому человеку. Будь краток (2-4 предложения). Избегай жаргона и сложных терминов.

Текст: {text}`
  },
  
  // US-018: Kid-friendly tone prompts
  kid: {
    en: `Explain the following text as if you're talking to a 5-year-old child. Use very simple words and short sentences. You can use analogies or examples that a child would understand.

Text: {text}`,
    
    ru: `Объясни следующий текст так, как будто ты разговариваешь с 5-летним ребёнком. Используй очень простые слова и короткие предложения. Можешь использовать аналогии или примеры, понятные ребёнку.

Текст: {text}`
  },
  
  // US-019: Expert tone prompts
  expert: {
    en: `Provide a precise, technical explanation of the following text for a professional or expert in the field. Be accurate and avoid oversimplification. Use appropriate terminology.

Text: {text}`,
    
    ru: `Предоставь точное, техническое объяснение следующего текста для профессионала или эксперта в области. Будь точным и избегай излишних упрощений. Используй соответствующую терминологию.

Текст: {text}`
  }
};

/**
 * TASK-076: Build prompt based on tone and language
 * @param {string} text - The text to explain
 * @param {string} tone - "simple" | "kid" | "expert"
 * @param {string} language - "en" | "ru"
 * @returns {string} - The formatted prompt for OpenAI
 */
function buildPrompt(text, tone, language) {
  // Get the appropriate template
  const template = PROMPTS[tone]?.[language];
  
  if (!template) {
    throw new Error(`Invalid tone (${tone}) or language (${language})`);
  }
  
  // Replace {text} placeholder with actual text
  const prompt = template.replace('{text}', text);
  
  console.log(`[PromptBuilder] Built ${language}/${tone} prompt for ${text.length} chars`);
  
  return prompt;
}

/**
 * Get tone label for logging
 */
function getToneLabel(tone) {
  const labels = {
    simple: 'Simple words',
    kid: 'Kid-friendly',
    expert: 'Expert level'
  };
  return labels[tone] || tone;
}

/**
 * Get language label for logging
 */
function getLanguageLabel(language) {
  const labels = {
    en: 'English',
    ru: 'Russian'
  };
  return labels[language] || language;
}

module.exports = {
  buildPrompt,
  getToneLabel,
  getLanguageLabel,
  PROMPTS // Export for testing
};
