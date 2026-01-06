# Chrome Web Store Submission Assets

This folder contains all materials needed for Chrome Web Store submission.

## 📁 Structure

```
store-assets/
├── screenshots/           # Extension screenshots (1280x800 or 640x400)
│   ├── screenshot-1.png   # Text selection + icon
│   ├── screenshot-2.png   # Inline popup with explanation
│   ├── screenshot-3.png   # Different tone/language
│   └── screenshot-4.png   # Settings popup
├── promo/                 # Promotional images
│   ├── promo-small.png    # 440x280 (small tile)
│   └── promo-marquee.png  # 1400x560 (marquee)
├── description/           # Store listing text
│   ├── short-description.txt   # ≤132 characters
│   └── full-description.txt    # ≤16,000 characters
└── legal/
    └── privacy-policy.md  # Privacy policy (host on public URL)
```

## ✅ Submission Checklist

### Required
- [ ] Screenshots (1-5, PNG/JPG, 1280x800 or 640x400)
- [ ] Short description (≤132 chars) ✅
- [ ] Full description (≤16,000 chars) ✅
- [ ] Privacy policy URL (host privacy-policy.md somewhere public)
- [ ] Extension ZIP file

### Recommended
- [ ] Small promo tile (440x280 PNG)
- [ ] Marquee promo tile (1400x560 PNG)
- [ ] Demo video (YouTube URL)

## 📸 Screenshot Guidelines

1. **screenshot-1**: Show text selection with the floating icon appearing
2. **screenshot-2**: Show the inline popup with an explanation displayed
3. **screenshot-3**: Show different tone or language setting
4. **screenshot-4**: Show the settings popup from toolbar

### How to capture:
```bash
# On Mac, use Cmd+Shift+4 then Space to capture window
# Resize to 1280x800 using Preview or sips:
sips -z 800 1280 screenshot.png --out screenshot-resized.png
```

## 🌐 Hosting Privacy Policy

Options for hosting privacy-policy.md:

1. **GitHub Pages** (recommended)
   - Push to a public repo
   - Enable GitHub Pages
   - URL: `https://username.github.io/repo/privacy-policy`

2. **Notion**
   - Create a Notion page
   - Share publicly
   - Copy the public link

3. **Google Docs**
   - Create a Google Doc
   - File → Share → Anyone with link
   - Copy the link

## 📦 Creating Extension ZIP

```bash
cd /Users/dyurkin/projects/ExplainIt
zip -r extension.zip extension/ -x "*.DS_Store" -x "*README*"
```

## 🏪 Chrome Web Store Developer Dashboard

1. Go to: https://chrome.google.com/webstore/devconsole
2. Pay one-time $5 registration fee (if not done)
3. Click "New Item"
4. Upload extension.zip
5. Fill in store listing details
6. Submit for review

## 📋 Store Listing Details

| Field | Value |
|-------|-------|
| **Name** | ExplainIt! |
| **Category** | Productivity |
| **Language** | English (United States) |
| **Visibility** | Public |

---

Created: January 2026

