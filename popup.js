// Popup script - handles tabs (Save/Vault) and word entry

document.addEventListener('DOMContentLoaded', () => {
  // Vault Tab Elements (defined first so functions can access them)
  const stats = document.getElementById('stats');
  const wordList = document.getElementById('wordList');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  
  // Helper functions
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Vault Tab Functions
  const loadVault = () => {
    chrome.storage.local.get(['words'], (result) => {
      const words = result.words || [];
      
      if (stats) stats.textContent = `Total words: ${words.length}`;
      
      if (words.length === 0) {
        if (wordList) {
          wordList.innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">📚</div>
              <div style="margin-bottom: 8px;">Your Word Vault is empty</div>
              <div style="font-size: 12px; color: #999;">Right-click on words while reading to add them</div>
            </div>
          `;
        }
        return;
      }
      
      words.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      
      if (wordList) {
        wordList.innerHTML = words.map(word => `
          <div class="word-card">
            <div class="word-title">${escapeHtml(word.word || 'Untitled')}</div>
            ${word.meaning ? `<div class="word-meaning">${escapeHtml(word.meaning)}</div>` : ''}
            ${word.mnemonic ? `<div class="word-understanding">${escapeHtml(word.mnemonic)}</div>` : ''}
            ${word.context ? `<div class="word-context">📍 ${escapeHtml(word.context)}</div>` : ''}
            <div class="word-date">${formatDate(word.dateAdded)}</div>
          </div>
        `).join('');
      }
    });
  };
  
  const exportAsMarkdown = () => {
    chrome.storage.local.get(['words'], (result) => {
      const words = result.words || [];
      
      if (words.length === 0) {
        alert('No words to export');
        return;
      }
      
      words.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      
      const markdown = words.map(word => {
        const lines = [
          `## ${word.word || 'Untitled'}`,
          '',
          `**Date:** ${formatDate(word.dateAdded)}`,
          ''
        ];
        
        if (word.meaning) {
          lines.push(`*Auto explanation:* ${word.meaning}`);
          lines.push('');
        }
        
        if (word.mnemonic) {
          lines.push(`**My understanding:** ${word.mnemonic}`);
          lines.push('');
        }
        
        if (word.context) {
          lines.push(`*Context:* ${word.context}`);
          lines.push('');
        }
        
        if (word.sourceUrl) {
          lines.push(`[Source](${word.sourceUrl})`);
          lines.push('');
        }
        
        lines.push('---');
        lines.push('');
        return lines.join('\n');
      }).join('\n');
      
      const header = `# Word Vault\n\n*Exported on ${formatDate(new Date().toISOString())}*\n\nTotal words: ${words.length}\n\n---\n\n`;
      const fullMarkdown = header + markdown;
      
      const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `word-vault-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };
  
  const clearAll = () => {
    if (confirm('Are you sure you want to clear all words? This cannot be undone.')) {
      chrome.storage.local.set({ words: [] }, () => {
        loadVault();
      });
    }
  };
  
  if (exportBtn) exportBtn.addEventListener('click', exportAsMarkdown);
  if (clearBtn) clearBtn.addEventListener('click', clearAll);
  
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Update tab states
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update content states
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTab + 'Tab') {
          content.classList.add('active');
        }
      });
      
      // Load vault when switching to vault tab
      if (targetTab === 'vault') {
        loadVault();
      }
    });
  });
  
  // Save Tab Elements
  const wordInput = document.getElementById('wordInput');
  const mnemonicInput = document.getElementById('mnemonicInput');
  const contextInput = document.getElementById('contextInput');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');
  const baselineMeaning = document.getElementById('baselineMeaning');
  const baselineToggle = document.getElementById('baselineToggle');
  const baselineArrow = document.getElementById('baselineArrow');
  
  let currentMeaning = '';
  
  // Toggle baseline meaning visibility
  if (baselineToggle) {
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
  }
  
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
      // Switch to save tab
      document.querySelector('[data-tab="save"]').click();
      
      wordInput.value = result.pendingWord;
      contextInput.value = result.sourceUrl || '';
      
      chrome.storage.local.remove(['pendingWord', 'sourceUrl']);
      fetchBasicMeaning(wordInput.value);
      setTimeout(() => mnemonicInput.focus(), 100);
    } else {
      // Check if text is selected
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
            if (response && response.text) {
              document.querySelector('[data-tab="save"]').click();
              wordInput.value = response.text;
              fetchBasicMeaning(wordInput.value);
              setTimeout(() => mnemonicInput.focus(), 100);
            }
          });
        }
      });
    }
  });
  
  // Save function
  const saveWord = async () => {
    const word = wordInput.value.trim();
    if (!word) {
      status.textContent = 'Word is required';
      status.className = 'status error';
      return;
    }
    
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const wordCard = {
        word: word,
        meaning: currentMeaning || '',
        mnemonic: mnemonicInput.value.trim(),
        context: contextInput.value.trim() || (tabs[0] ? tabs[0].url : ''),
        sourceUrl: tabs[0] ? tabs[0].url : '',
        dateAdded: new Date().toISOString()
      };
      
      saveBtn.disabled = true;
      status.innerHTML = '<span class="loading"></span>Saving...';
      status.className = 'status';
      
      // Save to local storage
      chrome.runtime.sendMessage({
        action: 'saveWord',
        ...wordCard
      }, (response) => {
        saveBtn.disabled = false;
        if (response && response.success) {
          status.textContent = 'Saved to Word Vault! ✓';
          status.className = 'status success';
          
          // Clear inputs
          wordInput.value = '';
          mnemonicInput.value = '';
          contextInput.value = '';
          currentMeaning = '';
          baselineMeaning.textContent = 'Enter a word to fetch definition';
          baselineMeaning.classList.add('empty');
          
          // Switch to vault tab to show the new word
          setTimeout(() => {
            document.querySelector('[data-tab="vault"]').click();
          }, 500);
        } else {
          status.textContent = 'Error saving';
          status.className = 'status error';
        }
      });
    });
  };
  
  // Event listeners
  saveBtn.addEventListener('click', saveWord);
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (document.getElementById('saveTab').classList.contains('active')) {
        saveWord();
      }
    }
  });
  
  wordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchBasicMeaning(wordInput.value);
      setTimeout(() => mnemonicInput.focus(), 100);
    }
  });
  
  mnemonicInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
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
  
  // Load vault initially if on vault tab
  setTimeout(() => {
    if (document.getElementById('vaultTab') && document.getElementById('vaultTab').classList.contains('active')) {
      loadVault();
    }
  }, 100);
});
