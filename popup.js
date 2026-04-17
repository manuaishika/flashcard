// Popup — Save / Vault with suggested grouping

const GROUP_RULES = [
  {
    name: 'Technology',
    keys: [
      'software', 'algorithm', 'computer', 'digital', 'data', 'network', 'code', 'program', 'api',
      'server', 'internet', 'cyber', 'artificial', 'hardware', 'database', 'encryption', 'pixel'
    ]
  },
  {
    name: 'Business & economics',
    keys: [
      'market', 'finance', 'invest', 'revenue', 'profit', 'stock', 'trade', 'econom', 'business',
      'company', 'startup', 'contract', 'customer', 'sales', 'capital', 'tariff', 'inflation'
    ]
  },
  {
    name: 'Law & politics',
    keys: [
      'law', 'legal', 'court', 'policy', 'democracy', 'government', 'parliament', 'vote',
      'rights', 'treaty', 'constitution', 'regulation', 'justice', 'sovereign', 'sanction'
    ]
  },
  {
    name: 'Medicine & body',
    keys: [
      'medicine', 'medical', 'disease', 'symptom', 'therapy', 'surgery', 'anatom', 'diagnos',
      'clinical', 'patient', 'vaccine', 'tissue', 'muscle', 'bone', 'virus', 'bacteria', 'cell'
    ]
  },
  {
    name: 'Science & nature',
    keys: [
      'species', 'evolution', 'climate', 'ecosystem', 'chemistry', 'physics', 'atom', 'molecule',
      'energy', 'gravity', 'mineral', 'fossil', 'ossif', 'geology', 'astronom', 'genome'
    ]
  },
  {
    name: 'Mind & philosophy',
    keys: [
      'psycholog', 'emotion', 'cognit', 'memory', 'philosoph', 'ethic', 'moral', 'logic',
      'epistemo', 'existen', 'conscious', 'belief', 'reason', 'metaph', 'ontolog'
    ]
  },
  {
    name: 'Arts & culture',
    keys: [
      'art', 'music', 'poetry', 'literature', 'novel', 'drama', 'film', 'culture', 'myth',
      'ritual', 'religion', 'aesthetic', 'metaphor', 'symbol'
    ]
  },
  {
    name: 'Academic & learning',
    keys: [
      'theory', 'hypothesis', 'research', 'study', 'analysis', 'discourse', 'scholar', 'thesis',
      'methodology', 'citation', 'paradigm', 'empirical'
    ]
  },
  {
    name: 'Everyday life',
    keys: [
      'food', 'travel', 'family', 'home', 'friend', 'sport', 'game', 'weather', 'fashion',
      'cooking', 'garden', 'hobby', 'laugh', 'joke', 'lively', 'crowd', 'noisy', 'rowdy', 'party',
      'cheer', 'festive', 'boisterous', 'rambunctious'
    ]
  }
];

function suggestGroupFromContent({ word, meaning, context, mnemonic, userClues }) {
  const blob = [word, meaning, context, mnemonic, userClues].filter(Boolean).join(' ').toLowerCase();
  if (!blob.trim()) return 'General vocabulary';

  for (const rule of GROUP_RULES) {
    if (rule.keys.some((k) => blob.includes(k))) return rule.name;
  }
  return 'General vocabulary';
}

function normalizeSelectionText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function classifyEntryType(text) {
  const normalized = normalizeSelectionText(text);
  const words = normalized ? normalized.split(/\s+/).length : 0;
  const hasSentencePunctuation = /[.!?;:]/.test(normalized);
  if (normalized.length > 90 || words > 14 || hasSentencePunctuation) {
    return 'note';
  }
  return 'term';
}

function buildDisplayTitle(text, entryType) {
  const normalized = normalizeSelectionText(text);
  if (entryType !== 'note') return normalized;
  return normalized.length > 78 ? `${normalized.slice(0, 78).trim()}…` : normalized;
}

