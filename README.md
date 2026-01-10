# Word Vault

A personal semantic memory system for capturing words you encounter while reading.

**This is not a dictionary** — it's a note-taking system with semantic anchors. The auto-explanation is just scaffolding. **Your understanding is the real artifact.**

## How It Works

1. **Highlight any word** while reading (web page or PDF in browser)
2. **Right-click → "Save to Word Vault"**
3. **Popup opens** with:
   - Word (auto-filled)
   - **Auto-explanation** (faded, collapsible baseline)
   - **📝 My Understanding** (your mental model, mnemonic, intuition) ← **PRIMARY FOCUS**
   - Context (optional)
4. **Press Ctrl+Enter** → saved!

**To view your vault:** Click the extension icon → **"Vault" tab** → See all your words

## Features

- **Zero-friction capture** — Right-click any word, save in seconds
- **Auto-fetch definitions** — Baseline meanings fetched automatically
- **Your understanding first** — Focus on your mental model, not dictionary definitions
- **Local storage** — All data stored locally in your browser (export as Markdown anytime)
- **One-click vault access** — Click extension icon → Vault tab → See all your words

## Installation

### From Chrome Web Store (Coming Soon)

This extension will be available on the Chrome Web Store soon.

### Manual Installation (Developer Mode)

1. **Download or clone this repository**
2. **Generate icons** (if needed):
   - Open `generate-icons.html` in your browser
   - Right-click each canvas and save as `icon16.png`, `icon48.png`, `icon128.png`
   - Place them in the project root
3. **Load extension**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `flashcard` folder

## Usage

### Save a Word

**Method 1 (Recommended):** Right-click
1. Highlight a word on any webpage
2. Right-click → **"Save '[word]' to Word Vault"**
3. Popup opens with word pre-filled
4. Type your understanding (optional)
5. Press **Ctrl+Enter** or click **Save**

**Method 2:** Keyboard shortcut
- Select text → Press `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac)

**Method 3:** Manual entry
- Click extension icon → "Save" tab → Enter word manually

### View Your Vault

**Click the extension icon** → **"Vault" tab**

- See all your saved words
- Export as Markdown (download `.md` file)
- Clear all (if needed)

### Export Your Words

1. Click extension icon → **"Vault" tab**
2. Click **"Export"** button
3. Downloads a Markdown file you can open anywhere

## Design Philosophy

- **Baseline meaning** = disposable, auto-fetched, faded
- **Your understanding** = the real value, prominent, focused
- **Local-first** = your data stays in your browser (export anytime)
- **Zero setup** = works immediately, no configuration needed

This trains your brain to value your own understanding over dictionary definitions.

## Data Storage

All words are stored **locally in your browser** using Chrome's storage API. Your data:
- Stays on your device
- Never leaves your browser
- Can be exported as Markdown anytime
- Survives browser restarts

To export: Extension icon → Vault tab → Export button

## Privacy

- **No servers** — Everything runs locally
- **No tracking** — No analytics, no data collection
- **No sync** — Your words stay in your browser
- **Your data, your control**

## Contributing

This is currently a personal project, but contributions are welcome!

## License

MIT License — Feel free to use, modify, and distribute.

---

**Built for people who want to remember words through their own understanding, not dictionary definitions.**
