A personal semantic memory system for capturing words you encounter while reading.

## Philosophy

Zero friction beats feature richness. If saving a word takes more than 2 seconds, you'll stop using it.

## How It Works

1. **Select a word** while reading (web page or PDF in browser)
2. **Press `Ctrl+Shift+S`** (or `Cmd+Shift+S` on Mac)
3. **Quick entry popup** opens with:
   - Word (auto-filled)
   - Meaning (you type)
   - How I remember it (your mnemonic)
   - Context (optional)
4. **Press Enter** → saved locally

## Installation

1. **Create icons** (required):
   - Create three PNG files: `icon16.png`, `icon48.png`, `icon128.png`
   - Or use any 16x16, 48x48, and 128x128 pixel images
   - Quick option: Use an online icon generator or create simple colored squares

2. **Load extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select this folder

## Usage

- **Keyboard shortcut**: `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac) after selecting text
- **Manual entry**: Click extension icon → enter word manually
- **Data storage**: All words stored locally in Chrome storage (your data stays yours)

## Data Export

Your words are stored in Chrome's local storage. To export:

1. Open Chrome DevTools (F12)
2. Go to Application → Storage → Local Storage
3. Find your extension's storage
4. Export the `words` array as JSON

## Future Phases

- Phase 2: Daily recall view
- Phase 3: PDF support (via browser)
- Phase 4: Web app + sync (only if needed)

## For Personal Use

This is built for speed and personal use. No auth, no servers, no complexity. Just fast word capture.

