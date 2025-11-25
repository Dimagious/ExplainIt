/**
 * ExplainIt! Inline Popup
 * Shows explanation directly on the page (better UX than extension popup)
 */

let inlinePopup = null;
let popupShadowRoot = null;

const API_URL = 'http://localhost:3000/api/v1/explain';

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
 * Fetch explanation from backend
 */
async function fetchExplanation(text) {
  try {
    // Get settings from storage
    const settings = await chrome.storage.sync.get(['language', 'tone']);
    const language = settings.language || 'en';
    const tone = settings.tone || 'simple';
    
    console.log('[InlinePopup] Fetching explanation:', { text: text.substring(0, 50), language, tone });
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, tone, language })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Display result
    showResult(text, data.result, language, tone);
    
  } catch (error) {
    console.error('[InlinePopup] Error:', error);
    showError(error.message, text);
  }
}

/**
 * Show result in popup
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
  
  content.innerHTML = `
    <div class="result">
      <div class="section-title">Original text</div>
      <div class="original-text">${originalText}</div>
      
      <div class="section-title">Explanation</div>
      <div class="explanation">${explanation}</div>
    </div>
    <div class="footer">
      <div class="settings-badge">${langLabel} • ${toneLabels[tone]}</div>
      <button class="copy-btn">📋 Copy</button>
    </div>
  `;
  
  // Add copy handler
  const copyBtn = popupShadowRoot.querySelector('.copy-btn');
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(explanation).then(() => {
      copyBtn.textContent = '✓ Copied!';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy';
        copyBtn.classList.remove('copied');
      }, 2000);
    });
  });
}

/**
 * Show error in popup
 */
function showError(message, originalText) {
  if (!popupShadowRoot) return;
  
  const content = popupShadowRoot.querySelector('.content');
  content.innerHTML = `
    <div class="error">
      <div class="error-icon">⚠️</div>
      <div>${message}</div>
      <button class="retry-btn">Retry</button>
    </div>
  `;
  
  const retryBtn = popupShadowRoot.querySelector('.retry-btn');
  retryBtn.addEventListener('click', () => {
    content.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <div class="loading-text">Generating explanation...</div>
      </div>
    `;
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

