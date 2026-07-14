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
  personnel-flavor.js      Your File atmospheric text pools (irregularities,
                           observations, confidence/status lines)
  roles.js                  Facility Control's 5-tier access hierarchy
  facility-modules.js        registry of the 22 Facility Control modules
                             (which are live vs. sealed/scaffold)

js/
  storage.js            localStorage wrapper + in-memory fallback — the ONE
                         place a future backend gets wired in
  supabase.js            Supabase client config (SUPABASE_URL/SUPABASE_KEY) —
                         wrapped in try/catch, degrades safely if unconfigured
  state.js               single shared state object every module reads/writes
  ui.js                  clock, sidebar toggle, glitch scheduler, decline overlay
  navigation.js          screen switching, sidebar active-state, navTo() router
  search.js               sidebar record search
  quiz.js                 evaluation flow (question rendering, answers, back)
  classification.js       scoring, tie-break, confidence tiers, Paradox reveal,
                           result file rendering
  manifest.js             category index + single-category screen
  products.js              item detail overlay (gallery / colour / size)
  loadout.js               cart, deployment authorization — writes real
                            `orders`/`order_items` when logged in (see below)
  account.js                Your File auth — real Supabase signup/login/logout
                             + `profiles`; toggles between the login gate and
                             the full personnel dossier
  personnel.js               the 16-section "Your File" dossier itself (see
                             below) — identity, classification, recovered
                             equipment, deployment history, address, account
                             settings, interface prefs, and the atmospheric
                             sections, all reading from account.js's session
  dossier.js                 renders the World Dossier archive as independent
                             expand/collapse documents (not to be confused
                             with personnel.js's Your File dossier)
  facility.js                 Facility Control — the internal operator
                               terminal (see below), gated by profiles.role
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

**Migration in progress:**
- **STEP 1 (done):** `js/account.js` (Your File) — real Supabase auth (email/password) + `profiles`.
- **STEP 2 (done):** `js/loadout.js` `deploy()` — when a visitor is logged in
  and Supabase is configured, submitting Deployment Authorization now writes
  a real row to `orders` plus one `order_items` row per cart line, matched
  to `product_variants` via `products.code` (our local product codes like
  `O-001` are expected to equal `products.code` in Supabase). If the visitor
  isn't logged in, or a code doesn't match anything yet, deployment still
  completes locally exactly as before — nothing ever blocks on the backend.

  **Two guessed values to confirm:** `orders.status` and `orders.payment_status`
  are both set to `'pending'` on creation — the actual enum options weren't in
  the schema export, so if Supabase rejects the insert, this is the first
  thing to check (`js/loadout.js`, `writeOrderToSupabase()`).
- **STEP 3 (done):** `js/personnel.js` — the full "Your File" dossier reads
  real `orders`/`order_items` (Recovered Equipment, Deployment History) and
  real `addresses` (Deployment Address, editable). **Guessed `addresses`
  columns** (from the ER diagram screenshot, not a schema export — confirm
  these match): `user_id, label, full_name, phone, country, postcode, city,
  address_line_1, address_line_2, is_default`. If saving an address errors,
  this is the first thing to check.

Fill in `SUPABASE_URL` / `SUPABASE_KEY` in `js/supabase.js` to activate both
steps. The Loadout/cart itself (before checkout) and the classification
result are still `localStorage` — gradual migration, one storage call at a
time, rather than a single flag-day cutover.

If `js/supabase.js` still has placeholder credentials, `js/account.js`
detects this via `hasSupabase()` and shows a clear in-theme message instead
of breaking — the rest of the site is completely unaffected either way.

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

## Facility Control (internal admin terminal)

`js/facility.js`, gated by `profiles.role` via `data/roles.js` (Administrator
99 / Director 80 / Staff 50 / Moderator 20 / Customer 1). Access is UI-only —
real security still lives in Supabase RLS. **02 User Database** and
**05 Deployments** need an admin-bypass policy to see records belonging to
other users (today's RLS only lets someone see their own row):

```sql
create policy "Admins can view all profiles"
on public.profiles for select
using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin','director','staff','moderator')));

create policy "Admins can update all profiles"
on public.profiles for update
using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin','director')));

create policy "Admins can view all orders"
on public.orders for select
using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin','director','staff')));

create policy "Admins can update all orders"
on public.orders for update
using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role in ('admin','director','staff')));
```

**Live modules** (real data/actions): 01 Command Center, 02 User Database,
05 Deployments, 19 Feature Flags (Glitch Effects and Paradox actually gate
site behaviour — see `js/ui.js` and `js/classification.js`), 20 System Logs
(local to the browser, no shared table yet), 22 Command Terminal.

**Sealed/scaffold modules** (structure exists, no backend yet): 03, 04, 06–18,
21 — each renders a "MODULE SEALED" state instead of crashing or faking data.

**Deliberately left disabled, on purpose:** Reset Password / Suspend / Ban /
Delete Account in User Database. These need Supabase's Admin API with the
`service_role` key, which must never run in browser code — wire them to a
server-side function (Edge Function or similar) later, never directly here.
