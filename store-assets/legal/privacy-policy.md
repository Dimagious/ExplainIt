# Privacy Policy for ExplainIt! Chrome Extension

**Last Updated:** January 6, 2026

## Introduction

ExplainIt! ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use our Chrome extension.

## Information We Collect

### Text You Select
When you use ExplainIt!, we process the text you explicitly select on webpages to generate explanations. This text is:
- Sent to our secure backend server
- Forwarded to OpenAI API for processing
- **Not stored** after the explanation is generated
- **Not used** for any purpose other than generating your explanation

### Settings and Preferences
We store your preferences locally using Chrome's Storage API:
- Preferred language (English/Russian)
- Preferred complexity level (Simple/Kid/Expert)

These settings are stored locally on your device and synced across your Chrome browsers if you're signed in to Chrome. We do not have access to these settings.

## Information We Do NOT Collect

We explicitly do NOT collect:
- ❌ Browsing history
- ❌ Personal identification information
- ❌ Email addresses or account information
- ❌ Cookies or tracking data
- ❌ Location data
- ❌ Device information
- ❌ Analytics or usage statistics
- ❌ The content of pages you visit (only text you explicitly select)

## How We Use Information

The selected text you send is used solely to:
1. Generate an AI-powered explanation
2. Return that explanation to you immediately

We do not:
- Store your selected text
- Use it to train AI models
- Share it with third parties (except OpenAI for processing)
- Create user profiles

## Third-Party Services

### OpenAI
We use OpenAI's API (GPT-4o-mini model) to generate explanations. When you request an explanation:
- Your selected text is sent to OpenAI
- OpenAI processes the request and returns an explanation
- OpenAI's privacy policy applies to their processing: https://openai.com/privacy

OpenAI does not use data submitted via API for training their models (as per their API data usage policy).

## Data Security

We implement security measures to protect your information:
- ✅ HTTPS encryption for all communications
- ✅ API keys stored securely on backend (never in extension)
- ✅ Input sanitization to prevent malicious content
- ✅ Rate limiting to prevent abuse
- ✅ No persistent storage of user data

## Data Retention

- **Selected text**: Not retained. Processed and immediately discarded.
- **Explanations**: Not retained on our servers. Displayed only in your browser.
- **Settings**: Stored locally on your device via Chrome Storage API.

## Your Rights

You have the right to:
- **Access**: View your stored settings in Chrome extension settings
- **Delete**: Remove the extension to delete all local data
- **Opt-out**: Simply don't use the extension

## Children's Privacy

ExplainIt! is suitable for users of all ages. We do not knowingly collect personal information from children. The extension processes text to generate explanations regardless of user age, without collecting any personal data.

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify users of any material changes by updating the "Last Updated" date at the top of this policy.

## Contact Us

If you have questions about this Privacy Policy, please contact us at:

📧 Email: dimasta7@gmail.com

## Permissions Explained

Our extension requests the following permissions:

| Permission | Why We Need It |
|------------|----------------|
| `activeTab` | To detect text selection on the current page |
| `storage` | To save your language and tone preferences |
| `host_permissions` | To communicate with our backend API |

We request only the minimum permissions necessary for the extension to function.

---

© 2026 ExplainIt! All rights reserved.

