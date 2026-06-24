# Ghar Kharch — Monthly Home Expense Tracker — Design Spec

**Date:** 2026-06-24
**Status:** Approved design, ready for implementation planning
**Author:** Devam (brainstormed with Claude)

---

## 1. Summary

**Ghar Kharch** ("home expense") is a brand-new, standalone, mobile-first PWA for
tracking one household's monthly spending. The primary day-to-day user is the
owner's mother, who logs expenses every day. The owner sets a single monthly
spending limit and reviews totals — especially at month-end — to see how much was
spent and, if the limit was exceeded, exactly how much extra.

It is a **separate app** from the existing `projects/expense-tracker/` — its own
codebase, its own data, its own visual identity. The existing tracker is left
untouched.

The single most important quality is **simplicity for a non-technical daily user**.
The design is premium but calm: large type, high contrast, big tap targets,
minimal friction. A confused parent is a failed app.

---

## 2. Goals

- **Effortless daily logging** by a non-technical user (mom), on her phone.
- **One monthly spending limit**, set by the owner, applied every month.
- **Clear monthly verdict**: total spent vs. limit, and the exact overspend amount
  ("Over by ₹1,300") when the limit is exceeded.
- **Per-category breakdown** so the owner can see where money went.
- **Cross-device sync** (mom's phone + owner's device) via encrypted GitHub Gist —
  reusing the proven pattern from the existing expense-tracker.
- **Works offline** and installs to the home screen (PWA).
- **₹ INR** throughout, with Indian number grouping (e.g. ₹1,20,000).

## 3. Non-goals (explicitly out of scope for v1)

- Multi-user logins or multiple people each logging on their own devices.
- Bill-splitting / "who owes whom" / settle-up.
- Per-category budgets (v1 uses a single overall monthly limit).
- Recurring-bill automation / reminders / due-date notifications.
- Income tracking, savings goals, net-worth, or bank/SMS auto-import.
- Multi-currency.
- Any changes to the existing `projects/expense-tracker/` app.

---

## 4. Users & context

- **Mom (primary, daily):** Logs each expense as it happens. Needs the fastest,
  simplest possible entry. Opens the app, taps add, enters amount, taps a
  category, optionally a note, saves. Done in seconds.
- **Owner (you, periodic):** Sets the monthly limit and categories, reviews the
  month total and breakdown, checks history, manages sync. Comfortable with tech.

Both view the **same shared household ledger**, synced across their two devices.

---

## 5. Core concepts

- **Expense:** a single spend — `{ amount, category, note, date }`.
- **This month:** the current calendar month, by each expense's `date`. Rolls over
  automatically on the 1st — no action required from the user.
- **Monthly limit:** one number set in Settings, applied to every month.
- **Remaining:** `limit − total`. When positive → "₹X left" (calm/green). When
  negative → **"Over by ₹X"** (red) — this is the owner's key "how much extra" ask.

---

## 6. Functional requirements — by screen

The app has **4 screens** plus the Add-Expense sheet, kept deliberately small.

### 6.1 This Month (home — `index.html`)
The screen mom opens every day.

- **Hero total:** the month's total spent, as one large ₹ number.
- **Verdict line:** "₹4,200 left" (under limit) or **"Over by ₹1,300"** (over),
  color-coded calm vs. red.
- **Progress bar** filling toward the limit; turns red past 100% and can show the
  overspend portion distinctly.
- **Primary `+ Add Expense` button** — large, thumb-reachable, opens the Add sheet.
- **Recent entries:** today's / most recent expenses (amount, category icon, note,
  time). Tap an entry to edit or delete.
- Current month name shown; a way to glance at the limit value.

### 6.2 Add Expense (slide-up sheet, invoked from home)
The most-used flow, therefore the most optimized.

- **Amount:** large field driven by an **on-screen numeric keypad** (no native
  mobile keyboard). Clear/backspace.
