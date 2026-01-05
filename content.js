// Content script - runs on every page
// Captures selected text and communicates with popup

let selectedText = '';

// Listen for text selection
document.addEventListener('mouseup', () => {
  const selection = window.getSelection().toString().trim();
  if (selection && selection.length > 0 && selection.length < 50) {
    selectedText = selection;
  }
});

// Listen for keyboard shortcut from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    const selection = window.getSelection().toString().trim();
    sendResponse({ text: selection || selectedText });
  }
  return true;
});

