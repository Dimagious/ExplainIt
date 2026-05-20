# Marketing assets — capture brief

The README references 5 visual assets in this folder. Until they are
captured, those `<img>` tags render as broken icons on the GitHub page.
This file is the brief for capturing each one.

**Same screenshots can double as Chrome Web Store listing slots** — see
`store-assets/screenshots/SHOT-LIST.md`. The GIF is README-only (CWS
does not accept GIFs).

---

## 1. `hero.gif` — the #1 priority

**The single most impactful element on the README.** One good GIF beats
five static screenshots for first impression.

### What to capture

A real workflow, 6–8 seconds, looped:

1. Cursor is on a real article (Bloomberg / arXiv / TechCrunch / Hacker News linked content — **not Wikipedia**)
2. User highlights one sentence containing dense / jargon-heavy language
3. The floating ExplainIt "Aa" bubble appears next to the selection
4. User clicks the bubble
5. Popup opens with a 2–3 sentence explanation
6. (Optional) Hold the final frame for ~1 second before loop restarts

### Specs

- **Format:** GIF (or animated WebP if you prefer — GitHub renders both inline)
- **Dimensions:** ~800px wide. Capture at higher res, downsize on export
- **File size:** **≤ 5 MB** (GitHub may not render preview if larger)
- **Frame rate:** 15–20 fps is plenty
- **Loop:** Yes
- **Colors:** Keep palette tight — fewer colors = smaller file

### Recommended capture tool

- **macOS:** [Kap](https://getkap.co) (free, modern, exports GIF + WebP + MP4) or CleanShot X
- **Windows:** [ScreenToGif](https://www.screentogif.com) (free, excellent)
- **Optimization:** [ezgif.com](https://ezgif.com) (web-based) or [gifski](https://gif.ski) (CLI, best quality-per-byte)

### Capture instructions

1. Open the target article in a clean Chrome window (no extension icons in the way)
2. Set browser zoom to 100% so the popup renders at intended size
3. Run Kap → record a tight rectangular region covering 80% of the article area
4. Perform the highlight → click → wait → close sequence in one smooth take
5. Trim deadweight at start/end so the action begins by frame ~5
6. Export at 800px width, ≤ 20 fps, optimize through ezgif if file > 5 MB
7. Save as `docs/marketing/hero.gif`

### Article suggestions (where to find good dense content)

| Source | Why it works |
|---|---|
| Bloomberg / FT / WSJ article on monetary policy or earnings | Real dense English, technical jargon, niche audience needs help |
| arXiv abstract on any ML paper | Maximum jargon density, instantly visible value |
| Stack Overflow answer with technical terms | Aspirational for the dev audience |
| US tax form instructions or a contract clause | Universal pain — anyone reading legal text needs this |

**Avoid:** Wikipedia (reads as filler/demo), random blog posts (the dense content needs to be visibly hard).

---

## 2. `screenshot-en-result.png` — English explanation result

### Subject

A real article (same source as the GIF) with one sentence highlighted
and the inline popup open showing a clean **English** explanation.

### Composition

- Browser chrome at the top (~80px), then the article fills the rest
- Inline popup overlaid at the selection point
- Slight blur on the surrounding page text (CSS `backdrop-filter: blur(2px)`) to focus attention on the popup — optional but pro

### Specs

- **Format:** PNG
- **Dimensions:** 1280 × 800 (matches CWS spec — reusable)
- **File size:** ≤ 1 MB

### On-image annotations (optional)

A small chip in the popup corner: `GPT-4o mini · Simple words` (or
whatever provider + tone is being shown). No banner needed for README —
context is in the surrounding `<sub>` caption.

---

## 3. `screenshot-ru-result.png` — Russian explanation of English source

### Subject

Same article structure as #2, but the popup shows a fluent **Russian**
explanation of the highlighted English sentence.

### Why this matters

This is the **killer-feature shot** — proves the multilingual headline
("Read English content in your own language") with one visual. Russian
text in the popup against an English source page is the most distinctive
single image we can show.

### Composition

- Source page on the left half, popup on the right half (slightly larger
  than in shot #2 — give Russian text room to breathe)
- Russian text typographically correct: proper kerning, no Latin-styled
  fallback fonts
- Status chip in popup: `Groq ⚡ · 🇷🇺 Русский`

### Specs

- **Format:** PNG · 1280 × 800 · ≤ 1 MB

---

## 4. `screenshot-tone-compare.png` — three tones, one sentence

### Subject

The same English sentence explained in two different tones, side-by-side
or stacked.

### Composition options

Two popup cards in one frame, labeled:

- **Top:** "Like I'm 5" — larger type, simpler language, friendly analogy
- **Bottom:** "Expert" — denser type, preserves technical terms

Or three cards across (Simple / Like I'm 5 / Expert) if you can keep the
frame readable at 1280 × 800.

### Specs

- **Format:** PNG · 1280 × 800 · ≤ 1 MB

---

## 5. `screenshot-settings.png` — Free Groq setup

### Subject

Settings panel with Groq selected, "Free · No card" badge prominently
visible, the `Validated` green chip showing on the key status.

### Composition

- Settings panel centered in frame
- Page behind dimmed
- Groq card subtly elevated / larger than the other three provider cards

### Specs

- **Format:** PNG · 1280 × 800 · ≤ 1 MB

---

## Capture session — recommended order

To minimize context switching:

1. **Set up:** clean Chrome window, target article open, extension loaded, Groq key configured + validated
2. **GIF first** (hardest to retake, captures the whole flow)
3. **Static EN result** (same scene, just freeze a clean frame)
4. **Switch language to Russian in Settings**, then capture **static RU result**
5. **Switch tone to "Like I'm 5"** in Settings, capture explanation, then switch to "Expert", capture again → composite into **tone-compare**
6. **Capture Settings panel** with Groq highlighted

Total time, with a single article open: ~15–20 minutes of focused work.

---

## After capturing

```bash
git add docs/marketing/
git commit -m "docs(marketing): add hero GIF and 4 product screenshots"
```

No code changes needed — the README already references these exact filenames.

Same images can be uploaded to Chrome Web Store dashboard (except the
GIF — CWS only takes static PNG).
