# Chrome Web Store Developer Dashboard — submission checklist

The code/assets in this repo are ready. The remaining steps happen on
the Developer Dashboard (https://chrome.google.com/webstore/devconsole) —
they cannot be automated from the repo.

## Required before publishing the next version

1. **Category:** change from **Education** → **Tools** (under the Productivity group).
   - Chrome Web Store no longer offers "Productivity" as a leaf
     category. The Productivity group now contains 5 children:
     Communication, Developer Tools, Education, Tools, Workflow &
     Planning. Only Education and Tools are realistic for ExplainIt.
   - "Tools" is the right pick because ExplainIt is a utility a user
     reaches for mid-reading, not structured learning material. Most
     direct AI-explain competitors (Explain AI, Simplify, ChatGPT
     Summary) sit in the utility bucket, not under Education.
   - Education stays viable if you want to target the student segment
     specifically — note that the full description already lists
     students as one of four audiences, not the primary.

2. **Listing locale:** add **Russian (ru-RU)** in addition to English.
   - Reason: the extension explicitly supports Russian output. With an
     English-only listing the entire RU surface area on the store is
     invisible to half the target audience.
   - Localize: title, short description, full description.

3. **Replace screenshots** with the 5 new shots described in
   `screenshots/SHOT-LIST.md`. Delete the old `screenshot-1...4.png`
   files. The current 4 shots all show the same Wikipedia page and
   one is the Settings panel — both kill conversion.

4. **Upload promo tiles** as described in `promo/BRIEF.md`:
   - `promo-small.png` (440 × 280) — **required for carousel placement**
   - `promo-marquee.png` (1400 × 560) — recommended

5. **Replace short description** with the new copy in
   `description/short-description.txt` (122 chars, leads with the
   outcome and the free-tier path).

6. **Replace full description** with the new copy in
   `description/full-description.txt`.

7. **Permissions justification** (Developer Dashboard → Privacy practices):
   - `storage` — required to persist the user's chosen provider, API key,
     language, and tone across browser sessions.
   - `optional_host_permissions` on the 4 provider APIs — granted by the
     user only after they pick a provider in Settings and click "Test
     key". Not required at install time.
   - Content scripts on `<all_urls>` — required to detect text
     selection on any page and inject the inline action bubble.

8. **Privacy policy URL:** confirm the link in the dashboard still points
   to a publicly reachable host. The repo ships `privacy-policy.html` but
   it must be hosted somewhere public (GitHub Pages, Vercel, Notion).

## What the user sees at install time after this release

Compared to v2.0.0, the install dialog is shorter — the four
provider host permissions are now requested in-app on first use, not at
install. Expect a single-digit-to-low-double-digit-percent install
completion uplift from this change alone (per Mozilla/Google published
data on optional permissions).
