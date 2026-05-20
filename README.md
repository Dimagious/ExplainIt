# ExplainIt! — AI-Powered Text Explanation Chrome Extension

Highlight any sentence on the web and get a plain-English explanation in seconds. Works free with Groq.

## What ExplainIt Does

ExplainIt! is a Chrome Extension that explains selected text in your preferred language and tone. It runs in **direct provider mode** — your API key, your provider, no middle servers.

Supported providers:

- **Groq (Llama 3.3 70B)** — recommended default · free tier · no card
- Google Gemini (Gemini 1.5 Flash)
- OpenAI (GPT-4o mini)
- Anthropic (Claude 3.5 Haiku)

## Key Features

- One-click explanation for selected text
- English and Russian output (more languages planned in 2.1.0)
- Three tones: Simple, Like I'm 5, Expert
- Inline popup UI + toolbar popup
- Per-provider API keys with client-side prefix validation
- Branched empty-state: "Get free key →" CTA for new users, "Ready · Groq ⚡ · 🇬🇧 English" badge for set-up users
- Typed, helpful error messages — `quota` / `auth` / `rate_limit` / `permission` etc., never the raw truncated provider blurb
- Copy explanation to clipboard

## Architecture

```text
Page Selection
   ↓
Content Script + Inline Popup UI
   ↓
Background Service Worker
   ↓
Selected AI Provider API (Groq / Gemini / OpenAI / Anthropic)
```

No dedicated server is required for extension runtime. Provider hosts are requested **at runtime** (when the user picks a provider and clicks Test key), not at install time — see Manifest Permissions below.

## Local Setup

### Prerequisites

- Chrome browser
- Node.js 18+ (for tests only)
- An API key from one supported provider — Groq is free with no credit card

### Run Extension Locally

1. Open `chrome://extensions/`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `extension/` folder
5. Open the popup. The first-run state will guide you to Groq's free key.

### Run Tests

```bash
cd extension
npm ci
npm test
```

## Storage and Security Model

`chrome.storage.local` (per-install, never synced to Google):

- `provider` — chosen provider id
- `apiKeys` — per-provider key map: `{ groq: '...', openai: '...', ... }`
- `setupCompleted` — sticky boolean, flipped true the first time a key is saved

`chrome.storage.sync` (cross-device preferences):

- `language`
- `tone`

Security notes:

- API keys never enter `chrome.storage.sync` — they live only on the device that pasted them.
- Selected text is sent only to the provider chosen by the user.
- Output is rendered with safe text handling (`textContent`).
- Gemini key is sent via the `x-goog-api-key` header, not in the URL query, so it does not leak into history / proxy logs / DevTools screenshots.
- Anthropic calls set the documented `anthropic-dangerous-direct-browser-access: true` header (Anthropic requires it for browser-origin requests).

## Manifest Permissions

`extension/manifest.json`:

- `permissions: ["storage"]` — silent at install time.
- `optional_host_permissions` for the four provider APIs (`api.openai.com`, `api.anthropic.com`, `generativelanguage.googleapis.com`, `api.groq.com`) — **requested at runtime** when the user actually picks a provider and clicks Test key. This means the install dialog does not list "Read your data on api.openai.com et al." — only the `<all_urls>` content-script permission required for in-page text selection.
- Content scripts on `<all_urls>` — required to detect text selection on any page and inject the inline action bubble.

## Repository Structure

- `extension/` — active product code
- `extension/tests/` — Jest unit tests for config / background / popup / inline-popup
- `store-assets/` — Chrome Web Store text, screenshots, shot list, promo brief, dashboard checklist
- `privacy-policy.html` — public privacy policy page

## Privacy

- No browsing history collection
- No analytics tracking in extension code
- Only user-selected text is sent for explanation
- Full policy: [`privacy-policy.html`](privacy-policy.html)

## License

MIT
