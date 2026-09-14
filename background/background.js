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

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target === "content") {
    browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (!tab?.id) return sendResponse({ ok: false, error: "Aucun onglet actif" });
      browser.tabs.sendMessage(tab.id, message)
        .then(sendResponse)
        .catch(e => sendResponse({ ok: false, error: e.message }));
    });
    return true;
  }

  if (message.type === "DELETION_COMPLETE") {
    browser.storage.local.set({
      lastRun: { deleted: message.deleted, errors: message.errors, time: Date.now() },
    }).catch(() => {});
  }
});
