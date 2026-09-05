import { buildDisplayTitle, classifyEntryType, type EntryType } from "@lemma/shared";
import { API_BASE } from "../lib/config.js";
import { clearSession, getSession } from "../lib/auth.js";
import { AuthError, createWord, explainWord } from "../lib/api.js";
import type { Capture } from "../types.js";

const PENDING_KEY = "lemma_pending_capture";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const views = {
  connect: $("connect-view"),
  capture: $("capture-view"),
  empty: $("empty-view"),
};
function show(view: keyof typeof views) {
  for (const [k, el] of Object.entries(views)) el.hidden = k !== view;
}

async function getCapture(): Promise<Capture | null> {
  const stored = await chrome.storage.local.get(PENDING_KEY);
  if (stored[PENDING_KEY]) {
    await chrome.storage.local.remove(PENDING_KEY);
    return stored[PENDING_KEY] as Capture;
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  try {
    const capture = (await chrome.tabs.sendMessage(tab.id, { action: "getCapture" })) as Capture;
    return capture?.text ? capture : null;
  } catch {
    return null;
  }
}

function initConnectView() {
  show("connect");
  $("connect-btn").addEventListener("click", () => {
    chrome.tabs.create({
      url: `${API_BASE}/extension/connect?ext=${chrome.runtime.id}`,
    });
    window.close();
  });
}

async function initCaptureView(capture: Capture, email: string) {
  show("capture");

  const wordInput = $<HTMLInputElement>("word");
  const kindEl = $("kind");
  const sentenceEl = $("sentence");
  const noteEl = $<HTMLTextAreaElement>("note");
  const explanationEl = $("explanation");
  const dictEl = $<HTMLDetailsElement>("dict");
  const dictTextEl = $("dict-text");
  const saveBtn = $<HTMLButtonElement>("save-btn");
  const statusEl = $("status");

  $("account").textContent = email;
  $("signout-btn").addEventListener("click", async () => {
    await clearSession();
    initConnectView();
  });

  let entryType: EntryType = classifyEntryType(capture.text);
  wordInput.value = capture.text;
  kindEl.textContent = entryType === "note" ? "note" : "word";
  sentenceEl.textContent = capture.sentence ? `“…${capture.sentence}…”` : "";
  noteEl.focus();

  wordInput.addEventListener("input", () => {
    entryType = classifyEntryType(wordInput.value);
    kindEl.textContent = entryType === "note" ? "note" : "word";
  });

  let explanation: string | null = null;
  let dictionary: string | null = null;
  try {
    const result = await explainWord({
      text: capture.text,
      sentence: capture.sentence || null,
      page_title: capture.pageTitle || null,
      source_url: capture.url || null,
    });
    explanation = result.explanation;
    dictionary = result.dictionary_definition;
    explanationEl.textContent = explanation ?? "No explanation available — your note still saves.";
    if (dictionary) {
      dictTextEl.textContent = dictionary;
      dictEl.hidden = false;
    }
  } catch (err) {
    if (err instanceof AuthError) return initConnectView();
    explanationEl.textContent = "Could not fetch an explanation. Your note still saves.";
  }

  saveBtn.addEventListener("click", async () => {
    const text = wordInput.value.trim();
    if (!text) {
      statusEl.textContent = "Add a word first";
      statusEl.className = "status error";
      return;
    }
    saveBtn.disabled = true;
    statusEl.className = "status";
    statusEl.textContent = "Saving…";
    try {
      await createWord({
        text,
        entry_type: entryType,
        sentence: capture.sentence || null,
        page_title: capture.pageTitle || null,
        source_url: capture.url || null,
        explanation,
        dictionary_definition: dictionary,
        user_note: noteEl.value.trim() || null,
      });
      statusEl.textContent = `Saved “${buildDisplayTitle(text, entryType)}”`;
      setTimeout(() => window.close(), 700);
    } catch (err) {
      saveBtn.disabled = false;
      if (err instanceof AuthError) return initConnectView();
      statusEl.className = "status error";
      statusEl.textContent = "Could not save";
    }
  });
}

async function main() {
  const session = await getSession();
  if (!session) return initConnectView();

  const capture = await getCapture();
  if (!capture) {
    show("empty");
    return;
  }
  await initCaptureView(capture, session.email ?? "");
}

void main();
