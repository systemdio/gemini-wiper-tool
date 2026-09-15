"use strict";

const GEMINI_ORIGIN = "https://gemini.google.com";

async function setIconState(tabId, active) {
  const suffix = active ? "" : "_gray";
  await browser.action.setIcon({
    tabId,
    path: {
      16:  `icons/icon16${suffix}.png`,
      32:  `icons/icon32${suffix}.png`,
      48:  `icons/icon48${suffix}.png`,
      128: `icons/icon128${suffix}.png`,
    },
  }).catch(() => {});
}

async function updateIconForTab(tabId) {
  try {
    const tab = await browser.tabs.get(tabId);
    await setIconState(tabId, tab.url?.startsWith(GEMINI_ORIGIN) ?? false);
  } catch (_) {}
}

browser.tabs.onActivated.addListener(({ tabId }) => updateIconForTab(tabId));
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === "complete") updateIconForTab(tabId);
});

async function forwardToContent(tabId, message) {
  try {
    const tab = await browser.tabs.get(tabId);
    if (!tab?.id) return { ok: false, error: "No active tab" };
    const tabUrl = tab.url || "";
    if (!tabUrl.startsWith(GEMINI_ORIGIN) && !tabUrl.startsWith("https://gemini.google.")) {
      return { ok: false, error: "Not on Gemini" };
    }
    if (tab.status !== "complete") {
      return { ok: false, error: "Page still loading" };
    }
    const result = await browser.tabs.sendMessage(tab.id, message);
    return result ?? { ok: false, error: "No response from content script" };
  } catch (e) {
    return { ok: false, error: "Content script not available" };
  }
}

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target === "content") {
    (async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      const result = await forwardToContent(tab?.id, message);
      sendResponse(result);
    })().catch(() => sendResponse({ ok: false, error: "Forward failed" }));
    return true;
  }

  if (message.type === "DELETION_COMPLETE") {
    browser.storage.local.set({
      lastRun: { deleted: message.deleted, errors: message.errors, time: Date.now() },
    }).catch(() => {});
  }
});