/** First substantial token for synonym lookup (Datamuse works best on single words). */
function headwordForSynonyms(phrase) {
  const t = (phrase || '').trim();
  if (!t) return '';
  const parts = t.split(/\s+/).filter(Boolean);
  for (const p of parts) {
    const clean = p.replace(/[^a-zA-Z'-]/g, '');
    if (clean.length >= 3) return clean.toLowerCase();
  }
  const fallback = parts[0]?.replace(/[^a-zA-Z'-]/g, '') || '';
  return fallback.length ? fallback.toLowerCase() : '';
}

document.addEventListener('DOMContentLoaded', () => {
  const stats = document.getElementById('stats');
  const wordList = document.getElementById('wordList');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  const searchInput = document.getElementById('searchInput');
  const activeFilter = document.getElementById('activeFilter');
  const groupsSection = document.getElementById('groupsSection');

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
      month: 'short',
      day: 'numeric'
    });
  };

  let selectedWordIds = new Set();
  let selectionMode = false;
  let allWords = [];
  let currentGroupFilter = '';
  let currentSearchQuery = '';

  let groupsForSave = [];
  let pendingSuggestion = '';
  let currentMeaningGlobal = '';
  let relatedWordsList = [];

  const relatedWordsDisplay = document.getElementById('relatedWordsDisplay');
  const userCluesInput = document.getElementById('userCluesInput');

  const setRelatedWordsLoading = () => {
    relatedWordsList = [];
    if (relatedWordsDisplay) {
      relatedWordsDisplay.textContent = 'Looking up related words…';
      relatedWordsDisplay.className = 'related-words-line muted';
    }
  };

  const fetchRelatedWords = (phrase) => {
    const head = headwordForSynonyms(phrase);
    if (!head || head.length < 2) {
      relatedWordsList = [];
      if (relatedWordsDisplay) {
        relatedWordsDisplay.textContent =
          'Enter a word — we’ll suggest a “same family” list for recall (e.g. boisterous, exuberant, …).';
        relatedWordsDisplay.className = 'related-words-line muted';
      }
      return;
    }

    setRelatedWordsLoading();

    fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(head)}&max=14`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (!Array.isArray(list)) list = [];
        const seen = new Set([head]);
        const out = [];
        for (const item of list) {
          const w = (item.word || '').trim();
          if (!w || seen.has(w.toLowerCase())) continue;
          seen.add(w.toLowerCase());
          out.push(w);
          if (out.length >= 8) break;
        }
        relatedWordsList = out;
        if (relatedWordsDisplay) {
          if (out.length === 0) {
            relatedWordsDisplay.textContent =
              'No close matches — use your own clues above (laughing, joking, lively crowd, …).';
            relatedWordsDisplay.className = 'related-words-line muted';
          } else {
            relatedWordsDisplay.textContent = `Think of words like: ${out.join(', ')}`;
            relatedWordsDisplay.className = 'related-words-line';
          }
        }
      })
      .catch(() => {
        relatedWordsList = [];
        if (relatedWordsDisplay) {
          relatedWordsDisplay.textContent =
            'Could not load related words (offline or blocked). Your clues still save.';
          relatedWordsDisplay.className = 'related-words-line muted';
        }
      });
  };

  const suggestedStrip = document.getElementById('suggestedStrip');
  const suggestedGroupPill = document.getElementById('suggestedGroupPill');
  const useSuggestedBtn = document.getElementById('useSuggestedBtn');
  const customGroupBtn = document.getElementById('customGroupBtn');
  const clearGroupChoiceBtn = document.getElementById('clearGroupChoiceBtn');

  const refreshSaveSuggestion = () => {
    const word = (document.getElementById('wordInput')?.value || '').trim();
    const meaning = currentMeaningGlobal;
    const context = (document.getElementById('contextInput')?.value || '').trim();
    const mnemonic = (document.getElementById('mnemonicInput')?.value || '').trim();
    const userClues = (document.getElementById('userCluesInput')?.value || '').trim();

    if (!suggestedStrip || !suggestedGroupPill) return;

    if (!word && !meaning && !context && !mnemonic && !userClues) {
      pendingSuggestion = '';
      suggestedStrip.classList.remove('visible');
      return;
    }

    pendingSuggestion = suggestGroupFromContent({ word, meaning, context, mnemonic, userClues });
    suggestedGroupPill.textContent = pendingSuggestion;
    suggestedStrip.classList.add('visible');
  };

  const renderWordList = (words) => {
    if (!wordList) return;
    wordList.innerHTML = words
      .map((word, index) => {
        const wordId = word.id || `${word.word}_${word.dateAdded}_${index}`;
        const isSelected = selectedWordIds.has(wordId);
        const groups = word.groups || [];
        const entryType = word.entryType || 'term';
        const fullText = normalizeSelectionText(word.fullText || word.word || '');
        const displayTitle = word.displayTitle || buildDisplayTitle(fullText, entryType);

        const userTags = groups
          .map(
            (g) =>
              `<span class="tag user-group" data-group="${escapeHtml(g)}">${escapeHtml(g)}</span>`
          )
          .join('');

        let suggestedRow = '';
        if (
          word.suggestedGroup &&
          !(word.groups || []).includes(word.suggestedGroup)
        ) {
          suggestedRow = `
          <div class="suggested-hint">
            Suggested: ${escapeHtml(word.suggestedGroup)}
            <button type="button" class="link-add" data-accept-suggestion="${escapeHtml(wordId)}">Add to card</button>
          </div>`;
        }

        return `
        <div class="word-card ${isSelected ? 'selected' : ''}" data-word-id="${wordId}">
          <input type="checkbox" class="word-checkbox" data-word-id="${wordId}" ${isSelected ? 'checked' : ''} ${selectionMode ? '' : 'style="display:none;"'}>
          <div class="word-card-content">
            <div class="word-title">${escapeHtml(displayTitle || 'Untitled')}</div>
            <div class="word-meta">
              <span class="tag">${entryType === 'note' ? 'Note/Proof' : 'Word/Phrase'}</span>
              ${userTags}
              <span class="word-date">${formatDate(word.dateAdded)}</span>
            </div>
            ${entryType === 'note' && fullText ? `<div class="word-meaning note-text">${escapeHtml(fullText)}</div>` : ''}
            ${entryType !== 'note' && word.meaning ? `<div class="word-meaning">${escapeHtml(word.meaning)}</div>` : ''}
            ${word.mnemonic ? `<div class="word-understanding">${escapeHtml(word.mnemonic)}</div>` : ''}
            ${word.context ? `<div class="word-context">${escapeHtml(word.context)}</div>` : ''}
            ${
              word.userClues ||
              (word.relatedWords && word.relatedWords.length)
                ? `<div class="vault-recall">
                ${
                  word.userClues
                    ? `<div class="rw-label">Recall clues</div><div class="rw-clues">${escapeHtml(word.userClues)}</div>`
                    : ''
                }
                ${
                  word.relatedWords && word.relatedWords.length
                    ? `<div class="rw-label">Same family</div><div class="rw-family">Think of words like: ${word.relatedWords.map((w) => `<em>${escapeHtml(w)}</em>`).join(', ')}</div>`
                    : ''
                }
              </div>`
                : ''
            }
            ${suggestedRow}
          </div>
        </div>
      `;
      })
      .join('');

    document.querySelectorAll('.word-checkbox').forEach((checkbox) => {
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

    if (selectionMode) {
      document.querySelectorAll('.word-card').forEach((card) => {
        card.addEventListener('click', (e) => {
          if (e.target.type !== 'checkbox' && !e.target.closest('[data-accept-suggestion]')) {
            const checkbox = card.querySelector('.word-checkbox');
            checkbox.click();
          }
        });
      });
    }
  };

  const updateActiveFilterLabel = () => {
    if (!activeFilter) return;
    const parts = [];
    if (currentGroupFilter) parts.push(`Group: ${currentGroupFilter}`);
    if (currentSearchQuery) parts.push(`Search: “${currentSearchQuery}”`);
    if (parts.length === 0) {
      activeFilter.classList.remove('visible');
      activeFilter.textContent = '';
      return;
    }
    activeFilter.classList.add('visible');
    activeFilter.textContent = parts.join(' · ');
  };

  const applyVaultFilters = () => {
    let visible = [...allWords];
    if (currentGroupFilter) {
      visible = visible.filter((word) => (word.groups || []).includes(currentGroupFilter));
    }
    if (currentSearchQuery) {
      const query = currentSearchQuery.toLowerCase();
      visible = visible.filter(
        (word) =>
          (word.word || '').toLowerCase().includes(query) ||
          (word.meaning || '').toLowerCase().includes(query) ||
          (word.mnemonic || '').toLowerCase().includes(query) ||
          (word.context || '').toLowerCase().includes(query) ||
          (word.suggestedGroup || '').toLowerCase().includes(query) ||
          (word.userClues || '').toLowerCase().includes(query) ||
          (word.fullText || '').toLowerCase().includes(query) ||
          (Array.isArray(word.relatedWords) ? word.relatedWords.join(' ') : '')
            .toLowerCase()
            .includes(query)
      );
    }
    if (stats) {
      stats.textContent = `Total ${allWords.length} · Showing ${visible.length}`;
    }
    updateActiveFilterLabel();
    loadGroupsMarkActive();
    renderWordList(visible);
  };

  const loadVault = () => {
    chrome.storage.local.get(['words', 'groups'], (result) => {
      const words = result.words || [];
      allWords = words;
      words.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      if (stats) stats.textContent = `Total ${words.length} · Showing ${words.length}`;

      if (words.length === 0) {
        if (wordList) {
          wordList.innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">📚</div>
              <div class="empty-title">Nothing saved yet</div>
              <div class="empty-sub">Select text on a page → right-click → Save to Word Vault</div>
            </div>
          `;
        }
        if (groupsSection) groupsSection.classList.remove('visible');
        return;
      }

      loadGroups(result.groups || {});
      applyVaultFilters();
    });
  };

  const loadGroupsMarkActive = () => {
    document.querySelectorAll('.group-pill[data-group-name]').forEach((el) => {
      if (el.dataset.groupName === currentGroupFilter) el.classList.add('active-filter');
      else el.classList.remove('active-filter');
    });
  };

  const loadGroups = (groups) => {
    const groupsList = document.getElementById('groupsList');
    if (!groupsSection || !groupsList) return;

    const groupNames = Object.keys(groups);
    if (groupNames.length === 0) {
      groupsSection.classList.remove('visible');
      return;
    }

    groupsSection.classList.add('visible');
    groupsList.innerHTML = groupNames
      .map((groupName) => {
        const wordCount = groups[groupName].length;
        return `<button type="button" class="group-pill" data-group-name="${escapeHtml(groupName)}">${escapeHtml(groupName)} <span style="opacity:0.65">(${wordCount})</span></button>`;
      })
      .join('');

    document.querySelectorAll('.group-pill[data-group-name]').forEach((item) => {
      item.addEventListener('click', () => {
        filterByGroup(item.dataset.groupName);
      });
    });
    loadGroupsMarkActive();
  };

  const filterByGroup = (groupName) => {
    currentGroupFilter = currentGroupFilter === groupName ? '' : groupName;
    applyVaultFilters();
  };

  const acceptSuggestedForWord = (wordId) => {
    chrome.storage.local.get(['words', 'groups'], (result) => {
      const words = result.words || [];
      const groups = result.groups || {};
      let changed = false;

      words.forEach((w, idx) => {
        const id = w.id || `${w.word}_${w.dateAdded}_${idx}`;
        if (id !== wordId || !w.suggestedGroup) return;
        if ((w.groups || []).includes(w.suggestedGroup)) return;
        if (!w.groups) w.groups = [];
        w.groups.push(w.suggestedGroup);
        const g = w.suggestedGroup;
        if (!groups[g]) groups[g] = [];
        if (w.id && !groups[g].includes(w.id)) groups[g].push(w.id);
        else if (!w.id) {
          w.id = wordId;
          if (!groups[g].includes(wordId)) groups[g].push(wordId);
        }
        changed = true;
      });

      if (changed) {
        chrome.storage.local.set({ words, groups }, () => loadVault());
      }
    });
  };

  if (wordList) {
    wordList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-accept-suggestion]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      acceptSuggestedForWord(btn.getAttribute('data-accept-suggestion'));
    });
  }

  const toggleSelectionMode = () => {
    selectionMode = !selectionMode;
    const vaultTab = document.getElementById('vaultTab');
    if (!vaultTab) return;

    if (selectionMode) {
      vaultTab.classList.add('selection-mode');
      document.querySelectorAll('.word-checkbox').forEach((cb) => {
        if (cb) cb.style.display = 'block';
      });
      const selectAllBtn = document.getElementById('selectAllBtn');
      if (selectAllBtn) selectAllBtn.textContent = 'Done';
    } else {
      vaultTab.classList.remove('selection-mode');
      selectedWordIds.clear();
      document.querySelectorAll('.word-checkbox').forEach((cb) => {
        if (cb) {
          cb.style.display = 'none';
          cb.checked = false;
        }
      });
      document.querySelectorAll('.word-card').forEach((card) => card.classList.remove('selected'));
      const selectAllBtn = document.getElementById('selectAllBtn');
      if (selectAllBtn) selectAllBtn.textContent = 'Select';
    }
    updateSelectionUI();
    applyVaultFilters();
  };

  const updateSelectionUI = () => {
    const selectedCount = document.getElementById('selectedCount');
    if (selectedCount) selectedCount.textContent = `${selectedWordIds.size} selected`;
  };

  const selectAll = () => {
    if (selectedWordIds.size === allWords.length) {
      selectedWordIds.clear();
      document.querySelectorAll('.word-checkbox').forEach((cb) => {
        cb.checked = false;
        cb.closest('.word-card').classList.remove('selected');
      });
    } else {
      allWords.forEach((word, index) => {
        const wordId = word.id || `${word.word}_${word.dateAdded}_${index}`;
        selectedWordIds.add(wordId);
        const esc = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(wordId) : wordId.replace(/"/g, '\\"');
        const row = document.querySelector(`.word-card[data-word-id="${esc}"]`);
        const checkbox = row && row.querySelector('.word-checkbox');
        if (checkbox) {
          checkbox.checked = true;
          row.classList.add('selected');
        }
      });
    }
    updateSelectionUI();
  };

  const groupSelected = () => {
    if (selectedWordIds.size === 0) {
      alert('Select at least one card to group.');
      return;
    }

    const groupName = prompt('Group name:');
    if (!groupName || !groupName.trim()) return;

    chrome.storage.local.get(['words', 'groups'], (result) => {
      const words = result.words || [];
      const groups = result.groups || {};

      selectedWordIds.forEach((wordId) => {
        const wordIndex = words.findIndex((w, idx) => {
          const id = w.id || `${w.word}_${w.dateAdded}_${idx}`;
          return id === wordId;
        });
        if (wordIndex !== -1) {
          if (!words[wordIndex].groups) words[wordIndex].groups = [];
          if (!words[wordIndex].groups.includes(groupName)) {
            words[wordIndex].groups.push(groupName);
          }
          if (!words[wordIndex].id) words[wordIndex].id = wordId;
        }
      });

      if (!groups[groupName]) groups[groupName] = [];
      selectedWordIds.forEach((wordId) => {
        if (!groups[groupName].includes(wordId)) groups[groupName].push(wordId);
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
      alert('Select at least one card to delete.');
      return;
    }

    if (!confirm(`Delete ${selectedWordIds.size} card(s)? This cannot be undone.`)) return;

    chrome.storage.local.get(['words', 'groups'], (result) => {
      let words = result.words || [];
      const groups = result.groups || {};

      words = words.filter((word, index) => {
        const wordId = word.id || `${word.word}_${word.dateAdded}_${index}`;
        if (!word.id) word.id = wordId;
        return !selectedWordIds.has(wordId);
      });

      Object.keys(groups).forEach((groupName) => {
        groups[groupName] = groups[groupName].filter((id) => !selectedWordIds.has(id));
        if (groups[groupName].length === 0) delete groups[groupName];
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
          loadVault();
        });
      } else {
        alert('That group already exists.');
      }
    });
  };

  const exportAsMarkdown = () => {
    chrome.storage.local.get(['words'], (result) => {
      const words = result.words || [];

      if (words.length === 0) {
        alert('Nothing to export yet.');
        return;
      }

      words.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

      const markdown = words
        .map((word) => {
          const entryType = word.entryType || 'term';
          const fullText = word.fullText || '';
          const displayTitle = word.displayTitle || buildDisplayTitle(fullText || word.word || '', entryType);
          const lines = [`## ${displayTitle || 'Untitled'}`, '', `**Type:** ${entryType === 'note' ? 'Note/Proof' : 'Word/Phrase'}`, `**Date:** ${formatDate(word.dateAdded)}`, ''];

          if (entryType === 'note' && fullText) {
            lines.push(`**Saved text:** ${fullText}`);
            lines.push('');
          }

          if (word.groups && word.groups.length) {
            lines.push(`**Groups:** ${word.groups.join(', ')}`);
            lines.push('');
          }
          if (word.suggestedGroup && !(word.groups || []).includes(word.suggestedGroup)) {
            lines.push(`*Suggested group:* ${word.suggestedGroup}`);
            lines.push('');
          }
          if (word.meaning) {
            lines.push(`*Definition:* ${word.meaning}`);
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
          if (word.userClues) {
            lines.push(`**Recall clues:** ${word.userClues}`);
            lines.push('');
          }
          if (word.relatedWords && word.relatedWords.length) {
            lines.push(`**Same family:** ${word.relatedWords.join(', ')}`);
            lines.push('');
          }
          if (word.sourceUrl) {
            lines.push(`[Source](${word.sourceUrl})`);
            lines.push('');
          }

          lines.push('---', '');
          return lines.join('\n');
        })
        .join('\n');

      const header = `# Word Vault\n\nExported ${formatDate(new Date().toISOString())}\n\n---\n\n`;
      const blob = new Blob([header + markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `word-vault-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const clearAll = () => {
    if (confirm('Clear every saved word? This cannot be undone.')) {
      chrome.storage.local.set({ words: [], groups: {} }, () => loadVault());
    }
  };

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
      if (!selectionMode) toggleSelectionMode();
      selectAll();
    });
  }

  if (groupBtn) groupBtn.addEventListener('click', groupSelected);
  if (deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', deleteSelected);
  if (cancelSelectionBtn)
    cancelSelectionBtn.addEventListener('click', () => {
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

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = (e.target.value || '').trim();
      applyVaultFilters();
    });
  }

  if (useSuggestedBtn) {
    useSuggestedBtn.addEventListener('click', () => {
      if (pendingSuggestion) groupsForSave = [pendingSuggestion];
    });
  }
  if (clearGroupChoiceBtn) {
    clearGroupChoiceBtn.addEventListener('click', () => {
      groupsForSave = [];
    });
  }
  if (customGroupBtn) {
    customGroupBtn.addEventListener('click', () => {
      const name = prompt('Custom group name:');
      if (!name || !name.trim()) return;
      groupsForSave = [name.trim()];
    });
  }

  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      tabContents.forEach((content) => {
        content.classList.remove('active');
        if (content.id === targetTab + 'Tab') content.classList.add('active');
      });
      if (targetTab === 'vault') loadVault();
    });
  });

  const wordInput = document.getElementById('wordInput');
  const mnemonicInput = document.getElementById('mnemonicInput');
  const contextInput = document.getElementById('contextInput');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');
  const baselineMeaning = document.getElementById('baselineMeaning');
  const baselineToggle = document.getElementById('baselineToggle');
  const baselineArrow = document.getElementById('baselineArrow');

  let currentMeaning = '';

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
    const cleaned = normalizeSelectionText(word);
    const entryType = classifyEntryType(cleaned);
    if (!cleaned) {
      baselineMeaning.textContent = 'Enter a word to fetch a definition';
      baselineMeaning.classList.add('empty');
      currentMeaning = '';
      currentMeaningGlobal = '';
      relatedWordsList = [];
      if (relatedWordsDisplay) {
        relatedWordsDisplay.textContent =
          'Enter a word — we’ll suggest a “same family” list for recall (e.g. boisterous, exuberant, …).';
        relatedWordsDisplay.className = 'related-words-line muted';
      }
      refreshSaveSuggestion();
      return;
    }

    baselineMeaning.textContent = 'Fetching…';
    baselineMeaning.classList.add('empty');
    currentMeaning = '';
    currentMeaningGlobal = '';

    if (entryType === 'note') {
      baselineMeaning.textContent = 'Long excerpt detected: dictionary lookup skipped for notes/proofs.';
      currentMeaning = '';
      currentMeaningGlobal = '';
      relatedWordsList = [];
      if (relatedWordsDisplay) {
        relatedWordsDisplay.textContent = 'Same-family words are shown for short words/phrases.';
        relatedWordsDisplay.className = 'related-words-line muted';
      }
      refreshSaveSuggestion();
      return;
    }

    fetchRelatedWords(cleaned);

    fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(cleaned))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data) || !data[0]?.meanings?.length) {
          baselineMeaning.textContent = 'No definition found — you can still save the word.';
          baselineMeaning.classList.add('empty');
          currentMeaning = '';
          currentMeaningGlobal = '';
          fetchRelatedWords(cleaned);
          refreshSaveSuggestion();
          return;
        }

        const firstMeaning = data[0].meanings[0];
        const firstDef = firstMeaning.definitions && firstMeaning.definitions[0]?.definition;
        if (firstDef) {
          currentMeaning = firstDef;
          currentMeaningGlobal = firstDef;
          baselineMeaning.textContent = firstDef;
          baselineMeaning.classList.remove('empty');
        } else {
          baselineMeaning.textContent = 'No definition text in the response';
          baselineMeaning.classList.add('empty');
          currentMeaningGlobal = '';
        }
        refreshSaveSuggestion();
      })
      .catch(() => {
        baselineMeaning.textContent = 'Could not fetch definition (offline or API error)';
        baselineMeaning.classList.add('empty');
        currentMeaningGlobal = '';
        fetchRelatedWords(cleaned);
        refreshSaveSuggestion();
      });
  };

  if (wordInput) {
    wordInput.addEventListener('input', () => {
      groupsForSave = [];
      refreshSaveSuggestion();
    });
  }
  if (mnemonicInput) {
    mnemonicInput.addEventListener('input', () => {
      refreshSaveSuggestion();
    });
  }
  if (contextInput) {
    contextInput.addEventListener('input', () => {
      refreshSaveSuggestion();
    });
  }
  if (userCluesInput) {
    userCluesInput.addEventListener('input', () => {
      refreshSaveSuggestion();
    });
  }

  chrome.storage.local.get(['pendingWord', 'sourceUrl'], (result) => {
    if (result.pendingWord) {
      document.querySelector('[data-tab="save"]')?.click();
      wordInput.value = result.pendingWord;
      contextInput.value = result.sourceUrl || '';
      chrome.storage.local.remove(['pendingWord', 'sourceUrl']);
      fetchBasicMeaning(wordInput.value);
      setTimeout(() => mnemonicInput.focus(), 100);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
            if (response && response.text) {
              document.querySelector('[data-tab="save"]')?.click();
              wordInput.value = response.text;
              fetchBasicMeaning(wordInput.value);
              setTimeout(() => mnemonicInput.focus(), 100);
            }
          });
        }
      });
    }
  });

  const saveWord = () => {
    const rawInput = wordInput.value.trim();
    if (!rawInput) {
      status.textContent = 'Add a word or phrase first';
      status.className = 'status error';
      return;
    }
    const normalizedInput = normalizeSelectionText(rawInput);
    const entryType = classifyEntryType(normalizedInput);
    const displayTitle = buildDisplayTitle(normalizedInput, entryType);

    const suggestion = pendingSuggestion || suggestGroupFromContent({
      word: normalizedInput,
      meaning: currentMeaning,
      context: contextInput.value.trim(),
      mnemonic: mnemonicInput.value.trim(),
      userClues: userCluesInput ? userCluesInput.value.trim() : ''
    });

    const userClues = userCluesInput ? userCluesInput.value.trim() : '';
    const relatedWords = [...relatedWordsList];

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const wordCard = {
        word: normalizedInput,
        fullText: entryType === 'note' ? normalizedInput : '',
        displayTitle,
        entryType,
        meaning: currentMeaning || '',
        mnemonic: mnemonicInput.value.trim(),
        context: contextInput.value.trim() || (tabs[0] ? tabs[0].url : ''),
        sourceUrl: tabs[0] ? tabs[0].url : '',
        groups: [...groupsForSave],
        suggestedGroup: suggestion,
        userClues,
        relatedWords
      };

      saveBtn.disabled = true;
      status.textContent = 'Saving…';
      status.className = 'status';

      chrome.runtime.sendMessage(
        {
          action: 'saveWord',
          ...wordCard
        },
        (response) => {
          saveBtn.disabled = false;
          if (response && response.success) {
            status.textContent = 'Saved';
            status.className = 'status success';
            wordInput.value = '';
            mnemonicInput.value = '';
            contextInput.value = '';
            if (userCluesInput) userCluesInput.value = '';
            currentMeaning = '';
            currentMeaningGlobal = '';
            groupsForSave = [];
            relatedWordsList = [];
            baselineMeaning.textContent = 'Enter a word to fetch a definition';
            baselineMeaning.classList.add('empty');
            suggestedStrip.classList.remove('visible');
            if (relatedWordsDisplay) {
              relatedWordsDisplay.textContent =
                'Enter a word and fetch a definition — we’ll suggest related words for recall.';
              relatedWordsDisplay.className = 'related-words-line muted';
            }
            setTimeout(() => document.querySelector('[data-tab="vault"]')?.click(), 400);
          } else {
            status.textContent = 'Could not save';
            status.className = 'status error';
          }
        }
      );
    });
  };

  if (saveBtn) saveBtn.addEventListener('click', saveWord);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (document.getElementById('saveTab').classList.contains('active')) saveWord();
    }
  });

  if (wordInput) {
    wordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        fetchBasicMeaning(wordInput.value);
        setTimeout(() => mnemonicInput.focus(), 100);
      }
    });
  }

  if (mnemonicInput) {
    mnemonicInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveWord();
      }
    });
  }

  if (contextInput) {
    contextInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveWord();
      }
    });
  }

  setTimeout(() => {
    if (document.getElementById('vaultTab')?.classList.contains('active')) loadVault();
  }, 100);
});