- **Category:** a grid/row of **category chips** with icons — single tap to select.
- **Note:** optional short text ("vegetables", "electricity bill").
- **Date:** defaults to **today**; tappable to back-date.
- **Save:** large button → gentle success toast → sheet closes → home total updates.
- **Edit mode:** same sheet, prefilled, with a Delete action.

### 6.3 History (`history.html`)
- List of months (most recent first), each with its **total** and an over/under
  badge.
- Tap a month → that month's view: **category breakdown** (simple horizontal bars
  with amounts) + the full entry list for that month.
- This satisfies "at the end of the month, how much did we spend" for any month.

### 6.4 Settings (`settings.html`)
- **Monthly limit:** set/edit the single overall limit.
- **Categories:** add / rename / recolor / pick icon / reorder; sensible defaults
  seeded on first run (see §10).
- **PIN:** set/change the app-open PIN (see §9).
- **Sync:** GitHub token + Gist configuration (mirrors existing tracker's flow).
- **Data:** export to CSV and JSON; import/restore from a backup.
- **Currency:** fixed to ₹ INR for v1 (shown, not configurable).

---

## 7. Data model

```jsonc
// expense
{
  "id": "uuid",
  "amount": 1250.0,          // number, INR
  "category": "groceries",   // category id
  "note": "vegetables",      // optional string
  "date": "2026-06-24",      // YYYY-MM-DD (the spend date)
  "createdAt": 1750000000000 // epoch ms (for ordering / sync conflict handling)
}

// settings
{
  "monthlyLimit": 30000,
  "currency": "INR",
  "categories": [
    { "id": "groceries", "name": "Groceries", "icon": "shopping-cart", "color": "..." }
    // ...
  ],
  "pinHash": "…",            // see §9
  "sync": { "gistId": "…", "tokenRef": "…" }
}
```

- All app data persists in **localStorage**, **encrypted at rest** (same crypto
  approach as the existing tracker).
- Data is mirrored to a **private GitHub Gist** for cross-device sync.

---

## 8. Storage & sync

- **Local-first:** every action writes locally and works fully offline.
- **Sync:** reuse the existing expense-tracker's encrypted GitHub Gist sync —
  shared-salt key derivation, encrypted payload, "Sync Now" plus sync-on-change.
  Port `js/sync.js` / `js/storage.js` patterns rather than reinventing them.
- **Conflict handling:** last-write-wins per expense by `createdAt`/updated
  timestamp is acceptable for a single-logger household; merge by expense `id` so
  edits on one device don't clobber unrelated entries from the other.
- This is a separate Gist from the existing tracker — separate dataset.

---

## 9. Security

- **PIN:** a short numeric PIN is required on app open. Stored as a salted hash
  (never plaintext). A small friction for privacy; not a full account system.
- **Encryption:** all stored and synced data is encrypted at rest, consistent with
  the existing tracker.
- **PIN is a UI gate only.** The encryption key is derived via the existing
  tracker's shared-salt approach — *not* from the PIN — so encryption/sync work
  identically across both devices regardless of each device's local PIN. This keeps
  cross-device decryption working and lets the PIN be changed without re-encrypting.

---

## 10. Default categories (all editable)

Groceries · Utilities · Rent/EMI · Internet & Phone · Household supplies ·
Health/Medical · Transport/Fuel · Dining out · Education · Maintenance ·
Subscriptions · Other

Each has an inline-SVG icon (no emoji) and a color, shown as a tinted chip —
following the icon-chip pattern proven in the existing tracker.

---

## 11. Design direction — **light, minimal, aesthetic**

> **Theme decision:** This app uses a **light theme**, intentionally overriding the
> workspace's dark-by-default standard. A bright, calm, uncluttered surface is
> friendlier for a non-technical daily user and keeps focus on the single number
> that matters. The build still **invokes the Hallmark skill** to lock a design
> system (its own `design.md`, as the existing tracker has) — but constrained to the
> light/minimal direction below.

**Visual language**

- **Soft light base:** a warm off-white / paper background (not stark `#fff`), with
  one slightly lighter raised surface for cards and the Add sheet. Generous
  whitespace is the primary design device — minimalism through breathing room.
- **One restrained accent:** a single calm accent color (e.g. a soft sage/teal or a
  muted indigo), used sparingly — the primary button, the progress fill, the active
  nav item, the hero accent. Kept under ~5% of any viewport.
- **Semantic color, quietly:** calm green tone for "under limit / ₹X left"; a warm,
  legible red for **"Over by ₹X"**. Color carries meaning, never decoration.
- **Elevation over glass:** soft, low, diffuse shadows and hairline borders for
  hierarchy — *not* glassmorphism (glass reads poorly on light + adds noise).
  Rounded corners (generous radius) on cards, chips, sheet, and buttons.
- **High contrast text:** near-black ink on the light base for maximum legibility —
  important for an older daily user. No low-contrast gray-on-gray.

**Typography & numerals**

- **Big, confident ledger numerals** for the hero total and amounts — a clean
  display face; the rest in a highly legible humanist sans.
- Comfortable base font size (err larger than typical) and tap targets ≥ 44px.

**Layout & chrome**

- **Mobile-first**, single column, thumb-reachable primary actions; clean **bottom
  tab bar** (This Month · History · Settings) and a prominent add affordance.
- **Its own identity**, distinct from the existing tracker (dark indigo→violet);
  this one is light and airy.
- **No emoji** — a single inline-SVG icon library; line icons suit the minimal look.

**Motion (subtle, premium)**

- Count-up on the hero total, smooth progress-bar fill, gentle staggered list
  reveals, slide-up Add sheet — via vanilla GSAP/CSS.
- Motion is understated and quick; **all animations respect
  `prefers-reduced-motion`**.

**Currency**

- **₹ INR** Indian-grouped formatting everywhere (a shared `format.js`).

## 12. Tech stack & structure

- **Vanilla HTML/CSS/JS**, no build step. **PWA** (`manifest.json`, `sw.js`).
- Deployable to **GitHub Pages** (same as existing tracker).
- Proposed layout (mirrors the existing tracker for familiarity):
  - `index.html` (This Month + Add sheet), `history.html`, `settings.html`
  - `css/` — `tokens.css`, `main.css`, `components.css`
  - `js/` — `app.js`, `storage.js`, `sync.js`, `auth.js` (PIN), `home.js`,
    `addexpense.js`, `history.js`, `settings.js`, `icons.js`, `format.js`
  - `assets/`, `manifest.json`, `sw.js`
- Final file breakdown is settled in the implementation plan.

## 13. Edge cases

- **No expenses yet / new month:** friendly empty state, total ₹0, full limit
  remaining.
- **No limit set:** show total only; prompt to set a limit; no overspend math.
- **Editing/deleting** an expense recomputes totals and re-syncs.
- **Back-dated expense** into a previous month: it counts toward *that* month.
- **Large numbers:** Indian grouping holds (₹12,34,567).
- **Offline:** everything works; sync resumes when back online.
- **Sync conflict:** merge by expense `id`; never silently drop entries.

## 14. Testing strategy

- **Currency/format:** unit-test Indian grouping and remaining/overspend math.
- **Month rollover:** entries land in the correct calendar month; rollover needs no
  user action.
- **CRUD:** add / edit / delete correctly update totals and persisted state.
- **Sync round-trip:** encrypt → Gist → decrypt on a second client yields identical
  data; conflicting edits merge without loss.
- **PIN:** wrong PIN blocks entry; correct PIN unlocks; hash never stored plaintext.
- **Manual mobile pass:** keypad entry, chip selection, save flow, reduced-motion.

## 15. Future (post-v1, not now)

Per-category budgets · recurring-bill reminders · due-date notifications · income
& savings · charts beyond simple bars · localization of labels (e.g. Hindi/Gujarati).
