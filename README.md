# ExplainIt! - AI-Powered Text Explanation Chrome Extension

Instant AI explanations for any selected text on a webpage.

## What ExplainIt Does

ExplainIt! is a Chrome Extension that explains selected text in your preferred language and tone.

Current version works in **direct provider mode**:
- OpenAI (GPT-4o mini)
- Anthropic (Claude Haiku)
- Google Gemini (Gemini Flash)
- Groq (Llama 3.3 70B)

## Key Features

- One-click explanation for selected text
- English and Russian output
- Three tones: Simple, Like I'm 5, Expert
- Inline popup UI + toolbar popup
- Per-provider API keys
- First-run setup flow for missing API key
- Copy explanation to clipboard

## Architecture (Current)

```text
Page Selection
   ↓
Content Script + Inline Popup UI
   ↓
Background Service Worker
   ↓
Selected AI Provider API (OpenAI / Anthropic / Gemini / Groq)
```

No dedicated server is required for extension runtime.

## Local Setup

### Prerequisites

- Chrome browser
- Node.js 18+ (for tests only)
- API key from at least one supported provider

### Run Extension Locally

1. Open `chrome://extensions/`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `extension/` folder
5. Open extension Settings and add API key for your provider

### Run Tests

```bash
cd extension
npm ci
npm test
```

## Storage and Security Model

- `chrome.storage.local`:
  - Selected provider
  - Provider API keys
- `chrome.storage.sync`:
  - Language
  - Tone

Security notes:
- API keys are stored locally on the device (not in sync storage)
- Selected text is sent only to the provider chosen by the user
- Output is rendered with safe text handling (`textContent`)

## Manifest Permissions

`extension/manifest.json` requests:
- `storage`
- host permissions only for provider APIs:
  - `https://api.openai.com/*`
  - `https://api.anthropic.com/*`
  - `https://generativelanguage.googleapis.com/*`
  - `https://api.groq.com/*`

## Repository Structure

- `extension/` - active product code
- `extension/tests/` - Jest unit tests for config/background/popup logic
- `store-assets/` - Chrome Web Store text and images
- `privacy-policy.html` - public privacy policy page

## Privacy

- No browsing history collection
- No analytics tracking in extension code
- Only user-selected text is sent for explanation
- Full policy: `privacy-policy.html`

## License

MIT
