/**
 * Background Service Worker for ExplainIt!
 * US-022: Content Script → Popup Communication
 * TASK-097: Background message listener
 * TASK-098: Text storage by tabId
 */

console.log('[Background] ExplainIt! Background service worker initialized');

// TASK-098: Store selected text per tab
const textStorage = new Map(); // tabId -> { text, timestamp }

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
    
    // US-022: Popup will be opened manually by user (auto-open not reliable in MV3)
    // chrome.action.openPopup(); // Removed - user clicks extension icon instead
    
    sendResponse({ success: true });
    return true;
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

