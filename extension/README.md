# Snapshort Chrome Extension

Shorten any URL instantly from your browser toolbar. Powered by [Snapshort](https://snsh.vercel.app).

## Features

- **One-click shorten** — current tab URL is auto-filled when you open the popup
- **Custom alias** — set your own short code (e.g. `my-link`)
- **QR code** — generated automatically for every shortened link
- **Copy to clipboard** — one click to copy the short URL
- **Context menu** — right-click any page, link, or selected URL → "Shorten with Snapshort"
- **Selection detection** — select any URL-shaped text on a page and open the popup; the URL is pre-filled
- **Dashboard link** — jump straight to your Snapshort dashboard (analytics, folders, edit links)

## Loading in Chrome (Developer Mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder (this folder)
5. The Snapshort icon appears in your toolbar — pin it for easy access

## File Structure

```
extension/
├── manifest.json      Manifest V3 — permissions, background, content scripts
├── popup.html         Popup UI (340px wide)
├── popup.js           Popup logic — fetch API, copy, QR, dashboard link
├── background.js      Service worker — context menu registration & click handling
├── content.js         Detects selected URL text on any page
├── icons/
│   ├── icon16.png     Toolbar icon (16×16)
│   ├── icon48.png     Extensions page icon (48×48)
│   └── icon128.png    Chrome Web Store icon (128×128)
└── README.md          This file
```

## Configuration

The production URL is set in **two places**. If you deploy Snapshort to a different domain, update both:

| File | Variable |
|---|---|
| `popup.js` line 1 | `const BASE_URL = "https://snsh.vercel.app"` |
| `background.js` line 1 | `const BASE_URL = "https://snsh.vercel.app"` |
| `manifest.json` | `host_permissions` array |

## Permissions Used

| Permission | Why |
|---|---|
| `activeTab` | Read the current tab's URL to auto-fill the input |
| `storage` | Pass a pre-filled URL from the context menu / content script to the popup |
| `contextMenus` | Add "Shorten with Snapshort" to the right-click menu |
| `host_permissions: snsh.vercel.app` | Make API calls to the Snapshort backend |
| `host_permissions: api.qrserver.com` | Fetch QR code images |

## Authentication

The extension calls the `/api/shorten` endpoint as a **guest** (no sign-in required). Shortened links created this way are stored without an owner. To attach links to your account and access analytics, click **Open Dashboard →** in the popup to sign in on the Snapshort website.

## Replacing the Icons

The bundled icons are indigo→violet gradient placeholders (valid PNGs). To use custom icons:

1. Create 16×16, 48×48, and 128×128 PNG files
2. Replace `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`
3. Reload the extension in `chrome://extensions`

## Publishing to the Chrome Web Store

1. Zip the entire `extension/` folder (not the parent)
2. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Pay the one-time $5 developer fee (if not already registered)
4. Upload the ZIP, fill in the store listing, and submit for review
