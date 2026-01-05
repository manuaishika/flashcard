// Service worker - handles keyboard shortcuts

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
            // Store word temporarily and open popup window
            chrome.storage.local.set({ pendingWord: word, sourceUrl: tabs[0].url }, () => {
              // Create a popup window instead of trying to open action popup
              chrome.windows.create({
                url: chrome.runtime.getURL('popup.html'),
                type: 'popup',
                width: 360,
                height: 500
              });
            });
          }
        });
      }
    });
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

