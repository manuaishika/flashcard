# Phase 1 Setup: Google Docs Integration

This is your **personal v0** - one-time setup, then seamless capture forever.

---

## Step 1: Create Your Word Vault Google Doc

1. Go to [Google Docs](https://docs.google.com)
2. Create a new document
3. Name it **"Word Vault"** (or whatever you want)
4. **Copy the Document ID from the URL**:
   - URL looks like: `https://docs.google.com/document/d/DOCUMENT_ID/edit`
   - Copy the `DOCUMENT_ID` part
   - Example: `1a2b3c4d5e6f7g8h9i0j`

---

## Step 2: Create Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Click **"New Project"**
3. Name it **"Word Vault Appender"**
4. **Delete the default code** and paste this:

```javascript
const DOC_ID = 'PASTE_YOUR_DOCUMENT_ID_HERE';  // From Step 1

function doPost(e) {
  try {
    const doc = DocumentApp.openById(DOC_ID);
    const body = doc.getBody();
    
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents || '{}');
    
    // Format the entry exactly like you want
    const lines = [
      `Word: ${data.word || ''}`,
      `Auto explanation: ${data.meaning || ''}`,
      `My understanding: ${data.mnemonic || ''}`,
      `Context: ${data.context || ''}`,
      `Date: ${data.dateAdded || new Date().toISOString().slice(0, 10)}`,
      '---',
      ''
    ];
    
    // Append to the document
    body.appendParagraph(lines.join('\n'));
    
    return ContentService.createTextOutput('OK');
  } catch (error) {
    return ContentService.createTextOutput('Error: ' + error.toString());
  }
}
```

5. **Replace `PASTE_YOUR_DOCUMENT_ID_HERE`** with your actual Document ID from Step 1
6. Click **"Save"** (Ctrl+S or Cmd+S)

---

## Step 3: Deploy as Web App

1. Click **"Deploy"** → **"New deployment"**
2. Click the **gear icon** ⚙️ next to "Select type"
3. Choose **"Web app"**
4. Configure:
   - **Description**: "Word Vault API"
   - **Execute as**: **Me**
   - **Who has access**: **Anyone** (this is safe - the URL is secret)
5. Click **"Deploy"**
6. **Copy the Web App URL** that appears (looks like: `https://script.google.com/macros/s/.../exec`)

---

## Step 4: Configure Extension

1. Open the extension popup (click the icon)
2. Open Chrome DevTools (F12) → Console tab
3. Run this command (replace `YOUR_WEB_APP_URL` with the URL from Step 3):

```javascript
chrome.storage.local.set({ googleScriptUrl: 'YOUR_WEB_APP_URL' }, () => {
  console.log('Google Script URL saved!');
});
```

4. **Reload the extension**:
   - Go to `chrome://extensions/`
   - Click the refresh icon on your extension

---

## Test It

1. Go to any webpage
2. **Highlight a word**
3. **Right-click → "Save to Word Vault"**
4. The popup opens:
   - Word is pre-filled ✓
   - Meaning auto-fetches in background ✓
   - Cursor is in "My Understanding" ✓
5. Type your note
6. Click **Save** or press **Ctrl+Enter**
7. Open your Google Doc → **Your entry should appear!**

---

## Troubleshooting

**"Saved locally (Google Docs not configured)"**
- The Web App URL wasn't saved correctly
- Repeat Step 4

**"Error saving"**
- Check that the Document ID is correct in Apps Script
- Make sure you deployed as "Web app" (not just saved)
- Check Apps Script execution log: View → Execution log

**Meaning doesn't auto-fetch**
- Check your internet connection
- The dictionary API might be slow - wait a moment
- If it fails, you can just type your own

---

## Why This Works

- **Google Doc = your database** - visible, searchable, permanent
- **Apps Script = thin API layer** - converts extension → Doc format
- **Extension = capture tool** - zero friction, auto-fetching

Once set up, you never think about it again. Just right-click, type, save.

---

## Phase 2 Preview (Future)

When you're ready for friends/users:
- Replace Apps Script with your own backend
- Auto-create Docs via Google Docs API
- Users never see any of this setup

But for now, this is **exactly what you need**: personal, visible, permanent.
