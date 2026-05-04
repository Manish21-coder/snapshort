const BASE_URL = "https://snsh.vercel.app";

const elUrl       = document.getElementById("url");
const elAlias     = document.getElementById("alias");
const elShorten   = document.getElementById("btn-shorten");
const elCopy      = document.getElementById("btn-copy");
const elDashboard = document.getElementById("btn-dashboard");
const elError     = document.getElementById("error");
const elResult    = document.getElementById("result");
const elShortText = document.getElementById("short-url-text");
const elQR        = document.getElementById("qr");

// ── 1. Auto-fill current tab URL ───────────────────────────────────────────

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab?.url && !elUrl.value) {
    elUrl.value = tab.url;
  }
});

// ── 2. Pick up URL pre-filled by context menu / content script ─────────────

chrome.storage.local.get("pendingUrl", ({ pendingUrl }) => {
  if (pendingUrl) {
    elUrl.value = pendingUrl;
    chrome.storage.local.remove("pendingUrl");
  }
});

// ── 3. Listen for URL sent by content.js (selected text) ──────────────────

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "URL_SELECTED" && msg.url) {
    elUrl.value = msg.url;
  }
});

// ── 4. Shorten ─────────────────────────────────────────────────────────────

elShorten.addEventListener("click", shorten);
elUrl.addEventListener("keydown", (e) => { if (e.key === "Enter") shorten(); });

async function shorten() {
  const url   = elUrl.value.trim();
  const alias = elAlias.value.trim();

  if (!url) { showError("Please enter a URL."); return; }

  setLoading(true);
  hideError();
  hideResult();

  try {
    const body = { originalUrl: url };
    if (alias) body.alias = alias;

    const res  = await fetch(`${BASE_URL}/api/shorten`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || "Failed to shorten URL.");
      return;
    }

    const shortUrl = `${BASE_URL}/${data.data.shortCode}`;
    showResult(shortUrl);

  } catch {
    showError("Network error — check your connection.");
  } finally {
    setLoading(false);
  }
}

// ── 5. Copy ────────────────────────────────────────────────────────────────

elCopy.addEventListener("click", () => {
  const text = elShortText.textContent;
  navigator.clipboard.writeText(text).then(() => {
    elCopy.textContent = "Copied ✓";
    elCopy.classList.add("copied");
    setTimeout(() => {
      elCopy.textContent = "Copy";
      elCopy.classList.remove("copied");
    }, 2000);
  });
});

// ── 6. Open Dashboard ──────────────────────────────────────────────────────

elDashboard.addEventListener("click", () => {
  chrome.tabs.create({ url: `${BASE_URL}/dashboard` });
  window.close();
});

// ── Helpers ────────────────────────────────────────────────────────────────

function showResult(shortUrl) {
  elShortText.textContent = shortUrl;
  elQR.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shortUrl)}&size=128x128&bgcolor=ffffff&color=000000&margin=4`;
  elResult.classList.remove("hidden");
}

function hideResult() {
  elResult.classList.add("hidden");
}

function showError(msg) {
  elError.textContent = msg;
  elError.classList.remove("hidden");
}

function hideError() {
  elError.classList.add("hidden");
}

function setLoading(on) {
  elShorten.disabled = on;
  elShorten.textContent = on ? "Shortening…" : "Shorten →";
}
