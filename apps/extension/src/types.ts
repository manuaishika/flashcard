export interface Capture {
  text: string;
  sentence: string;
  pageTitle: string;
  url: string;
}

export type ContentMessage = { action: "getCapture" };

export type RuntimeMessage =
  | { action: "capturedForPopup"; capture: Capture }
  | { action: "popupReady" };
