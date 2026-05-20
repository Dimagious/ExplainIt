# Design-AI brief — round 2 assets for ExplainIt!

This is a self-contained brief to send back to the design-AI that
produced the original `handoff_visual_refresh` bundle. Copy the block
between the `---` markers below into the design-AI chat. No repo
attachment needed — the brief is self-contained.

After the design-AI delivers, drop the files into `docs/marketing/`
(for README assets) and `store-assets/screenshots/` + `store-assets/promo/`
(for Chrome Web Store assets).

---

```
Hi — this is round 2 for the ExplainIt! Chrome extension you helped me
with previously. Round 1 (icons + popup empty-state HTML/CSS/JS) shipped
cleanly — the "Aa" tile icon you produced is now live in the extension
toolbar and inside the popup header. Thank you.

I need round 2 to close the gaps in visual deliverables for the
v2.0.2 release. Specifically: 4 product screenshots, 1 hero animation,
1 master SVG re-render (lost on my side), and 2 Chrome Web Store
promo tiles. Specs below.

# Context that hasn't changed since round 1

- Brand blue: #2563EB
- Marker stripe colour (selection highlight): #BFDBFE / #60A5FA at 0.9 alpha
- Type stack: -apple-system / Inter / system-ui
- Brand voice: confident, minimalist, NOT cartoony / NOT purple-AI-gradient
- Product positioning: "Read English content in your own language" — non-native
  English readers consuming dense EN content (Bloomberg / arXiv /
  Stack Overflow / HackerNews / legal docs). Free with Groq, no card.
- Anti-patterns:
  • No Wikipedia as source content (reads as filler)
  • No stock photos of "happy person at laptop"
  • No purple / cyan AI-startup gradients
  • No Settings panel as a hero shot

# Deliverable 1 — 5 product screenshots (PNG, 1280 × 800)

Each ≤ 1 MB. Same screenshots get reused as Chrome Web Store
listing slots AND as README marketing assets.

  1. screenshot-1-hero.png — RE-RENDER (you sent this in round 1; I lost
     the file). The Bloomberg-style "Northstream" mock article with the
     floating "Aa" bubble next to a highlighted sentence was excellent.
     Same composition is fine.
     • Banner across the top: "Highlight. Click. Understand."
     • Subcopy: "Any page, any sentence, any time."

  2. screenshot-2-en-result.png — same article (or similar dense EN
     source), popup open with a clean 3-sentence English explanation.
     • Blur the page behind, popup occupies right 40% at 1.1× scale
     • Small chip pinned top-left of the popup: "GPT-4o mini · Simple words"
     • Banner: "Plain-English explanations in under 2 seconds."

  3. screenshot-3-ru-result.png — English source paragraph (arXiv
     abstract works well), popup on the right showing a fluent Russian
     explanation.
     • Russian text typographically correct (proper kerning,
       no Latin-styled fallback)
     • Status chip in popup: "Groq ⚡ · 🇷🇺 Русский"
     • Banner: "Reads English. Explains in your language."
     • Subcopy: "English, Russian — more coming."

  4. screenshot-4-tone-compare.png — same source sentence explained two
     ways, side-by-side.
     • Two popup cards in the frame
     • Top: "Like I'm 5" — larger type, simpler language
     • Bottom: "Expert" — denser, preserves jargon
     • Banner: "Three tones. One click to switch."
     • Caption bottom-right: "Tune the depth — kid-friendly to technical."

  5. screenshot-5-free-setup.png — Settings panel with Groq selected,
     "Free · No card" badge prominently visible, a green "Validated" key
     chip showing.
     • Groq card subtly elevated / larger than the other 3 provider cards
     • Banner: "Free to start. Bring your own key when you outgrow it."
     • Subcopy: "Groq · Llama 3.3 70B · no credit card."

# Deliverable 2 — hero GIF / animated WebP (for GitHub README)

If you can produce an animated mockup: yes, please.

  • Filename: hero.gif (or hero.webp if animated WebP)
  • Dimensions: ~800px wide
  • File size: ≤ 5 MB (GitHub preview limit)
  • Duration: 6–8 seconds, looped
  • Content (same beats as screenshot-1 but animated):
      1. Cursor appears over dense English text
      2. Drag-highlight across one sentence
      3. The floating "Aa" tile bubble fades in next to the selection
      4. Cursor clicks the bubble
      5. Popup expands smoothly, showing a 3-line plain-English
         explanation
      6. Hold final frame ~1s, then loop

If you can ONLY do static rendering: that is fine — say so and skip
this deliverable. I will capture the GIF locally from the running
extension.

# Deliverable 3 — master SVGs (lost on my side)

Please re-export:

  • icon-master.svg     (128 × 128 viewBox, the editable master)
  • icon-master-16.svg  (16 × 16 viewBox, pixel-snap optimized variant)

Both should match the icon PNGs you already delivered in round 1 (the
"Aa" on marker stripe inside a #2563EB filled tile).

# Deliverable 4 — Chrome Web Store promo tiles (PNG)

These ship via the CWS Developer Dashboard, not via the extension code.
Same brand language as the screenshots.

  1. promo-small.png  (440 × 280) — REQUIRED for CWS carousel placement
     • Left third: large ExplainIt icon on the brand blue background
     • Right two-thirds: a tight mini-demo of selection → explanation
       (highlighted phrase with arrow → 2-line explanation card)
     • Headline (white on blue): "Highlight. Click. Understand."

  2. promo-marquee.png  (1400 × 560) — strongly recommended
     • Left half: full ExplainIt icon + headline + subcopy
     • Right half: bigger demo — same selection→explanation flow, with a
       Russian-translation card visible as a third element
     • Headline: "Highlight. Click. Understand."
     • Subcopy: "Plain-English explanations in seconds — in English or in
       your own language."

# Delivery format

Please return everything as a single zip with this structure:

  explainit-round2/
  ├── screenshots/
  │   ├── screenshot-1-hero.png
  │   ├── screenshot-2-en-result.png
  │   ├── screenshot-3-ru-result.png
  │   ├── screenshot-4-tone-compare.png
  │   └── screenshot-5-free-setup.png
  ├── hero.gif                   ← if you produced one
  ├── icons/
  │   ├── icon-master.svg
  │   └── icon-master-16.svg
  └── promo/
      ├── promo-small.png
      └── promo-marquee.png

Thanks!
```

---

## After the design-AI delivers

1. Unzip somewhere outside the repo
2. Copy files into their final homes:
   ```bash
   # README assets
   cp explainit-round2/screenshots/* docs/marketing/
   cp explainit-round2/hero.gif      docs/marketing/  # if delivered
   cp explainit-round2/icons/*       extension/icons/source/  # create folder

   # Chrome Web Store assets (uploaded via dashboard later)
   cp explainit-round2/screenshots/* store-assets/screenshots/
   cp explainit-round2/promo/*       store-assets/promo/
   ```
3. Commit:
   ```bash
   git add docs/marketing/ store-assets/screenshots/ store-assets/promo/ extension/icons/source/
   git commit -m "docs(marketing): add round-2 screenshots, hero GIF, promo tiles, master SVGs"
   ```

The README already references the exact filenames listed above, so they
will start rendering immediately on GitHub after the commit.

## If the design-AI cannot produce the hero GIF

Fall back: capture it locally from the live extension. Tools and step-by-step
instructions are in [`ASSETS.md`](ASSETS.md) under the "hero.gif" section.
