# Design-AI brief — 2.1.0 screenshot update

For v2.1.0 (multi-language output release), only **one screenshot needs
to be updated**: slot 3 (`screenshot-3-ru-result.png`). The other four
slots remain accurate and don't need a refresh. Promo tiles also remain
accurate.

Copy the block between the `---` markers below into the design-AI chat.
Self-contained — no repo attachment needed.

When the new file arrives, drop it into BOTH:

  - `docs/marketing/screenshot-3-ru-result.png` (README)
  - `store-assets/screenshots/screenshot-3-ru-result.png` (CWS dashboard upload)

Filename stays the same so nothing in the README markup needs editing.

---

```
Hi — round 3 for ExplainIt!. We just shipped v2.1.0 (multi-language
output: 13 languages, with right-to-left rendering for Arabic). The 5
screenshots you delivered in round 2 still mostly work, but slot 3 is
now misleading. I only need ONE file from you this round.

# What's wrong with current screenshot-3-ru-result.png

The current image shows a single Russian explanation of an English
source. The on-image banner reads:

  "Reads English. Explains in your language.
   English, Russian — more coming."

The "— more coming" subcopy is now obsolete: 11 more languages
(Spanish, Chinese Simplified, Hindi, Arabic, Portuguese, German,
French, Japanese, Korean, Turkish, Vietnamese) shipped in v2.1.0. The
listing visually claims 2 languages while the product supports 13.

# What I need: replacement slot 3 — multilingual montage

Same filename (`screenshot-3-ru-result.png`) so the README and CWS
listing pick it up without any code change.

## Composition

A central English-source paragraph (the Bloomberg / arXiv / dense-news
style you've used in earlier slots is perfect — same visual register),
surrounded by 4–5 small ExplainIt popup cards. Each card shows the
explanation in a different language to demonstrate the 13-language
range with high visual variety.

Suggested languages for the 5 popup cards (script variety matters more
than language popularity — pick scripts that LOOK distinct):

  - 🇷🇺 Русский                    (Cyrillic — keeps the killer-feature shot for RU audience)
  - 🇨🇳 中文 (简体)                  (Han characters — top global visual distinctiveness)
  - 🇸🇦 العربية                     (Arabic + right-to-left layout — unique selling point, no
                                     competitor highlights RTL)
  - 🇯🇵 日本語                       (mixed kanji + hiragana — third visually distinct script)
  - 🇪🇸 Español                     (Latin — anchors familiarity for the global audience)

Each popup card should be small enough that 5 fit comfortably around
the source paragraph, but large enough that the script is legible.

The Arabic card MUST visually render right-to-left — text aligned to
the right edge of the card. This is the single most differentiating
visual in the whole montage.

## On-image text

Banner across the top: **"Read English content in 13 languages."**

Subcopy (small, under the banner): "From a single English source — into
your language."

No "more coming" anywhere — the shipped state is the final state.

## Specs

  - Filename: screenshot-3-ru-result.png (SAME as before — replacement)
  - Format: PNG
  - Dimensions: 1280 × 800
  - File size: ≤ 1 MB
  - Cyrillic, Han, Arabic, kanji/hiragana, Latin scripts must all
    render correctly — proper kerning, no Latin-styled fallback fonts
    for non-Latin scripts.
  - Brand blue: #2563EB
  - Same brand voice as earlier rounds: confident, minimalist,
    no purple gradients, no stock photos.

# What stays unchanged

The other four screenshots and the two promo tiles you delivered in
round 2 are still accurate. Do NOT re-render them:

  - screenshot-1-hero.png            "Highlight. Click. Understand."
  - screenshot-2-en-result.png       "Plain-English explanations…"
  - screenshot-4-tone-compare.png    "Three tones. One click to switch."
  - screenshot-5-free-setup.png      "Free to start. Bring your own key…"
  - promo-small.png
  - promo-marquee.png

Thanks!
```

---

## After the design-AI delivers

```bash
# Replace the single file in both homes:
cp <download-location>/screenshot-3-ru-result.png docs/marketing/screenshot-3-ru-result.png
cp <download-location>/screenshot-3-ru-result.png store-assets/screenshots/screenshot-3-ru-result.png

# Commit:
git add docs/marketing/screenshot-3-ru-result.png store-assets/screenshots/screenshot-3-ru-result.png
git commit -m "docs(marketing): update slot 3 to 13-language montage for v2.1.0"
```

No README edits needed — filename is identical.
