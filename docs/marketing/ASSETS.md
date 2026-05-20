# Marketing assets — status

The README hero block and the 2×2 product grid reference 5 PNG
screenshots and 1 animated GIF. Status as of v2.0.2:

| Asset | Status | Source |
|---|---|---|
| `screenshot-1-hero.png` | ✅ Delivered | Design-AI round 2 |
| `screenshot-2-en-result.png` | ✅ Delivered | Design-AI round 2 |
| `screenshot-3-ru-result.png` | ✅ Delivered | Design-AI round 2 |
| `screenshot-4-tone-compare.png` | ✅ Delivered | Design-AI round 2 |
| `screenshot-5-free-setup.png` | ✅ Delivered | Design-AI round 2 |
| `hero.gif` | ⏳ TODO — must be captured locally | See below |

Until `hero.gif` is captured, the README hero block falls back to
`screenshot-1-hero.png` (the static version of the same composition).
Page still looks good — the GIF is the cherry on top.

The same 5 PNG screenshots also live in `store-assets/screenshots/` and
will be uploaded to the Chrome Web Store dashboard during submission.

---

## How to produce `hero.gif`

The design-AI shipped an animated HTML mockup of the hero scene rather
than a pre-rendered GIF (their sandboxed environment couldn't render a
6-second @ 800px clip reliably). Source lives at
[`hero-animation/`](hero-animation/).

### Recommended path — record the mockup

1. **Open the animation** in Chrome. Two options:
   - Double-click `hero-animation/hero-animation.html` (works if your
     default browser is Chrome).
   - Or serve it locally so the React+Babel CDN loads cleanly:
     ```bash
     cd docs/marketing/hero-animation
     python3 -m http.server 8000
     # then open http://localhost:8000/hero-animation.html
     ```
2. **Resize the browser** so the animation canvas is ~800px wide.
   Loop length is ~7 seconds.
3. **Screen-record one full loop:**
   - **macOS:** `Cmd+Shift+5` → *Record selected portion* → drag a box
     around the canvas → record one full loop → save as `.mov`.
   - **Windows / Linux:** OBS Studio → Sources → Display Capture → crop
     to the canvas region.
4. **Convert to GIF** with ffmpeg:
   ```bash
   ffmpeg -i input.mov -vf "fps=15,scale=800:-1:flags=lanczos" \
          -loop 0 docs/marketing/hero.gif
   ```
   Target ≤ 5 MB (GitHub's README-preview cap). If the result is bigger:
   ```bash
   # Drop fps to 12, or width to 720, or use gifski for tighter compression
   gifski --fps 15 --width 800 -o docs/marketing/hero.gif frames-*.png
   ```
5. **Swap the README hero** from PNG to GIF:
   In [`README.md`](../../README.md), change
   `src="docs/marketing/screenshot-1-hero.png"` →
   `src="docs/marketing/hero.gif"`.

### Alternative — capture from the live extension

If you'd rather show the real extension on a real Bloomberg / arXiv page
(more credible than a mockup), use [Kap](https://getkap.co) on macOS or
[ScreenToGif](https://www.screentogif.com) on Windows. Same 6–8s loop,
same dimensions, same ffmpeg conversion at the end.

---

## What's in this folder

```
docs/marketing/
├── ASSETS.md                       ← you are here
├── DESIGN-AI-BRIEF.md              ← round-2 brief sent to design-AI (archived)
├── screenshot-1-hero.png           ← README hero (also currently used as static fallback)
├── screenshot-2-en-result.png
├── screenshot-3-ru-result.png
├── screenshot-4-tone-compare.png
├── screenshot-5-free-setup.png
├── hero.gif                        ← TODO
└── hero-animation/                 ← source mockup for hero.gif
    ├── README.md                   (designer's recording notes)
    ├── hero-animation.html         (open this in Chrome to view)
    ├── animations.jsx              (React source — reference only)
    └── icons.jsx                   (icon SVG components — reference only)
```
