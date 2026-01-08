/**
 * Background Service Worker for ExplainIt!
 * US-022: Content Script → Popup Communication
 * TASK-097: Background message listener
 * TASK-098: Text storage by tabId
 * 
 * REFACTORED: Network resilience (timeout, retry, fallback)
 * SECURITY: Uses config for API URLs
 */

// Inline config for Service Worker (MVP - no external dependencies)
// Detect environment from manifest version
const isDev = typeof chrome !== 'undefined' && chrome.runtime && 
              chrome.runtime.getManifest().version.includes('dev');

const config = {
  ENV: isDev ? 'development' : 'production',
  api: isDev ? {
    BASE_URL: 'http://localhost:3000',
    EXPLAIN_ENDPOINT: '/api/v1/explain',
    MOCK_ENDPOINT: '/api/v1/mock-explain',
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY_MS: 1000
  } : {
    BASE_URL: 'https://dy-budget-helper.ru/explainit',
    EXPLAIN_ENDPOINT: '/api/v1/explain',
    MOCK_ENDPOINT: '/api/v1/mock-explain',
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 2000
  },
  FEATURES: {
    FALLBACK_TO_MOCK: true,
    NETWORK_RESILIENCE: true
  },
  getApiUrl: function(useMock) {
    return this.api.BASE_URL + (useMock ? this.api.MOCK_ENDPOINT : this.api.EXPLAIN_ENDPOINT);
  }
};

console.log('[Background] ExplainIt! Background service worker initialized');
console.log('[Background] Environment:', config.ENV);
console.log('[Background] API URL:', config.getApiUrl());

// TASK-098: Store selected text per tab
const textStorage = new Map(); // tabId -> { text, timestamp }

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const signal = controller.signal;
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Sleep utility for retry delay
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch explanation with retry and fallback logic
 * NETWORK RESILIENCE: timeout, retry with exponential backoff, fallback to mock
 * 
 * @param {string} text - Text to explain
 * @param {string} tone - Tone setting
 * @param {string} language - Language setting
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<object>} Response with {success, result?, error?}
 */
async function fetchExplanationWithResilience(text, tone, language, retryCount = 0) {
  const maxRetries = config.api.RETRY_ATTEMPTS;
  const timeout = config.api.TIMEOUT_MS;
  const baseDelay = config.api.RETRY_DELAY_MS;
  
  let lastError = null;
  
  // Try main API with retries
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Background] Attempt ${attempt + 1}/${maxRetries + 1} - Fetching explanation`);
      
      const apiUrl = config.getApiUrl(false); // Use real API
      
      const response = await fetchWithTimeout(
        apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ text, tone, language })
        },
        timeout
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `HTTP ${response.status}`;
        
        // Check if we should retry
        const shouldRetry = response.status >= 500 || response.status === 429;
        
        if (shouldRetry && attempt < maxRetries) {
          console.warn(`[Background] Retryable error (${response.status}), will retry...`);
          lastError = new Error(errorMsg);
          
          // Exponential backoff
          const delay = baseDelay * Math.pow(2, attempt);
          await sleep(delay);
          continue; // Retry
        }
        
        // Non-retryable error or max retries reached
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      
      if (!data.result) {
        throw new Error('Empty response from server');
      }
      
      console.log('[Background] Successfully got explanation');
      return { success: true, result: data.result };
      
    } catch (error) {
      console.error(`[Background] Attempt ${attempt + 1} failed:`, error.message);
      lastError = error;
      
      // Check if we should retry
      const isNetworkError = error.message.includes('timeout') || 
                            error.message.includes('network') ||
                            error.message.includes('fetch');
      
      if (isNetworkError && attempt < maxRetries) {
        console.log('[Background] Network error, will retry...');
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
        continue; // Retry
      }
      
      // Don't retry on last attempt
      if (attempt >= maxRetries) {
        break;
      }
    }
  }
  
  // All retries failed - try fallback to mock if enabled
  if (config.FEATURES.FALLBACK_TO_MOCK) {
    console.log('[Background] All retries failed, trying mock fallback...');
    
    try {
      const mockUrl = config.getApiUrl(true); // Use mock API
      
      const response = await fetchWithTimeout(
        mockUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ text, tone, language })
        },
        timeout
      );
      
      if (!response.ok) {
        throw new Error(`Mock API failed: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('[Background] Mock fallback successful');
      return { 
        success: true, 
        result: data.result,
        isMock: true 
      };
      
    } catch (mockError) {
      console.error('[Background] Mock fallback also failed:', mockError);
    }
  }
  
  // Everything failed
  console.error('[Background] All attempts failed');
  return { 
    success: false, 
    error: lastError?.message || 'Failed to fetch explanation' 
  };
}

/**
 * TASK-097: Listen for messages from content script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message.type, 'from tab:', sender.tab?.id);
  
  // US-022: Handle selected text from content script
  if (message.type === 'SELECTED_TEXT') {
    const tabId = sender.tab?.id;
    
    if (!tabId) {
      console.error('[Background] No tabId in sender');
      sendResponse({ success: false, error: 'No tab ID' });
      return true;
    }
    
    // TASK-098: Store text with metadata
    textStorage.set(tabId, {
      text: message.text,
      timestamp: Date.now(),
      url: sender.tab.url
    });
    
    console.log('[Background] Stored text for tab', tabId, ':', message.text.substring(0, 50) + '...');
    
    sendResponse({ success: true });
    return true;
  }
  
  // FETCH_EXPLANATION: Proxy API call with resilience
  if (message.type === 'FETCH_EXPLANATION') {
    const { text, tone, language, retryCount = 0 } = message;
    
    console.log('[Background] Fetching explanation:', { 
      textLength: text.length, 
      tone, 
      language,
      retryCount 
    });
    
    // Use async function with resilience
    fetchExplanationWithResilience(text, tone, language, retryCount)
      .then(result => {
        if (result.isMock) {
          console.log('[Background] Sending mock result to content script');
        }
        sendResponse(result);
      })
      .catch(error => {
        console.error('[Background] Unexpected error:', error);
        sendResponse({ 
          success: false, 
          error: 'Unexpected error: ' + error.message 
        });
      });
    
    return true; // Keep channel open for async response
  }
  
  // TASK-099: Popup requests stored text
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
        sendResponse({
          success: true,
          text: stored.text,
          timestamp: stored.timestamp
        });
        
        // Clean up after retrieval
        textStorage.delete(activeTabId);
      } else {
        console.log('[Background] No stored text for tab', activeTabId);
        sendResponse({
          success: false,
          error: 'No text stored'
        });
      }
    });
    
    return true; // Keep channel open for async response
  }
  
  return false;
});

// TASK-100: Clean up old stored text (older than 5 minutes)
setInterval(() => {
  const now = Date.now();
  const FIVE_MINUTES = 5 * 60 * 1000;
  
  for (const [tabId, data] of textStorage.entries()) {
    if (now - data.timestamp > FIVE_MINUTES) {
      console.log('[Background] Cleaning up old text for tab', tabId);
      textStorage.delete(tabId);
    }
  }
}, 60000); // Check every minute

console.log('[Background] Message listeners registered');
console.log('[Background] Network resilience enabled: timeout=%dms, retries=%d, fallback=%s',
  config.api.TIMEOUT_MS,
  config.api.RETRY_ATTEMPTS,
  config.FEATURES.FALLBACK_TO_MOCK ? 'enabled' : 'disabled'
);
