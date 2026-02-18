# Privacy Policy for ExplainIt! Chrome Extension

**Last Updated:** February 18, 2026

## Introduction

ExplainIt! is a Chrome extension that generates explanations for text you explicitly select.
We aim to minimize data collection and clearly explain what is processed.

## How the Extension Works

ExplainIt! works in direct provider mode:
- Selected text is sent from the extension to the AI provider chosen by the user.

## Information Processed

### Selected Text
When you request an explanation:
- The selected text is sent to your selected AI provider.
- The provider returns the explanation to your extension.
- We do not store this text ourselves.

### Settings and API Keys
We use Chrome extension storage:
- `chrome.storage.local`: selected provider + provider API keys
- `chrome.storage.sync`: language + tone preferences

We do not have direct access to your browser storage values.

## Information We Do NOT Collect

We do not collect:
- Browsing history
- Identity/account data
- Location data
- Cookies or tracking identifiers
- Analytics telemetry from extension usage

## Third-Party Providers

Your selected provider processes the selected text under their own terms and privacy policy.
Supported providers include OpenAI, Anthropic, Google Gemini, and Groq.

Reference links:
- OpenAI: https://openai.com/privacy
- Anthropic: https://www.anthropic.com/privacy
- Google: https://policies.google.com/privacy
- Groq: https://groq.com/privacy-policy

## Security

- Provider requests use HTTPS
- API keys are kept in local extension storage (not sync by default)
- UI rendering uses safe text handling

## Data Retention

- Selected text: processed for request/response, not retained by us
- Explanations: shown in your browser
- Settings: stored in browser extension storage until changed/removed

## Permissions Explained

| Permission | Why We Need It |
|------------|----------------|
| `storage` | Save provider, API keys, and preferences |
| `host_permissions` | Access only supported AI provider APIs |

## Your Rights and Control

You can:
- Change provider and preferences at any time
- Remove API keys from settings
- Uninstall extension to remove local extension data

## Contact

Email: dimasta7@gmail.com
