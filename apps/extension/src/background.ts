import { setSession } from "./lib/auth.js";
import type { Capture } from "./types.js";

const MENU_ID = "lemma-save";
const PENDING_KEY = "lemma_pending_capture";

function createMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Save "%s" to Lemma',
      contexts: ["selection"],
    });
  });
}

chrome.runtime.onInstalled.addListener(createMenu);
chrome.runtime.onStartup.addListener(createMenu);
createMenu();

async function captureFromTab(tabId: number): Promise<Capture | null> {
  try {
    return await chrome.tabs.sendMessage(tabId, { action: "getCapture" });
  } catch {
    return null;
  }
}

async function openPopupWithCapture(tab: chrome.tabs.Tab | undefined, fallbackText: string) {
  let capture: Capture | null = null;
  if (tab?.id) capture = await captureFromTab(tab.id);
  if (!capture && fallbackText) {
    capture = {
      text: fallbackText,
      sentence: "",
      pageTitle: tab?.title ?? "",
      url: tab?.url ?? "",
    };
  }
  if (!capture) return;

  await chrome.storage.local.set({ [PENDING_KEY]: capture });
  await chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: 380,
    height: 560,
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID && info.selectionText) {
    void openPopupWithCapture(tab, info.selectionText.trim());
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "save-word") return;
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    void openPopupWithCapture(tab, "");
  });
});

// Session handoff from the web app's /extension/connect page.
chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message?.type === "lemma-auth" && message.access_token && message.refresh_token) {
    void setSession({
      access_token: message.access_token,
      refresh_token: message.refresh_token,
      expires_at: message.expires_at,
      email: message.email,
    }).then(() => sendResponse({ ok: true }));
    return true;
  }
  sendResponse({ ok: false });
  return false;
});
