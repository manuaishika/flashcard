// Content script - runs on every page
// Captures selected text and communicates with popup

let selectedText = '';
let saveChip = null;
let saveChipHideTimer = null;

const WORD_PATTERN = /^[A-Za-z][A-Za-z'-]{0,48}$/;

function isEditableElement(element) {
  if (!element) return false;
  if (element.isContentEditable) return true;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function removeSaveChip() {
  if (saveChip && saveChip.parentNode) {
    saveChip.parentNode.removeChild(saveChip);
  }
  saveChip = null;
  if (saveChipHideTimer) {
    clearTimeout(saveChipHideTimer);
    saveChipHideTimer = null;
  }
}

function scheduleSaveChipHide() {
  if (saveChipHideTimer) clearTimeout(saveChipHideTimer);
  saveChipHideTimer = setTimeout(() => {
    removeSaveChip();
  }, 2500);
}

function extractWordFromPoint(x, y) {
  let range = null;

  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  } else if (document.caretPositionFromPoint) {
    const caretPos = document.caretPositionFromPoint(x, y);
    if (caretPos) {
      range = document.createRange();
      range.setStart(caretPos.offsetNode, caretPos.offset);
      range.collapse(true);
    }
  }

  if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) {
    return '';
  }

  const textNode = range.startContainer;
  const text = textNode.textContent || '';
  const offset = range.startOffset;
  if (!text || offset < 0 || offset > text.length) return '';

  let start = offset;
  let end = offset;
  while (start > 0 && /[A-Za-z'-]/.test(text[start - 1])) start -= 1;
  while (end < text.length && /[A-Za-z'-]/.test(text[end])) end += 1;

  const raw = text.slice(start, end).trim();
  if (!WORD_PATTERN.test(raw)) return '';
  return raw;
}

function showSaveChip(word, x, y) {
  removeSaveChip();

  saveChip = document.createElement('button');
  saveChip.type = 'button';
  saveChip.textContent = 'Save to Vault';
  saveChip.style.position = 'fixed';
  saveChip.style.left = `${Math.min(x + 12, window.innerWidth - 130)}px`;
  saveChip.style.top = `${Math.min(y + 12, window.innerHeight - 42)}px`;
  saveChip.style.zIndex = '2147483647';
  saveChip.style.background = '#4A90E2';
  saveChip.style.color = '#fff';
  saveChip.style.border = 'none';
  saveChip.style.borderRadius = '14px';
  saveChip.style.padding = '7px 11px';
  saveChip.style.fontSize = '12px';
  saveChip.style.fontFamily = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  saveChip.style.cursor = 'pointer';
  saveChip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.18)';

  saveChip.addEventListener('mouseenter', () => {
    if (saveChipHideTimer) clearTimeout(saveChipHideTimer);
  });
  saveChip.addEventListener('mouseleave', () => {
    scheduleSaveChipHide();
  });
  saveChip.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    chrome.runtime.sendMessage({ action: 'openSavePopup', word });
    removeSaveChip();
  });

  document.body.appendChild(saveChip);
  scheduleSaveChipHide();
}

// Listen for text selection
document.addEventListener('mouseup', () => {
  const selection = window.getSelection().toString().trim();
  if (selection && selection.length > 0 && selection.length < 50) {
    selectedText = selection;
  }
});

// Single-click word capture: show quick "Save to Vault" chip
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!target) return;

  if (saveChip && (target === saveChip || saveChip.contains(target))) {
    return;
  }

  if (isEditableElement(target)) {
    removeSaveChip();
    return;
  }

  if (window.getSelection().toString().trim()) {
    removeSaveChip();
    return;
  }

  const word = extractWordFromPoint(event.clientX, event.clientY);
  if (!word) {
    removeSaveChip();
    return;
  }

  showSaveChip(word, event.clientX, event.clientY);
}, true);

document.addEventListener('scroll', () => {
  removeSaveChip();
}, true);

// Listen for keyboard shortcut from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    const selection = window.getSelection().toString().trim();
    sendResponse({ text: selection || selectedText });
  }
  return true;
});

