# Store screenshot shot-list (1280×800 PNG, 5 slots)

Replace existing screenshot-1...4.png with the new shots below. Drop the
old "screenshot-4-settings" — Settings panels do not belong on a CWS
carousel; they sell configuration, not outcomes.

Use a real third-party article as the source page. **Do NOT** use Wikipedia
("Entropy" or otherwise) — Wikipedia reads as filler/demo content. Prefer:
Bloomberg, arXiv abstract, TechCrunch, Stack Overflow answer, IRS docs,
HackerNews comment, Hacker News linked article — anything that visibly
"earns" the explanation.

---

## Slot 1 — Hero (the most important slot)

**Subject:** A real article (Bloomberg / arXiv / TechCrunch) with one
sentence highlighted, and the floating ExplainIt action bubble visible at
the selection.

**Composition:**
- Full browser chrome at the top (80px)
- Page content fills the rest
- Inline popup overlaid at the selection point

**On-image text:**
- Banner across the top: **"Highlight. Click. Understand."**
- Subcopy: "Any page, any sentence, any time."

---

## Slot 2 — Plain-English result

**Subject:** Same article (or similar dense source), popup open with a clean
3-sentence English explanation.

**Composition:**
- Blur the page behind
- Popup occupies right 40% at 1.1× scale
- Show the original sentence above the explanation

**On-image text:**
- Banner: **"Plain-English explanations in under 2 seconds."**
- Small chip pinned top-left of the popup: "GPT-4o mini · Simple words"

---

## Slot 3 — Multilingual montage (13 languages) — updated for v2.1.0

**Subject:** A central English-source paragraph (Bloomberg / arXiv /
dense news) surrounded by 4–5 small ExplainIt popup cards, each
showing the explanation in a different language with visually distinct
script.

**Languages to feature for script variety:**
- 🇷🇺 Русский (Cyrillic — preserves the killer-feature RU shot)
- 🇨🇳 中文 (Han characters)
- 🇸🇦 العربية (Arabic + right-to-left layout — unique differentiator)
- 🇯🇵 日本語 (mixed kanji + hiragana)
- 🇪🇸 Español (Latin script for familiarity)

**Composition:**
- Central English source paragraph
- 4–5 popup cards arranged around it
- Each card legible at its size
- **Arabic card MUST render RTL** (text aligned right edge)

**On-image text:**
- Banner: **"Read English content in 13 languages."**
- Subcopy: "From a single English source — into your language."

Brief for the design-AI to render this exact slot lives in
[`docs/marketing/DESIGN-AI-BRIEF-2.1.md`](../../docs/marketing/DESIGN-AI-BRIEF-2.1.md).

---

## Slot 4 — Tone comparison (same sentence, two depths)

**Subject:** Same source sentence explained two ways, side-by-side.

**Composition:**
- Two popup cards in the frame
- Top: labeled "Like I'm 5" — larger type, simpler language
- Bottom: labeled "Expert" — denser, preserves jargon
- Background: source page dimmed

**On-image text:**
- Banner: **"Three tones. One click to switch."**
- Caption bottom-right: "Tune the depth — kid-friendly to technical."

---

## Slot 5 — Free setup with Groq

**Subject:** Settings panel with Groq card selected, "Free · No card" badge
visibly highlighted, the green "Validated" key chip visible.

**Composition:**
- Settings panel centered
- Page behind dimmed
- The Groq card subtly elevated/larger than other 3 cards

**On-image text:**
- Banner: **"Free to start. Bring your own key when you outgrow it."**
- Subcopy: "Groq · Llama 3.3 70B · no credit card."

---

## Production notes

- All shots must be 1280×800 PNG (CWS spec).
- Keep file sizes under 1 MB each.
- Russian text in slot 3 must be set in a typographically correct
  Cyrillic font — do not auto-translate visually with Latin-styled text.
- Keep the inline popup styling consistent with what `content.css` and
  `inline-popup.js` actually render — don't over-stylize the mockups.
- Prefer screenshots taken from the actual extension running on the real
  page (capture with DevTools 1280×800 device frame) over Figma mockups.
- Brand blue: #2563EB. Banner text: white on a dark blue (≥ #1E40AF) strip
  for legibility.
