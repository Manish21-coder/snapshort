const BASE_URL = "https://snsh.vercel.app";

// ── Register context menus on install ──────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "shorten-page",
    title: "Shorten this page with Snapshort",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "shorten-link",
    title: "Shorten this link with Snapshort",
    contexts: ["link"],
  });

  chrome.contextMenus.create({
    id: "shorten-selection",
    title: "Shorten selected URL with Snapshort",
    contexts: ["selection"],
  });
});

// ── Handle context menu clicks ─────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener((info, tab) => {
  let url = "";

  switch (info.menuItemId) {
    case "shorten-link":
      url = info.linkUrl || "";
      break;
    case "shorten-selection":
      url = (info.selectionText || "").trim();
      break;
    case "shorten-page":
      url = tab?.url || "";
      break;
  }

  if (!url) return;

  // Store URL so popup.js can read it on open
  chrome.storage.local.set({ pendingUrl: url }, () => {
    // chrome.action.openPopup() requires Chrome 127+ and a user gesture.
    // It works from context menu clicks; fall back to a popup window for older Chrome.
    chrome.action.openPopup().catch(() => {
      chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type: "popup",
        width: 380,
        height: 530,
        focused: true,
      });
    });
  });
});
