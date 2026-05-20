# hero-animation

Open `hero-animation.html` in Chrome (it loads React + Babel from CDN
so a normal file:// open works in some setups; if it doesn't, run
`python3 -m http.server` in this folder and open
`http://localhost:8000/hero-animation.html`).

The animation plays automatically, loops at ~7 seconds, and shows the
full beat sequence: cursor enters → drag-highlight → Aa bubble fades
in → click → popup expands with English explanation → hold → loop.

Screen-record one full loop, then convert to GIF / animated WebP using
ffmpeg or any of the GIF capture tools listed in the parent NOTES.md.
