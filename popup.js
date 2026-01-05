// Popup script - handles word entry UI

document.addEventListener('DOMContentLoaded', () => {
  const wordInput = document.getElementById('wordInput');
  const meaningInput = document.getElementById('meaningInput');
  const mnemonicInput = document.getElementById('mnemonicInput');
  const contextInput = document.getElementById('contextInput');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const status = document.getElementById('status');
  
  // Check if there's a pending word from shortcut
  chrome.storage.local.get(['pendingWord', 'sourceUrl'], (result) => {
    if (result.pendingWord) {
      wordInput.value = result.pendingWord;
      contextInput.value = result.sourceUrl || '';
      
      // Clear pending word
      chrome.storage.local.remove(['pendingWord', 'sourceUrl']);
      
      // Auto-focus meaning input
      meaningInput.focus();
    } else {
      // Try to get selected text from active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
            if (response && response.text) {
              wordInput.value = response.text;
              meaningInput.focus();
            } else {
              wordInput.focus();
            }
          });
        }
      });
    }
  });
  
  // Save function
  const saveWord = () => {
    const word = wordInput.value.trim();
    if (!word) {
      status.textContent = 'Word is required';
      status.style.color = '#e74c3c';
      return;
    }
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const wordCard = {
        word: word,
        meaning: meaningInput.value.trim(),
        mnemonic: mnemonicInput.value.trim(),
        context: contextInput.value.trim() || (tabs[0] ? tabs[0].url : ''),
        sourceUrl: tabs[0] ? tabs[0].url : ''
      };
      
      // Send to background to save
      chrome.runtime.sendMessage({
        action: 'saveWord',
        ...wordCard
      }, (response) => {
        if (response && response.success) {
          status.textContent = 'Saved!';
          status.style.color = '#27ae60';
          
          // Clear inputs
          wordInput.value = '';
          meaningInput.value = '';
          mnemonicInput.value = '';
          contextInput.value = '';
          
          // Close popup after short delay
          setTimeout(() => {
            window.close();
          }, 500);
        } else {
          status.textContent = 'Error saving';
          status.style.color = '#e74c3c';
        }
      });
    });
  };
  
  // Event listeners
  saveBtn.addEventListener('click', saveWord);
  
  cancelBtn.addEventListener('click', () => {
    window.close();
  });
  
  // Enter key to save
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveWord();
    }
  });
  
  // Tab navigation
  wordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      meaningInput.focus();
    }
  });
  
  meaningInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      mnemonicInput.focus();
    }
  });
  
  mnemonicInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      saveWord();
    }
  });
  
  contextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveWord();
    }
  });
});

