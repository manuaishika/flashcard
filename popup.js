// Popup script - handles word entry UI
// Phase 1: Personal tool with Google Docs integration via Apps Script

document.addEventListener('DOMContentLoaded', () => {
  const wordInput = document.getElementById('wordInput');
  const mnemonicInput = document.getElementById('mnemonicInput');
  const contextInput = document.getElementById('contextInput');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const status = document.getElementById('status');
  const baselineMeaning = document.getElementById('baselineMeaning');
  const baselineToggle = document.getElementById('baselineToggle');
  const baselineArrow = document.getElementById('baselineArrow');
  
  let currentMeaning = ''; // Store the fetched meaning
  
  // Toggle baseline meaning visibility
  baselineToggle.addEventListener('click', () => {
    const isExpanded = baselineMeaning.classList.contains('show');
    if (isExpanded) {
      baselineMeaning.classList.remove('show');
      baselineArrow.classList.remove('expanded');
    } else {
      baselineMeaning.classList.add('show');
      baselineArrow.classList.add('expanded');
    }
  });
  
  const fetchBasicMeaning = (word) => {
    const cleaned = (word || '').trim();
    if (!cleaned) {
      baselineMeaning.textContent = 'Enter a word to fetch definition';
      baselineMeaning.classList.add('empty');
      return;
    }

    baselineMeaning.textContent = 'Fetching definition...';
    baselineMeaning.classList.add('empty');
    currentMeaning = '';

    // Free dictionary API – good enough baseline, you edit your own understanding
    fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(cleaned))
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data || !Array.isArray(data) || !data[0]?.meanings?.length) {
          baselineMeaning.textContent = 'No definition found';
          baselineMeaning.classList.add('empty');
          return;
        }
        
        const firstMeaning = data[0].meanings[0];
        const firstDef = firstMeaning.definitions && firstMeaning.definitions[0]?.definition;
        if (firstDef) {
          currentMeaning = firstDef;
          baselineMeaning.textContent = firstDef;
          baselineMeaning.classList.remove('empty');
        } else {
          baselineMeaning.textContent = 'No definition available';
          baselineMeaning.classList.add('empty');
        }
      })
      .catch(() => {
        baselineMeaning.textContent = 'Could not fetch definition';
        baselineMeaning.classList.add('empty');
      });
  };
  
  // Check if there's a pending word from right-click or shortcut
  chrome.storage.local.get(['pendingWord', 'sourceUrl'], (result) => {
    if (result.pendingWord) {
      wordInput.value = result.pendingWord;
      contextInput.value = result.sourceUrl || '';
      
      // Clear pending word
      chrome.storage.local.remove(['pendingWord', 'sourceUrl']);
      
      // Auto-fetch basic meaning in background
      fetchBasicMeaning(wordInput.value);

      // Focus on your note (mnemonic) – this is the real artifact
      setTimeout(() => mnemonicInput.focus(), 100);
    } else {
      // Try to get selected text from active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
            if (response && response.text) {
              wordInput.value = response.text;
              fetchBasicMeaning(wordInput.value);
              setTimeout(() => mnemonicInput.focus(), 100);
            } else {
              wordInput.focus();
            }
          });
        }
      });
    }
  });
  
  // Save function - sends to Google Apps Script
  const saveWord = async () => {
    const word = wordInput.value.trim();
    if (!word) {
      status.textContent = 'Word is required';
      status.className = 'status error';
      return;
    }
    
    if (!mnemonicInput.value.trim()) {
      status.textContent = 'Please add your understanding';
      status.className = 'status error';
      mnemonicInput.focus();
      return;
    }
    
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const wordCard = {
        word: word,
        meaning: currentMeaning || '', // Auto-fetched baseline
        mnemonic: mnemonicInput.value.trim(), // Your real understanding
        context: contextInput.value.trim() || (tabs[0] ? tabs[0].url : ''),
        sourceUrl: tabs[0] ? tabs[0].url : '',
        dateAdded: new Date().toISOString().slice(0, 10) // YYYY-MM-DD format
      };
      
      saveBtn.disabled = true;
      status.innerHTML = '<span class="loading"></span>Saving...';
      status.className = 'status';
      
      // Get Google Script URL from storage
      chrome.storage.local.get(['googleScriptUrl'], async (result) => {
        const scriptUrl = result.googleScriptUrl;
        
        if (scriptUrl) {
          // Try Google Docs first (Phase 1)
          try {
            const response = await fetch(scriptUrl, {
              method: 'POST',
              mode: 'no-cors', // Required for Apps Script
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(wordCard)
            });
            
            // Note: no-cors means we can't read response, but that's OK
            status.textContent = 'Saved to Google Doc! ✓';
            status.className = 'status success';
            
            // Clear inputs
            wordInput.value = '';
            mnemonicInput.value = '';
            contextInput.value = '';
            currentMeaning = '';
            baselineMeaning.textContent = 'Enter a word to fetch definition';
            baselineMeaning.classList.add('empty');
            
            // Close popup after short delay
            setTimeout(() => {
              window.close();
            }, 800);
            return;
          } catch (error) {
            console.error('Google Docs save failed:', error);
            // Fall through to local storage backup
          }
        }
        
        // Fallback: Save to local storage (so nothing is lost)
        chrome.runtime.sendMessage({
          action: 'saveWord',
          ...wordCard
        }, (response) => {
          saveBtn.disabled = false;
          if (response && response.success) {
            status.textContent = 'Saved locally (Google Docs not configured)';
            status.className = 'status success';
            
            // Clear inputs
            wordInput.value = '';
            mnemonicInput.value = '';
            contextInput.value = '';
            currentMeaning = '';
            baselineMeaning.textContent = 'Enter a word to fetch definition';
            baselineMeaning.classList.add('empty');
            
            // Close popup after short delay
            setTimeout(() => {
              window.close();
            }, 800);
          } else {
            status.textContent = 'Error saving';
            status.className = 'status error';
            saveBtn.disabled = false;
          }
        });
      });
    });
  };
  
  // Event listeners
  saveBtn.addEventListener('click', saveWord);
  
  cancelBtn.addEventListener('click', () => {
    window.close();
  });
  
  // Ctrl+Enter to save (anywhere)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveWord();
    }
  });
  
  // Word input: Enter fetches meaning and focuses understanding
  wordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchBasicMeaning(wordInput.value);
      setTimeout(() => mnemonicInput.focus(), 100);
    }
  });
  
  // Understanding field: Ctrl+Enter saves
  mnemonicInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveWord();
    }
  });
  
  // Context field: Enter saves
  contextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveWord();
    }
  });
});

