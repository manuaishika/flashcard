# Chrome Web Store Publishing Guide

Step-by-step guide to publish Word Vault to the Chrome Web Store.

---

## Prerequisites

1. **Chrome Developer Account**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Sign in with your Google account
   - Pay **one-time $5 registration fee** (if not already registered)
   - Complete your developer profile

2. **Prepare Your Extension**
   - All files must be in a ZIP archive (max 100MB)
   - Icons must be present (16x16, 48x48, 128x128 PNG)
   - Manifest.json must be valid

---

## Step 1: Prepare Your Extension

### Create a ZIP file

1. **Select all files** in your `flashcard` folder:
   - `manifest.json`
   - `background.js`
   - `content.js`
   - `popup.html`
   - `popup.js`
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`
   - `review.html` (optional, if you want it)
   - `review.js` (optional)
   - `generate-icons.html` (exclude - not needed)

2. **Exclude these**:
   - `.git` folder
   - `node_modules` (if any)
   - `.vscode` folder
   - `README.md`, `CHROME_WEB_STORE_GUIDE.md` (docs not needed)
   - `generate-icons.html` (helper file, not needed)

3. **Create ZIP**:
   - Right-click → Send to → Compressed (zipped) folder
   - Name it: `word-vault-v1.0.0.zip`

---

## Step 2: Update Manifest for Chrome Web Store

### Required manifest fields

Your `manifest.json` should have:

```json
{
  "manifest_version": 3,
  "name": "Word Vault",
  "version": "1.0.0",
  "description": "A personal semantic memory system for capturing words you encounter while reading. Right-click any word to save with your understanding.",
  "author": "Your Name",
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "contextMenus"
  ],
  "host_permissions": [
    "http://*/*",
    "https://*/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Word Vault"
  },
  "commands": {
    "save-word": {
      "suggested_key": {
        "default": "Ctrl+Shift+S",
        "mac": "Command+Shift+S"
      },
      "description": "Save selected word to vault"
    }
  },
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  },
  "web_accessible_resources": [
    {
      "resources": ["review.html", "review.js"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

**Important changes for Chrome Web Store:**
- ✅ `description` must be clear and under 132 characters
- ✅ `author` field (optional but recommended)
- ✅ Icons must be present
- ✅ Version format: `X.Y.Z` (semantic versioning)

---

## Step 3: Create Store Listing

### Go to Chrome Web Store Developer Dashboard

1. **Navigate to**: [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. **Click**: "New Item"
3. **Upload**: Your ZIP file (`word-vault-v1.0.0.zip`)
4. **Wait**: Chrome validates your extension (can take a few minutes)

---

## Step 4: Fill Out Store Listing

### Required Information

#### 1. **Detailed Description** (Required)
```
Word Vault is a personal semantic memory system for capturing and organizing words you encounter while reading.

**Features:**
• Right-click any word to save instantly
• Auto-fetch definitions as baseline
• Add your own understanding and mnemonics
• Organize words into groups
• Export as Markdown
• All data stored locally - your privacy protected

**How It Works:**
1. Highlight any word while reading
2. Right-click → "Save to Word Vault"
3. Add your understanding (optional)
4. Organize, group, and export anytime

Perfect for language learners, researchers, and anyone building their vocabulary.
```

#### 2. **Screenshots** (Required - at least 1, recommended 3-5)

**Take screenshots:**
- Screenshot 1: Right-click menu showing "Save 'word' to Word Vault"
- Screenshot 2: Popup showing Save tab with word entry
- Screenshot 3: Vault tab showing all saved words
- Screenshot 4: Selection mode with grouping (optional)
- Screenshot 5: Export feature (optional)

**Requirements:**
- Dimensions: 1280 x 800 or 640 x 400 pixels
- Format: PNG or JPEG
- Max size: 1MB each
- Max 5 screenshots

#### 3. **Small Promotional Tile** (Optional but recommended)
- 440 x 280 pixels
- Shows your extension's value proposition

#### 4. **Promotional Images** (Optional - for featured placement)
- Only if you want to be featured
- Various sizes needed

#### 5. **Category**
- Choose: **Productivity** or **Education**

#### 6. **Language**
- Default: English (en)

#### 7. **Privacy Policy URL** (Required for extensions with permissions)

**Create a simple privacy policy:**
```
Privacy Policy for Word Vault

Word Vault is a local-first extension that stores all your data in your browser's local storage.

**Data Collection:**
• We do NOT collect any personal information
• We do NOT send data to any servers
• We do NOT track your usage
• All words you save are stored locally on your device

**Permissions:**
• storage: To save your words locally
• activeTab: To capture selected text
• scripting: To inject scripts on pages you visit
• contextMenus: To add right-click menu option
• host_permissions: To work on all websites

**Third-Party Services:**
• Dictionary API (dictionaryapi.dev): Used only to fetch word definitions. No data is sent to us.

**Contact:**
If you have questions, contact: [your-email@example.com]

Last updated: [date]
```

**Host it on:**
- GitHub Pages (free)
- Your own website
- Simple HTML page on any free hosting

#### 8. **Single Purpose Declaration** (Required)

**If using `host_permissions: ["http://*/*", "https://*/*"]`:**

You must declare a single purpose:

```
Single Purpose: This extension allows users to save words encountered while reading by right-clicking on selected text. All data is stored locally in the user's browser.
```

---

## Step 5: Submit for Review

### Before Submitting

**Checklist:**
- ✅ ZIP file uploaded successfully
- ✅ All required fields filled
- ✅ Screenshots uploaded
- ✅ Privacy policy URL provided
- ✅ Single purpose declared (if needed)
- ✅ Description is clear and accurate
- ✅ Icons are present and correct

### Submit

1. **Click**: "Submit for Review"
2. **Wait**: Review usually takes **1-3 days** (sometimes longer)
3. **Check**: Your email for status updates

---

## Step 6: After Approval

### Your Extension is Live! 🎉

1. **Share the link**: Users can install from Chrome Web Store
2. **Monitor reviews**: Respond to user feedback
3. **Update regularly**: Fix bugs, add features
4. **Analytics**: Check installs and usage (optional)

---

## Step 7: Updating Your Extension

### To update:

1. **Update version** in `manifest.json`:
   ```json
   "version": "1.0.1"
   ```

2. **Create new ZIP** with updated files

3. **Go to**: Chrome Web Store Developer Dashboard
4. **Click**: Your extension → "Package"
5. **Upload**: New ZIP file
6. **Add notes**: What changed in this version
7. **Submit**: For review (usually faster for updates)

---

## Common Issues & Solutions

### Issue: "Invalid manifest.json"
- **Fix**: Check JSON syntax, ensure all required fields present

### Issue: "Icons missing"
- **Fix**: Make sure all three icon sizes (16, 48, 128) are in the ZIP

### Issue: "Permissions not justified"
- **Fix**: Clearly explain why you need each permission in the description

### Issue: "Privacy policy required"
- **Fix**: Create a simple privacy policy page and add the URL

### Issue: "Host permissions too broad"
- **Fix**: Add single purpose declaration explaining why you need `*/*`

---

## Tips for Success

1. **Clear description**: Explain what your extension does clearly
2. **Good screenshots**: Show the extension in action
3. **Privacy-first**: Emphasize local storage, no data collection
4. **Respond to reviews**: Show you care about users
5. **Regular updates**: Keep improving based on feedback

---

## Resources

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Extension Publishing Documentation](https://developer.chrome.com/docs/webstore/publish/)
- [Manifest V3 Documentation](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

## Quick Checklist

Before submitting, ensure:

- [ ] ZIP file created with all necessary files
- [ ] `manifest.json` is valid and complete
- [ ] Icons (16, 48, 128) are present
- [ ] Screenshots (at least 1, ideally 3-5) are ready
- [ ] Privacy policy URL is ready
- [ ] Description is clear and under 132 characters
- [ ] Single purpose declared (if using broad host_permissions)
- [ ] Extension tested and working
- [ ] Developer account registered ($5 fee paid)

---

**Good luck with your submission! 🚀**

Once approved, your extension will be available to millions of Chrome users worldwide.
