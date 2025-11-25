/**
 * Mock endpoint for testing without OpenAI quota
 * For development/testing purposes only
 */

const express = require('express');
const router = express.Router();
const { validateExplainRequest } = require('../middleware/validate');

/**
 * POST /api/v1/mock-explain
 * Same as /explain but returns mock data without calling OpenAI
 */
router.post('/mock-explain', validateExplainRequest, async (req, res) => {
  const { text, tone, language } = req.body;
  
  console.log(`[Mock] Request: language=${language}, tone=${tone}, textLength=${text.length}`);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate mock explanation based on tone
  let explanation;
  
  if (tone === 'simple') {
    explanation = language === 'en'
      ? `This is a simple explanation of: "${text.substring(0, 50)}..."\n\nIn simple terms, this concept means that things are connected in a special way. It's like when two things are linked together and what happens to one affects the other, even if they're far apart.`
      : `Это простое объяснение для: "${text.substring(0, 50)}..."\n\nПростыми словами, эта концепция означает, что вещи связаны особым образом. Это как когда две вещи соединены вместе, и то, что происходит с одной, влияет на другую, даже если они находятся далеко друг от друга.`;
  } else if (tone === 'kid') {
    explanation = language === 'en'
      ? `Hey! Let me explain "${text.substring(0, 50)}..." like you're 5 years old!\n\nImagine you have two magic toys. When you play with one toy, the other toy does the same thing at the same time, even if it's in another room! That's kind of like what this is about.`
      : `Привет! Давай я объясню "${text.substring(0, 50)}..." как будто тебе 5 лет!\n\nПредставь, что у тебя есть две волшебные игрушки. Когда ты играешь с одной, другая делает то же самое в то же время, даже если она в другой комнате! Вот примерно об этом и речь.`;
  } else { // expert
    explanation = language === 'en'
      ? `Technical explanation of: "${text.substring(0, 50)}..."\n\nThis describes a quantum mechanical phenomenon characterized by non-local correlations between entangled particles. The quantum state exhibits properties that cannot be explained by classical local hidden variable theories, as demonstrated by violations of Bell inequalities.`
      : `Техническое объяснение: "${text.substring(0, 50)}..."\n\nЭто описывает квантово-механическое явление, характеризующееся нелокальными корреляциями между запутанными частицами. Квантовое состояние демонстрирует свойства, которые не могут быть объяснены классическими теориями со скрытыми переменными, что подтверждается нарушениями неравенств Белла.`;
  }
  
  console.log(`[Mock] Generated ${explanation.length} chars in 500ms`);
  
  res.status(200).json({
    result: explanation,
    _mock: true,
    _info: 'This is mock data for testing. Use /explain for real OpenAI responses.'
  });
});

module.exports = router;

