// Service worker - handles keyboard shortcuts and context menu

// Strip leftover UI from an older build whose content script stayed alive in open tabs.
function removeGhostSaveChipsFromOpenTabs() {
  const stripChip = () => {
    const candidates = document.querySelectorAll('button, [role="button"], a, span, div');
    candidates.forEach((el) => {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (t.includes('Save to Vault')) el.remove();
    });
  };
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (!tab.id) continue;
      const url = tab.url || '';
      if (!url.startsWith('http://') && !url.startsWith('https://')) continue;
      chrome.scripting
        .executeScript({ target: { tabId: tab.id }, func: stripChip })
        .catch(() => {});
    }
  });
}

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
        // Inject script to get selected text (MV3 executeScript is promise-based)
        chrome.scripting
          .executeScript({
            target: { tabId: tabs[0].id },
            func: () => window.getSelection().toString().trim()
          })
          .then((results) => {
            const word = results && results[0]?.result;
            if (word) openWordPopup(word, tabs[0].url);
          })
          .catch(() => {});
      }
    });
  }
});

// Right-click context menu: highlight → right-click → "Save 'word' to Word Vault"
const createContextMenu = () => {
  chrome.contextMenus.removeAll(() => {
    // Create new menu with dynamic title showing the selected word
    chrome.contextMenus.create({
      id: 'word-vault-save',
      title: 'Save "%s" to Word Vault',  // Chrome automatically replaces %s with selected text
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Context menu creation error:', chrome.runtime.lastError.message);
      } else {
        console.log('Context menu created successfully');
      }
    });
  });
};

// Create context menu immediately when script loads
createContextMenu();

// Also create on install and startup (in case extension reloaded)
chrome.runtime.onInstalled.addListener((details) => {
  createContextMenu();
  if (details.reason === 'install' || details.reason === 'update') {
    removeGhostSaveChipsFromOpenTabs();
  }
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenu();
  // Best-effort cleanup if a previous content script instance lingered.
  // (If it isn't ours, this is harmless; it only removes elements containing the text.)
  removeGhostSaveChipsFromOpenTabs();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'word-vault-save' && info.selectionText) {
    openWordPopup(info.selectionText.trim(), tab && tab.url);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveWord') {
    chrome.storage.local.get(['words', 'groups'], (result) => {
      const words = result.words || [];
      const groups = result.groups || {};
      const wordId = globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : `wv_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

      const payloadGroups = Array.isArray(request.groups) ? request.groups.filter(Boolean) : [];
      const suggestedGroup =
        typeof request.suggestedGroup === 'string' && request.suggestedGroup.trim()
          ? request.suggestedGroup.trim()
          : null;

      const wordCard = {
        id: wordId,
        word: request.word,
        meaning: request.meaning || '',
        mnemonic: request.mnemonic || '',
        context: request.context || '',
        sourceUrl: request.sourceUrl || '',
        dateAdded: new Date().toISOString(),
        groups: payloadGroups,
        suggestedGroup
      };

      words.push(wordCard);

      payloadGroups.forEach((name) => {
        if (!groups[name]) groups[name] = [];
        if (!groups[name].includes(wordId)) groups[name].push(wordId);
      });

      chrome.storage.local.set({ words, groups }, () => {
        sendResponse({ success: true, id: wordId });
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

