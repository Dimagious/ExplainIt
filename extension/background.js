/**
 * Background Service Worker for ExplainIt!
 * Multi-provider direct API calls: OpenAI, Anthropic, Google Gemini, Groq
 * No backend server required — calls AI providers directly using user's API key.
 */

// ─── Provider configs (inline to keep service worker self-contained) ──────────

const PROVIDER_CONFIGS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    type: 'openai'
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-haiku-20241022',
    type: 'anthropic'
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    model: 'gemini-1.5-flash',
    type: 'gemini'
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    type: 'openai' // OpenAI-compatible
  }
};

// ─── Prompt templates (inline, mirrors config.js PROMPTS) ────────────────────

const PROMPTS = {
  simple: {
    en: 'Explain the following text in simple words that any adult can understand. Keep it concise (2-4 sentences). Do not use jargon.\n\nText:\n{text}',
    ru: 'Объясни следующий текст простыми словами, понятными любому взрослому человеку. Будь краток (2-4 предложения). Не используй жаргон.\n\nТекст:\n{text}'
  },
  kid: {
    en: "Explain the following text as if talking to a 5-year-old child. Use very simple words, short sentences, and a fun comparison if possible.\n\nText:\n{text}",
    ru: 'Объясни следующий текст так, как будто ты разговариваешь с 5-летним ребёнком. Используй очень простые слова, короткие предложения и интересное сравнение, если возможно.\n\nТекст:\n{text}'
  },
  expert: {
    en: 'Provide a precise, technical explanation of the following text for a professional audience. Use appropriate terminology and cover key nuances.\n\nText:\n{text}',
    ru: 'Предоставь точное техническое объяснение следующего текста для профессиональной аудитории. Используй соответствующую терминологию и раскрой ключевые нюансы.\n\nТекст:\n{text}'
  }
};

const TIMEOUT_MS = 30000;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;

// ─── Text storage (tabId → { text, timestamp }) ───────────────────────────────

const textStorage = new Map();

// ─── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildPrompt(text, tone, language) {
  const tonePrompts = PROMPTS[tone] || PROMPTS.simple;
  const template = tonePrompts[language] || tonePrompts.en;
  return template.replace('{text}', text);
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

// ─── Provider-specific API callers ───────────────────────────────────────────

/**
 * OpenAI-compatible call (used by OpenAI and Groq)
 */
async function callOpenAICompatible(url, apiKey, model, prompt) {
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const result = data.choices?.[0]?.message?.content;
  if (!result) throw new Error('Empty response from provider');
  return result;
}

/**
 * Anthropic Messages API
 */
async function callAnthropic(apiKey, model, prompt) {
  const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const result = data.content?.[0]?.text;
  if (!result) throw new Error('Empty response from provider');
  return result;
}

/**
 * Google Gemini API
 */
async function callGemini(apiKey, model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!result) throw new Error('Empty response from provider');
  return result;
}

/**
 * Dispatch to the correct provider caller
 */
async function callProvider(providerId, apiKey, text, tone, language) {
  const providerCfg = PROVIDER_CONFIGS[providerId] || PROVIDER_CONFIGS.openai;
  const prompt = buildPrompt(text, tone, language);

  switch (providerCfg.type) {
    case 'anthropic':
      return callAnthropic(apiKey, providerCfg.model, prompt);
    case 'gemini':
      return callGemini(apiKey, providerCfg.model, prompt);
    default: // 'openai' — also handles groq
      return callOpenAICompatible(providerCfg.url, apiKey, providerCfg.model, prompt);
  }
}

// ─── Resilience wrapper (retry with exponential backoff) ─────────────────────

async function fetchExplanationWithResilience(providerId, apiKey, text, tone, language) {
  let lastError = null;

  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`[Background] Attempt ${attempt + 1}/${RETRY_ATTEMPTS + 1} — provider: ${providerId}`);

      const result = await callProvider(providerId, apiKey, text, tone, language);
      console.log('[Background] Explanation received successfully');
      return { success: true, result };

    } catch (error) {
      console.error(`[Background] Attempt ${attempt + 1} failed:`, error.message);
      lastError = error;

      const isRetryable =
        error.message.includes('timeout') ||
        error.message.includes('network') ||
        error.message.includes('fetch') ||
        error.message.includes('500') ||
        error.message.includes('429');

      if (isRetryable && attempt < RETRY_ATTEMPTS) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.log(`[Background] Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Failed to fetch explanation'
  };
}

// ─── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message.type, 'from tab:', sender.tab?.id);

  // Store selected text from content script
  if (message.type === 'SELECTED_TEXT') {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ success: false, error: 'No tab ID' });
      return true;
    }
    textStorage.set(tabId, {
      text: message.text,
      timestamp: Date.now(),
      url: sender.tab.url
    });
    console.log('[Background] Stored text for tab', tabId, ':', message.text.substring(0, 50) + '...');
    sendResponse({ success: true });
    return true;
  }

  // Fetch explanation using the user's selected provider and API key
  if (message.type === 'FETCH_EXPLANATION') {
    const { text, tone, language } = message;

    chrome.storage.local.get(['provider', 'apiKeys'], (stored) => {
      const providerId = stored.provider || 'openai';
      const apiKeys = stored.apiKeys || {};
      const apiKey = apiKeys[providerId] || '';

      if (!apiKey) {
        sendResponse({
          success: false,
          error: 'No API key configured. Open Settings and add your API key.'
        });
        return;
      }

      fetchExplanationWithResilience(providerId, apiKey, text, tone, language)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
    });

    return true; // Keep channel open for async response
  }

  // Return stored text to popup
  if (message.type === 'GET_SELECTED_TEXT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0]?.id;
      if (!activeTabId) {
        sendResponse({ success: false, error: 'No active tab' });
        return;
      }

      const stored = textStorage.get(activeTabId);
      if (stored) {
        console.log('[Background] Returning stored text for tab', activeTabId);
        sendResponse({ success: true, text: stored.text, timestamp: stored.timestamp });
        textStorage.delete(activeTabId);
      } else {
        console.log('[Background] No stored text for tab', activeTabId);
        sendResponse({ success: false, error: 'No text stored' });
      }
    });

    return true;
  }

  return false;
});

// ─── Cleanup stored text older than 5 minutes ─────────────────────────────────

setInterval(() => {
  const now = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000;
  for (const [tabId, data] of textStorage.entries()) {
    if (now - data.timestamp > FIVE_MINUTES) {
      console.log('[Background] Cleaning up old text for tab', tabId);
      textStorage.delete(tabId);
    }
  }
}, 60000);

console.log('[Background] ExplainIt! service worker initialized (multi-provider mode)');
