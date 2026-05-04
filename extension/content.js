// Detect when the user selects text that looks like a URL and forward it to
// the popup so the URL field is pre-filled automatically.

let debounceTimer = null;

document.addEventListener("mouseup", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const selection = window.getSelection()?.toString().trim() ?? "";
    if (selection && isValidUrl(selection)) {
      chrome.runtime.sendMessage({ type: "URL_SELECTED", url: selection }).catch(() => {
        // Popup is not open — nothing to do.
      });
    }
  }, 250);
});

function isValidUrl(text) {
  if (!text.startsWith("http://") && !text.startsWith("https://")) return false;
  try {
    const url = new URL(text);
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}
