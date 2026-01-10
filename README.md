# Word Vault

A personal semantic memory system for capturing words you encounter while reading.

## Philosophy

Zero friction beats feature richness. If saving a word takes more than 2 seconds, you'll stop using it.

**This is not a dictionary** — it's a note-taking system with semantic anchors.

The auto-explanation is just scaffolding. **Your understanding is the real artifact.**

## How It Works

1. **Highlight a word** while reading (web page or PDF in browser)
2. **Right-click → "Save to Word Vault"**
3. **Quick entry popup** opens with:
   - Word (auto-filled)
   - **Auto-explanation** (faded, collapsible baseline)
   - **📝 My Understanding** (your mental model, mnemonic, intuition) ← **PRIMARY FOCUS**
   - Context (optional)
4. **Press Ctrl+Enter** → saved to Google Doc

## Design Philosophy

- **Baseline meaning** = disposable, auto-fetched, faded
- **Your understanding** = the real value, prominent, focused
- **Google Doc** = canonical storage (visible, searchable, permanent)
- **Extension** = capture tool (zero friction, no lock-in)

This trains your brain to value your own understanding over dictionary definitions.

## Installation

1. **Generate icons**:
   - Open `generate-icons.html` in your browser
   - Click "Generate Icons"
   - Right-click each canvas and save as:
     - `icon16.png`
     - `icon48.png`
     - `icon128.png`
   - Place them in the project root

2. **Load extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `flashcard` folder (NOT `.vscode` inside it)

## Google Docs Setup (Phase 1)

**This is a one-time setup** to connect to your Word Vault Google Doc.

See **[SETUP.md](SETUP.md)** for detailed instructions.

Quick version:
1. Create a Google Doc
2. Create Google Apps Script (deploy as Web App)
3. Configure extension with the Web App URL
4. Done — never think about it again

If you skip this, words save locally as backup.

## Usage

### Right-Click Capture (Recommended)
1. Highlight word → Right-click → "Save to Word Vault"
2. Popup opens, word pre-filled, meaning auto-fetched
3. Cursor is in "My Understanding" field
4. Type your note → Press **Ctrl+Enter** or click **Save**

### Keyboard Shortcut (Optional)
- `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac) after selecting text

### Manual Entry
- Click extension icon → enter word manually

## Data Storage

### Phase 1 (Now): Google Docs

All entries append to your Google Doc in this format:

```
Word: pedantic
Auto explanation: excessively focused on minor details
My understanding: derails main point to nitpick tiny things
Context: code review article
Date: 2026-01-05
---
```

**Benefits:**
- Visible, searchable, permanent
- No lock-in, you own the doc
- Easy to export, print, share
- Survives device failures, years, everything

### Backup: Local Storage

If Google Docs isn't configured, words save locally in Chrome storage as fallback.

## Future Phases

- **Phase 2**: Daily recall view (simple review of saved words)
- **Phase 3**: Tags, search, filters (only if you feel actual pain)
- **Phase 4**: Web app + sync for friends/users (proper backend)

But only add features when you feel actual need, not theoretical desire.

## For Personal Use (Phase 1)

This is built for speed and personal use. One-time Google Docs setup, then seamless capture forever.

No servers to maintain. No auth to manage. No complexity.

Just: **right-click → type your understanding → save → review in your Doc**.

---

**This is a research-grade personal semantic memory system, not just a tool.**

