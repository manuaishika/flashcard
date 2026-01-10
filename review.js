// Review page - view and export your word vault

document.addEventListener('DOMContentLoaded', () => {
  const wordList = document.getElementById('wordList');
  const stats = document.getElementById('stats');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  
  const loadWords = () => {
    chrome.storage.local.get(['words'], (result) => {
      const words = result.words || [];
      
      // Update stats
      stats.textContent = `Total words: ${words.length}`;
      
      // Display words
      if (words.length === 0) {
        wordList.innerHTML = `
          <div class="empty">
            <div class="empty-icon">📚</div>
            <div>Your Word Vault is empty</div>
            <div style="margin-top: 10px; font-size: 12px;">Right-click on words while reading to add them</div>
          </div>
        `;
        return;
      }
      
      // Sort by date (newest first)
      words.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      
      wordList.innerHTML = words.map(word => `
        <div class="word-card">
          <div class="word-title">${escapeHtml(word.word || 'Untitled')}</div>
          ${word.meaning ? `<div class="word-meaning">${escapeHtml(word.meaning)}</div>` : ''}
          ${word.mnemonic ? `<div class="word-understanding">${escapeHtml(word.mnemonic)}</div>` : ''}
          ${word.context ? `<div class="word-context">📍 ${escapeHtml(word.context)}</div>` : ''}
          <div class="word-date">${formatDate(word.dateAdded)}</div>
        </div>
      `).join('');
    });
  };
  
  const exportAsMarkdown = () => {
    chrome.storage.local.get(['words'], (result) => {
      const words = result.words || [];
      
      if (words.length === 0) {
        alert('No words to export');
        return;
      }
      
      // Sort by date (newest first)
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
      
      // Create download link
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
        loadWords();
      });
    }
  };
  
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
  
  // Event listeners
  exportBtn.addEventListener('click', exportAsMarkdown);
  clearBtn.addEventListener('click', clearAll);
  
  // Load words on page load
  loadWords();
});
