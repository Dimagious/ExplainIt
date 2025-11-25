/**
 * ExplainIt! Inline Popup
 * Shows explanation directly on the page (better UX than extension popup)
 * 
 * SECURITY: Uses textContent to prevent XSS attacks
 * ARCHITECTURE: Uses config.js for environment-based settings
 */

let inlinePopup = null;
let popupShadowRoot = null;
let retryCount = 0;
let currentText = null;

// Get config (loaded from config.js in manifest)
const config = window.ExplainItConfig ? window.ExplainItConfig.getConfig() : null;

/**
 * Create inline popup window
 */
function createInlinePopup(selectedText) {
  // Remove existing popup if any
  removeInlinePopup();
  
  // Create container
  const container = document.createElement('div');
  container.id = 'explainit-popup-container';
  container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 999999;
    width: 500px;
    max-width: 90vw;
    max-height: 80vh;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  
  // Create shadow DOM for isolation
  popupShadowRoot = container.attachShadow({ mode: 'open' });
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    .popup {
      background: white;
      display: flex;
      flex-direction: column;
      max-height: 80vh;
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .header {
      padding: 16px 20px;
      background: #4A90E2;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .title {
      font-size: 18px;
      font-weight: 600;
    }
    
    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    }
    
    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .content {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
    
    .loading {
      text-align: center;
      padding: 40px 20px;
    }
    
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #4A90E2;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .loading-text {
      color: #666;
      font-size: 14px;
    }
    
    .result {
      line-height: 1.6;
    }
    
    .section-title {
      font-size: 12px;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .original-text {
      background: #f7f9fc;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
      color: #666;
      font-style: italic;
      max-height: 100px;
      overflow-y: auto;
    }
    
    .explanation {
      font-size: 15px;
      line-height: 1.8;
      color: #333;
      white-space: pre-wrap;
    }
    
    .footer {
      padding: 16px 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .settings-badge {
      font-size: 12px;
      color: #666;
    }
    
    .copy-btn {
      background: #4A90E2;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    
    .copy-btn:hover {
      background: #357ABD;
    }
    
    .copy-btn.copied {
      background: #50E3C2;
    }
    
    .error {
      text-align: center;
      padding: 40px 20px;
      color: #FF6B6B;
    }
    
    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .retry-btn {
      background: #4A90E2;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 16px;
    }
  `;
  
  popupShadowRoot.appendChild(style);
  
  // Add popup structure
  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.innerHTML = `
    <div class="header">
      <div class="title">⚡ ExplainIt!</div>
      <button class="close-btn">×</button>
    </div>
    <div class="content">
      <div class="loading">
        <div class="spinner"></div>
        <div class="loading-text">Generating explanation...</div>
      </div>
    </div>
  `;
  
  popupShadowRoot.appendChild(popup);
  
  // Add close handler
  const closeBtn = popupShadowRoot.querySelector('.close-btn');
  closeBtn.addEventListener('click', removeInlinePopup);
  
  // Add to page
  document.body.appendChild(container);
  inlinePopup = container;
  
  // Fetch explanation
  fetchExplanation(selectedText);
}

/**
 * Remove inline popup
 */
function removeInlinePopup() {
  if (inlinePopup && inlinePopup.parentNode) {
    inlinePopup.parentNode.removeChild(inlinePopup);
    inlinePopup = null;
    popupShadowRoot = null;
  }
}

/**
 * Fetch explanation from backend via background script
 * (Content scripts can't make direct fetch due to CORS)
 * 
 * SECURITY: Validates text before sending
 * ARCHITECTURE: Uses config for validation rules
 */
async function fetchExplanation(text) {
  try {
    // Store current text for retry
    currentText = text;
    
    // CLIENT-SIDE VALIDATION: Check text before sending
    if (config && config.FEATURES.CLIENT_VALIDATION) {
      const validation = window.ExplainItConfig.validateText(text);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      text = validation.sanitized;
    }
    
    // Get settings from storage
    const settings = await chrome.storage.sync.get(['language', 'tone']);
    const language = settings.language || 'en';
    const tone = settings.tone || 'simple';
    
    console.log('[InlinePopup] Requesting explanation via background:', { 
      textLength: text.length, 
      language, 
      tone,
      retryCount 
    });
    
    // Send message to background script (it has privileges to bypass CORS)
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_EXPLANATION',
      text: text,
      tone: tone,
      language: language,
      retryCount: retryCount
    });
    
    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to fetch explanation');
    }
    
    console.log('[InlinePopup] Got explanation from background');
    
    // Reset retry count on success
    retryCount = 0;
    
    // Display result
    showResult(text, response.result, language, tone);
    
  } catch (error) {
    console.error('[InlinePopup] Error:', error);
    
    // Check if we should suggest mock fallback
    const shouldUseMock = config && config.FEATURES.FALLBACK_TO_MOCK && 
                          (error.message.includes('500') || error.message.includes('429'));
    
    const errorMsg = shouldUseMock 
      ? `${error.message} (Server unavailable)`
      : error.message;
    
    showError(errorMsg, text);
  }
}

/**
 * Show result in popup
 * SECURITY FIX: Uses textContent instead of innerHTML to prevent XSS
 */
function showResult(originalText, explanation, language, tone) {
  if (!popupShadowRoot) return;
  
  const content = popupShadowRoot.querySelector('.content');
  const langLabel = language === 'en' ? '🇬🇧 English' : '🇷🇺 Русский';
  const toneLabels = {
    simple: 'Simple',
    kid: 'Kid-friendly',
    expert: 'Expert'
  };
  
  // Create structure safely without innerHTML
  const resultDiv = document.createElement('div');
  resultDiv.className = 'result';
  
  // Original text section
  const originalTitle = document.createElement('div');
  originalTitle.className = 'section-title';
  originalTitle.textContent = 'Original text';
  
  const originalTextDiv = document.createElement('div');
  originalTextDiv.className = 'original-text';
  originalTextDiv.textContent = originalText; // SAFE: textContent prevents XSS
  
  // Explanation section
  const explanationTitle = document.createElement('div');
  explanationTitle.className = 'section-title';
  explanationTitle.textContent = 'Explanation';
  
  const explanationDiv = document.createElement('div');
  explanationDiv.className = 'explanation';
  explanationDiv.textContent = explanation; // SAFE: textContent prevents XSS
  
  // Append all elements
  resultDiv.appendChild(originalTitle);
  resultDiv.appendChild(originalTextDiv);
  resultDiv.appendChild(explanationTitle);
  resultDiv.appendChild(explanationDiv);
  
  // Footer
  const footer = document.createElement('div');
  footer.className = 'footer';
  
  const badge = document.createElement('div');
  badge.className = 'settings-badge';
  badge.textContent = `${langLabel} • ${toneLabels[tone]}`;
  
  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.textContent = '📋 Copy';
  
  footer.appendChild(badge);
  footer.appendChild(copyBtn);
  
  // Clear and append
  content.innerHTML = '';
  content.appendChild(resultDiv);
  content.appendChild(footer);
  
  // Add copy handler
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(explanation).then(() => {
      copyBtn.textContent = '✓ Copied!';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy';
        copyBtn.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('[InlinePopup] Failed to copy:', err);
      copyBtn.textContent = '✗ Failed';
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy';
      }, 2000);
    });
  });
}

/**
 * Show error in popup
 * SECURITY FIX: Uses textContent instead of innerHTML to prevent XSS
 */
function showError(message, originalText) {
  if (!popupShadowRoot) return;
  
  const content = popupShadowRoot.querySelector('.content');
  
  // Create error structure safely
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  
  const errorIcon = document.createElement('div');
  errorIcon.className = 'error-icon';
  errorIcon.textContent = '⚠️';
  
  const errorMessage = document.createElement('div');
  errorMessage.textContent = message; // SAFE: textContent prevents XSS
  
  const retryBtn = document.createElement('button');
  retryBtn.className = 'retry-btn';
  retryBtn.textContent = 'Retry';
  
  errorDiv.appendChild(errorIcon);
  errorDiv.appendChild(errorMessage);
  errorDiv.appendChild(retryBtn);
  
  content.innerHTML = '';
  content.appendChild(errorDiv);
  
  // Add retry handler
  retryBtn.addEventListener('click', () => {
    // Reset to loading state
    content.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <div class="loading-text">Generating explanation...</div>
      </div>
    `;
    retryCount++;
    fetchExplanation(originalText);
  });
}

// Close on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && inlinePopup) {
    removeInlinePopup();
  }
});

// Close on click outside
document.addEventListener('click', (e) => {
  if (inlinePopup && !inlinePopup.contains(e.target)) {
    removeInlinePopup();
  }
});

