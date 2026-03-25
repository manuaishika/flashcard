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
  
  // Selection state
  let selectedWordIds = new Set();
  let selectionMode = false;
  let allWords = [];
  
  // Vault Tab Functions
  const loadVault = () => {
    chrome.storage.local.get(['words', 'groups'], (result) => {
      const words = result.words || [];
      allWords = words;
      
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
        loadGroups(result.groups || {});
        return;
      }
      
      words.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      
      if (wordList) {
        wordList.innerHTML = words.map((word, index) => {
          const wordId = word.id || `${word.word}_${word.dateAdded}_${index}`;
          const isSelected = selectedWordIds.has(wordId);
          const groups = word.groups || [];
          const groupTags = groups.map(group => `<span class="group-item" data-group="${escapeHtml(group)}">${escapeHtml(group)}</span>`).join('');
          
          return `
            <div class="word-card ${isSelected ? 'selected' : ''}" data-word-id="${wordId}">
              <input type="checkbox" class="word-checkbox" data-word-id="${wordId}" ${isSelected ? 'checked' : ''} ${selectionMode ? '' : 'style="display:none;"'}>
              <div class="word-card-content">
                <div class="word-title">${escapeHtml(word.word || 'Untitled')}</div>
                ${word.meaning ? `<div class="word-meaning">${escapeHtml(word.meaning)}</div>` : ''}
                ${word.mnemonic ? `<div class="word-understanding">${escapeHtml(word.mnemonic)}</div>` : ''}
                ${groups.length > 0 ? `<div style="margin: 8px 0; font-size: 11px; color: #999;">Groups: ${groupTags}</div>` : ''}
                ${word.context ? `<div class="word-context">📍 ${escapeHtml(word.context)}</div>` : ''}
                <div class="word-date">${formatDate(word.dateAdded)}</div>
              </div>
            </div>
          `;
        }).join('');
        
        // Add checkbox event listeners
        document.querySelectorAll('.word-checkbox').forEach(checkbox => {
          checkbox.addEventListener('change', (e) => {
            const wordId = e.target.dataset.wordId;
            if (e.target.checked) {
              selectedWordIds.add(wordId);
              e.target.closest('.word-card').classList.add('selected');
            } else {
              selectedWordIds.delete(wordId);
              e.target.closest('.word-card').classList.remove('selected');
            }
            updateSelectionUI();
          });
        });
        
        // Click on card to toggle selection in selection mode
        if (selectionMode) {
          document.querySelectorAll('.word-card').forEach(card => {
            card.addEventListener('click', (e) => {
              if (e.target.type !== 'checkbox') {
                const checkbox = card.querySelector('.word-checkbox');
                checkbox.click();
              }
            });
          });
        }
      }
      
      loadGroups(result.groups || {});
    });
  };
  
  const loadGroups = (groups) => {
    const groupsSection = document.getElementById('groupsSection');
    const groupsList = document.getElementById('groupsList');
    
    if (!groupsSection || !groupsList) return;
    
    const groupNames = Object.keys(groups);
    if (groupNames.length === 0) {
      groupsSection.style.display = 'none';
      return;
    }
    
    groupsSection.style.display = 'block';
    groupsList.innerHTML = groupNames.map(groupName => {
      const wordCount = groups[groupName].length;
      return `<span class="group-item" data-group-name="${escapeHtml(groupName)}">${escapeHtml(groupName)} (${wordCount})</span>`;
    }).join('');
    
    // Add click handlers to filter by group
    document.querySelectorAll('.group-item[data-group-name]').forEach(item => {
      item.addEventListener('click', () => {
        const groupName = item.dataset.groupName;
        filterByGroup(groupName);
      });
    });
  };
  
  const filterByGroup = (groupName) => {
    const filtered = allWords.filter(word => (word.groups || []).includes(groupName));
    // Re-render with filtered words
    if (wordList) {
      wordList.innerHTML = filtered.map((word, index) => {
        const wordId = word.id || `${word.word}_${word.dateAdded}_${index}`;
        const isSelected = selectedWordIds.has(wordId);
        return `
          <div class="word-card ${isSelected ? 'selected' : ''}" data-word-id="${wordId}">
            <input type="checkbox" class="word-checkbox" data-word-id="${wordId}" ${isSelected ? 'checked' : ''} ${selectionMode ? '' : 'style="display:none;"'}>
            <div class="word-card-content">
              <div class="word-title">${escapeHtml(word.word || 'Untitled')}</div>
              ${word.meaning ? `<div class="word-meaning">${escapeHtml(word.meaning)}</div>` : ''}
              ${word.mnemonic ? `<div class="word-understanding">${escapeHtml(word.mnemonic)}</div>` : ''}
              ${word.context ? `<div class="word-context">📍 ${escapeHtml(word.context)}</div>` : ''}
              <div class="word-date">${formatDate(word.dateAdded)}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  };
  
  const toggleSelectionMode = () => {
    selectionMode = !selectionMode;
    const vaultTab = document.getElementById('vaultTab');
    if (!vaultTab) return;
    
    if (selectionMode) {
      vaultTab.classList.add('selection-mode');
      document.querySelectorAll('.word-checkbox').forEach(cb => {
        if (cb) cb.style.display = 'block';
      });
      const selectAllBtn = document.getElementById('selectAllBtn');
      if (selectAllBtn) selectAllBtn.textContent = 'Deselect All';
    } else {
      vaultTab.classList.remove('selection-mode');
      selectedWordIds.clear();
      document.querySelectorAll('.word-checkbox').forEach(cb => {
        if (cb) {
          cb.style.display = 'none';
          cb.checked = false;
        }
      });
      document.querySelectorAll('.word-card').forEach(card => card.classList.remove('selected'));
      const selectAllBtn = document.getElementById('selectAllBtn');
      if (selectAllBtn) selectAllBtn.textContent = 'Select All';
    }
    updateSelectionUI();
  };
  
  const updateSelectionUI = () => {
    const selectedCount = document.getElementById('selectedCount');
    if (selectedCount) {
      selectedCount.textContent = `${selectedWordIds.size} selected`;
    }
  };
  
  const selectAll = () => {
    if (selectedWordIds.size === allWords.length) {
      // Deselect all
      selectedWordIds.clear();
      document.querySelectorAll('.word-checkbox').forEach(cb => {
        cb.checked = false;
        cb.closest('.word-card').classList.remove('selected');
      });
      document.getElementById('selectAllBtn').textContent = 'Select All';
    } else {
      // Select all
      allWords.forEach((word, index) => {
        const wordId = word.id || `${word.word}_${word.dateAdded}_${index}`;
        selectedWordIds.add(wordId);
        const checkbox = document.querySelector(`[data-word-id="${wordId}"]`);
        if (checkbox) {
          checkbox.checked = true;
          checkbox.closest('.word-card').classList.add('selected');
        }
      });
      document.getElementById('selectAllBtn').textContent = 'Deselect All';
    }
    updateSelectionUI();
  };
  
  const groupSelected = () => {
    if (selectedWordIds.size === 0) {
      alert('Please select at least one word to group');
      return;
    }
    
    const groupName = prompt('Enter group name:');
    if (!groupName || !groupName.trim()) return;
    
    chrome.storage.local.get(['words', 'groups'], (result) => {
      const words = result.words || [];
      const groups = result.groups || {};
      
      // Update words with group
      selectedWordIds.forEach(wordId => {
        const wordIndex = words.findIndex((w, idx) => {
          const id = w.id || `${w.word}_${w.dateAdded}_${idx}`;
          return id === wordId;
        });
        if (wordIndex !== -1) {
          if (!words[wordIndex].groups) words[wordIndex].groups = [];
          if (!words[wordIndex].groups.includes(groupName)) {
            words[wordIndex].groups.push(groupName);
          }
          // Add ID if missing
          if (!words[wordIndex].id) {
            words[wordIndex].id = wordId;
          }
        }
      });
      
      // Update groups object
      if (!groups[groupName]) groups[groupName] = [];
      selectedWordIds.forEach(wordId => {
        if (!groups[groupName].includes(wordId)) {
          groups[groupName].push(wordId);
        }
      });
      
      chrome.storage.local.set({ words, groups }, () => {
        selectedWordIds.clear();
        toggleSelectionMode();
        loadVault();
      });
    });
  };
  
  const deleteSelected = () => {
    if (selectedWordIds.size === 0) {
      alert('Please select at least one word to delete');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedWordIds.size} word(s)? This cannot be undone.`)) {
      return;
    }
    
    chrome.storage.local.get(['words', 'groups'], (result) => {
      let words = result.words || [];
      const groups = result.groups || {};
      
      // Remove selected words
      words = words.filter((word, index) => {
        const wordId = word.id || `${word.word}_${word.dateAdded}_${index}`;
        if (!word.id) word.id = wordId;
        return !selectedWordIds.has(wordId);
      });
      
      // Update groups (remove word IDs from groups)
      Object.keys(groups).forEach(groupName => {
        groups[groupName] = groups[groupName].filter(id => !selectedWordIds.has(id));
        if (groups[groupName].length === 0) {
          delete groups[groupName];
        }
      });
      
      chrome.storage.local.set({ words, groups }, () => {
        selectedWordIds.clear();
        allWords = words;
        toggleSelectionMode();
        loadVault();
      });
    });
  };
  
  const createGroup = () => {
    const input = document.getElementById('newGroupInput');
    if (!input || !input.value.trim()) return;
    
    const groupName = input.value.trim();
    chrome.storage.local.get(['groups'], (result) => {
      const groups = result.groups || {};
      if (!groups[groupName]) {
        groups[groupName] = [];
        chrome.storage.local.set({ groups }, () => {
          input.value = '';
          loadGroups(groups);
        });
      } else {
        alert('Group already exists');
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
  
  // Event listeners for vault tab
  if (exportBtn) exportBtn.addEventListener('click', exportAsMarkdown);
  if (clearBtn) clearBtn.addEventListener('click', clearAll);
  
  const selectAllBtn = document.getElementById('selectAllBtn');
  const groupBtn = document.getElementById('groupBtn');
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  const cancelSelectionBtn = document.getElementById('cancelSelectionBtn');
  const createGroupBtn = document.getElementById('createGroupBtn');
  const newGroupInput = document.getElementById('newGroupInput');
  
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      if (!selectionMode) {
        toggleSelectionMode();
      }
      selectAll();
    });
  }
  
  if (groupBtn) groupBtn.addEventListener('click', groupSelected);
  if (deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', deleteSelected);
  if (cancelSelectionBtn) cancelSelectionBtn.addEventListener('click', () => {
    selectedWordIds.clear();
    toggleSelectionMode();
    loadVault();
  });
  
  if (createGroupBtn) createGroupBtn.addEventListener('click', createGroup);
  if (newGroupInput) {
    newGroupInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        createGroup();
      }
    });
  }
  
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
