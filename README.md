# FREƎ-KY // Classification Database

A fully modular, multi-file build of the FREƎ-KY site. No inline
`<style>` or `<script>` — `index.html` is markup only.

## Running it

This is a static site: no build step, no server-side code.

- **Recommended:** serve the folder with any static file server
  (e.g. `npx serve .`, VS Code's "Live Server", GitHub Pages, etc.)
  and open `index.html`.
- **Also works:** open `index.html` directly by double-clicking it.
  All scripts are classic `<script src>` tags (no ES modules), so
  there are no CORS restrictions when loading from `file://`.
- **Note on Local Storage:** the Loadout (cart), classification
  result, and Your File login all persist via `localStorage` (see
  `js/storage.js`). Some sandboxed preview environments (including
  Claude.ai's inline artifact preview) block `localStorage` under
  `file://`/opaque origins — the app detects this and silently
  falls back to in-memory storage for that session, so it still
  works, it just won't survive a refresh in that specific context.
  Opening the file normally in a browser, or hosting it, gives you
  full persistence.

## Project structure

```
index.html            markup only

assets/
  images/              (empty — drop real product photography here)
  icons/                (empty)
  fonts/                 (empty — fonts currently load from Google Fonts
                          via @import in css/style.css; self-host here later)

css/
  style.css            design tokens, reset, layout shell (topbar/sidebar/screens)
  components.css       reusable UI: buttons, cards, tiles, forms, modals
  animations.css       glitch system + every @keyframes
  responsive.css        all @media breakpoints

data/
  questions.js         Classification Protocol question bank
  categories.js         the 6 divisions (Off-Duty / Assigned x4 / Unclassified)
  files.js               personnel file text per division (dossier content)
  products.js            equipment manifest, colours, sizes, gallery slides
  dossier.js              the archive: 9 expandable documents (lore, rules,
                          incident reports, recovered notes)

js/
  storage.js            localStorage wrapper + in-memory fallback — the ONE
                         place a future backend gets wired in
  state.js               single shared state object every module reads/writes
  ui.js                  clock, sidebar toggle, glitch scheduler, decline overlay
  navigation.js          screen switching, sidebar active-state, navTo() router
  search.js               sidebar record search
  quiz.js                 evaluation flow (question rendering, answers, back)
  classification.js       scoring, tie-break, confidence tiers, Paradox reveal,
                           result file rendering
  manifest.js             category index + single-category screen
  products.js              item detail overlay (gallery / colour / size)
  loadout.js               cart, deployment authorization, deployment confirm
  account.js                Your File — registration/access (simulated)
  dossier.js                 renders the archive as independent expand/collapse
                             documents — each section opens on its own
  app.js                    bootstrap — loaded last, wires everything together

database/                empty placeholder for the real backend, whenever it
                          exists (see "Future backend" below)
```

## How data flows

`index.html` loads `/data/*.js` first — each file just assigns arrays/objects
onto `window.FREEKY.data`. Nothing in the UI layer ever hardcodes equipment,
questions, or division text; it all reads from `FREEKY.data`.

Then `/js/*.js` loads in dependency order (storage → state → everything else →
app.js last). Every module attaches itself to `window.FREEKY` under its own
namespace (`FREEKY.quiz`, `FREEKY.loadout`, `FREEKY.account`, …), so:

- there are no naming collisions between files,
- every `onclick="..."` in the HTML calls a fully-qualified function
  (`FREEKY.quiz.answer('researcher')`, `FREEKY.loadout.add()`, etc.), and
- you can open any single file and know exactly what it's responsible for.

## Future backend

Search the codebase for these comment markers — they're every point a real
backend would plug in without touching the interface:

```
// Future database connection
// Authentication endpoint (future)
// Deployment history
// Load from API (future)
// User data
```

In short:
1. Point `js/storage.js`'s `get/set/remove` at your API instead of `localStorage`.
2. Point the `/data/*.js` files at a `fetch()` call instead of a static array.
3. Replace the simulated checks in `js/account.js`'s `submit()` with a real
   `POST /api/register` / `POST /api/login` call.

Nothing else changes — every module already reads through `FREEKY.storage`
and `FREEKY.data`, never around them.
