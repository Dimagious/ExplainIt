# Promo tiles — brief

Chrome Web Store strongly prefers listings with promo tiles. Without them
Google shows grey placeholders, which signals "abandoned listing" and
suppresses placement in carousels.

## Required: small promo tile

- **Dimensions:** 440 × 280 PNG
- **File name:** `promo-small.png`
- **Composition:**
  - Left third: large ExplainIt icon (the new transform-glyph, not the
    current magnifier) on the brand blue (#2563EB) background
  - Right two-thirds: a tight mini-demo of selection → explanation
    (selected sentence with arrow → 2-line explanation card)
- **Headline:** "Highlight. Click. Understand." (white on the blue panel,
  bold, ≥ 24pt)

## Strongly recommended: marquee promo tile

- **Dimensions:** 1400 × 560 PNG
- **File name:** `promo-marquee.png`
- **Composition:**
  - Left half: full ExplainIt icon + headline + subcopy
  - Right half: bigger demo — same selection→explanation flow, with the
    Russian-translation card visible as a third element
- **Headline:** "Highlight. Click. Understand."
- **Subcopy under headline:** "Plain-English explanations in seconds —
  in English or in your own language."

## Optional: small marquee variant (640 × 400 PNG)

For category-page treatments. Use the same composition as the marquee but
recropped to fit 640 × 400.

## Brand constraints

- **Primary blue:** #2563EB
- **Headline font:** system-ui / Inter / SF Pro — same as the popup UI
- **No stock photos** of "happy person at laptop"
- **No purple/cyan AI-startup gradients**
- **No emoji** in headline (emoji in subcopy bullets only if absolutely
  required)
- **Do not show the API-key Settings screen** as a hero — it scares
  non-developers

## Once produced

Place both files in this directory (`store-assets/promo/`) and upload to
the Chrome Web Store Developer Dashboard:

1. Open https://chrome.google.com/webstore/devconsole
2. Select the ExplainIt item
3. Store listing → Store icon and tiles → upload `promo-small.png` and
   `promo-marquee.png`
4. Submit for review
