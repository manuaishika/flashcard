// Service worker - handles keyboard shortcuts and context menu

function openWordPopup(word, url) {
  if (!word) return;

  chrome.storage.local.set({ pendingWord: word, sourceUrl: url || '' }, () => {
    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 360,
      height: 500
    });
  });
}

// Keyboard shortcut (optional, you can ignore and just use right-click)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'save-word') {
    // Get active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Inject script to get selected text
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            return window.getSelection().toString().trim();
          }
        }, (results) => {
          const word = results && results[0]?.result;
          if (word) {
            openWordPopup(word, tabs[0].url);
          }
        });
      }
    });
  }
});

// Right-click context menu: highlight → right-click → "Save to Word Vault"
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'word-vault-save',
    title: 'Save to Word Vault',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'word-vault-save' && info.selectionText) {
    openWordPopup(info.selectionText.trim(), tab && tab.url);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveWord') {
    // Save word to storage
    chrome.storage.local.get(['words'], (result) => {
      const words = result.words || [];
      const wordCard = {
        word: request.word,
        meaning: request.meaning || '',
        mnemonic: request.mnemonic || '',
        context: request.context || '',
        sourceUrl: request.sourceUrl || '',
        dateAdded: new Date().toISOString()
      };
      
      words.push(wordCard);
      
      chrome.storage.local.set({ words: words }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
  
  if (request.action === 'getWords') {
    chrome.storage.local.get(['words'], (result) => {
      sendResponse({ words: result.words || [] });
    });
    return true;
  }
});

