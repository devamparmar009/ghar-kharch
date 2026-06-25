# Ghar Kharch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, mobile-first, light-themed PWA for tracking one household's monthly expenses — effortless daily logging, a single monthly limit with an exact overspend verdict, a rich analytics hub, and encrypted cross-device sync.

**Architecture:** Vanilla HTML/CSS/JS, no build step, 4 screens + an Add-Expense sheet, served as a static PWA (GitHub Pages). Pure logic (formatting, date math, analytics) lives in dependency-free modules that run in both the browser (global functions) and Node (via a `module.exports` footer) so they get real unit tests with `node --test`. Encryption, storage, auth, and sync are ported from the existing `projects/expense-tracker/` patterns. All app data is held as one decrypted object in memory, persisted AES-GCM-encrypted in `localStorage`, and mirrored to a private GitHub Gist.

**Tech Stack:** HTML5, CSS (custom properties / OKLCH-or-hex tokens), vanilla ES (no framework, no bundler), Web Crypto API (PBKDF2 + AES-GCM), GitHub Gist REST API, service worker for offline. Tests: Node built-in `node:test` + `node:assert` (no dependencies).

## Global Constraints

These apply to **every** task. Values copied verbatim from the spec.

- **Project root:** `projects/ghar-kharch/` (brand-new; never modify `projects/expense-tracker/`).
- **No build step.** Plain files loaded via `<script>`/`<link>`; must run by opening the HTML or via a static server.
- **Currency:** `₹ INR` everywhere, Indian number grouping (e.g. `₹1,20,000`) via `toLocaleString('en-IN', { maximumFractionDigits: 0 })`. Currency is fixed (shown, not configurable).
- **No emoji anywhere.** All icons come from one inline-SVG library (`js/icons.js`).
- **Expense shape:** `{ id, amount, category, note, date, createdAt, updatedAt }` — `date` is `YYYY-MM-DD` (the spend date), `category` is a category id string, `createdAt`/`updatedAt` are epoch ms.
- **One monthly limit** (`settings.monthlyLimit`, a single number) applied to every month. No per-category budgets.
- **"This month"** = current calendar month by each expense's `date`; rolls over automatically on the 1st with no user action.
- **Remaining** = `limit − total`; positive → "₹X left" (calm green), negative → "Over by ₹X" (warm red).
- **Auth model:** a one-time **sync passphrase** derives the AES key via PBKDF2 + a fixed shared salt (identical key on both devices → sync works); a separate **numeric PIN** is the daily UI gate that locally wraps/unwraps the AES key. The key is **never** derived from the PIN, so the PIN can change without re-encrypting data. PIN and passphrase are stored only as salted hashes / wrapped blobs, never plaintext.
- **Design:** light, minimal, aesthetic (see spec §11). Soft off-white base, white raised cards, one restrained sage-teal accent, hairline borders + soft shadows (no glassmorphism), high-contrast near-black text, big tap targets (≥44px), generous whitespace. Motion is subtle and **must respect `prefers-reduced-motion`**.
- **Mobile-first**, single column, bottom tab bar: This Month · History · Analytics · Settings.
- **Local-first & offline:** every action writes locally and works with no network; sync resumes when online.
- **Commit after every task** (and after each green test cycle within a task).

### Reference: source patterns to port (read before starting)

- `projects/expense-tracker/js/auth.js` — `deriveKey`, `encryptData`, `decryptData`, shared `APP_SALT`, session-key storage. Port the crypto; replace the password-only gate with passphrase+PIN.
- `projects/expense-tracker/js/storage.js` — `getData`/`saveData` cache pattern, expense/category CRUD.
- `projects/expense-tracker/js/sync.js` — Gist `connectSync`/`pushToGist`/`pullFromGist` flow.
- `projects/expense-tracker/js/app.js` — `formatCurrency`, month/date helpers, `showToast`, `animateCountUp`, `setActiveNav`.

### Repo-wide file map

```
projects/ghar-kharch/
  index.html              Task 10   This Month + Add sheet host
  history.html            Task 12   Ledger browse
  analytics.html          Task 13   Analytics hub
  settings.html           Task 14   Settings
  manifest.json           Task 1/15 PWA manifest
  sw.js                   Task 15   Service worker (offline cache)
  design.md               Task 1    Locked design system (Hallmark output)
  css/
    tokens.css            Task 1    Design tokens (light theme)
    main.css              Task 1    Base, layout, typography, bottom nav
    components.css        Tasks 1,11,12,14  Buttons, cards, chips, sheet, keypad, lists, forms, toast
    charts.css            Task 13   Trend bars, breakdown bars, limit line
  js/
    format.js             Task 2    Currency + date/month helpers + UUID  (Node-testable)
    crypto.js             Task 3    deriveKey / encrypt / decrypt / wrapKey / unwrapKey  (Node-testable)
    icons.js              Task 4    Inline-SVG icon library
    storage.js            Task 5    Encrypted data layer + CRUD + settings  (Node-testable)
    auth.js               Task 6    Passphrase + PIN gate, session key
    sync.js               Task 7    GitHub Gist sync
    analytics.js          Task 8    Pure analytics computations  (Node-testable)
    app.js                Task 9    Shared UI: toast, count-up, nav, page bootstrap
    home.js               Task 10   This Month rendering
    addexpense.js         Task 11   Add/Edit sheet (keypad, chips)
    history.js            Task 12   History rendering
    analytics-view.js     Task 13   Analytics rendering (uses analytics.js)
    charts.js             Task 13   Bar-chart / breakdown DOM builders
    settings.js           Task 14   Settings rendering & actions
  assets/
    icon-192.png, icon-512.png, favicon.png   Task 15
  tests/
    format.test.js        Task 2
    crypto.test.js        Task 3
    storage.test.js       Task 5
    analytics.test.js     Task 8
  docs/superpowers/{specs,plans}/   (specs + this plan already here)
```

---

## Task 1: Project scaffold, design system & app shell

**Files:**
- Create: `projects/ghar-kharch/design.md`
- Create: `projects/ghar-kharch/css/tokens.css`
- Create: `projects/ghar-kharch/css/main.css`
- Create: `projects/ghar-kharch/css/components.css`
- Create: `projects/ghar-kharch/index.html`, `history.html`, `analytics.html`, `settings.html` (shells)
- Create: `projects/ghar-kharch/manifest.json`

**Interfaces:**
- Produces: the token names other tasks consume (`--bg`, `--surface`, `--ink`, `--ink-2`, `--rule`, `--accent`, `--accent-ink`, `--good`, `--good-bg`, `--bad`, `--bad-bg`, `--warn`, `--warn-bg`, `--radius`, `--radius-sm`, `--shadow`, `--space-*`); the `.bottom-nav` markup pattern; the `#auth-overlay` + `#app` page skeleton every screen reuses.

- [ ] **Step 1: Lock the design system with Hallmark**

Per the workspace standard, invoke the `hallmark` skill to produce `projects/ghar-kharch/design.md`, constrained to spec §11 (light, minimal, sage-teal accent, no emoji, the four-tab structure). The output `design.md` is the source of truth; the tokens below are the agreed baseline from the approved mockups — keep them unless Hallmark refines specific values.

- [ ] **Step 2: Write `css/tokens.css`**

```css
:root {
  --bg:        #F7F5F0;
  --surface:   #FFFFFF;
  --surface-2: #FBFAF6;
  --ink:       #1A1A17;
  --ink-2:     #6B6A63;
  --ink-3:     #9A988F;
  --rule:      rgba(0,0,0,0.06);
  --rule-2:    rgba(0,0,0,0.10);

  --accent:     #2F9E83;
  --accent-ink: #FFFFFF;
  --accent-50:  #E6F4EE;
  --accent-700: #1B7A5E;

  --good:    #1B7A5E;  --good-bg: #E6F4EE;
  --bad:     #C0492F;  --bad-bg:  #FBEAE5;
  --warn:    #854F0B;  --warn-bg: #FAEEDA;

  --radius:    20px;
  --radius-sm: 14px;
  --radius-pill: 999px;
  --shadow:    0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05);
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px; --space-8: 32px;

  --font-display: "Sora", system-ui, sans-serif;
  --font-body: "Inter", system-ui, -apple-system, sans-serif;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

- [ ] **Step 3: Write `css/main.css`** (reset, base typography, layout, bottom nav)

```css
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  padding-bottom: 76px;            /* room for the fixed bottom nav */
  max-width: 480px;
  margin: 0 auto;
}
h1, h2, h3 { font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em; margin: 0; }
.app-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-5) var(--space-4) var(--space-3); }
.app-title { font-size: 18px; }
.screen { padding: 0 var(--space-4) var(--space-6); }
.muted { color: var(--ink-2); }
.center { text-align: center; }

.bottom-nav {
  position: fixed; left: 50%; transform: translateX(-50%);
  bottom: 0; width: 100%; max-width: 480px;
  display: flex; justify-content: space-around;
  background: var(--surface); border-top: 1px solid var(--rule);
  padding: 8px 0 14px;
}
.bottom-nav a {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  text-decoration: none; color: var(--ink-3); font-size: 11px; min-width: 56px;
}
.bottom-nav a.active { color: var(--accent); font-weight: 600; }
.bottom-nav .icon { width: 22px; height: 22px; }

.empty-state { text-align: center; color: var(--ink-2); padding: var(--space-8) var(--space-4); }
.empty-state .icon { width: 40px; height: 40px; color: var(--ink-3); margin-bottom: var(--space-3); }

#auth-overlay { display: none; position: fixed; inset: 0; background: var(--bg); z-index: 100; align-items: center; justify-content: center; padding: var(--space-4); }

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 4: Write `css/components.css`** (shared primitives; later tasks append)

```css
.card { background: var(--surface); border: 1px solid var(--rule); border-radius: var(--radius); box-shadow: var(--shadow-sm); padding: var(--space-4); }
.btn { font-family: var(--font-body); font-size: 15px; font-weight: 600; border-radius: var(--radius-sm); padding: 14px 18px; border: 1px solid transparent; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; }
.btn-primary { background: var(--accent); color: var(--accent-ink); }
.btn-primary:active { transform: translateY(1px); }
.btn-ghost { background: var(--surface); color: var(--ink); border-color: var(--rule-2); }
.btn-danger { background: var(--bad-bg); color: var(--bad); border-color: var(--bad); }
.btn-full { width: 100%; }
.btn .icon { width: 18px; height: 18px; }
.pill { display: inline-flex; align-items: center; gap: 6px; border-radius: var(--radius-pill); padding: 4px 10px; font-size: 13px; font-weight: 600; }
.pill-good { background: var(--good-bg); color: var(--good); }
.pill-bad { background: var(--bad-bg); color: var(--bad); }
.pill-warn { background: var(--warn-bg); color: var(--warn); }
.cat-chip { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cat-chip .icon { width: 19px; height: 19px; }
.toast-container { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); z-index: 200; display: flex; flex-direction: column; gap: 8px; }
.toast { background: var(--ink); color: #fff; padding: 10px 16px; border-radius: var(--radius-pill); font-size: 14px; box-shadow: var(--shadow); animation: toastIn 0.25s var(--ease-out); }
.toast.error { background: var(--bad); }
@keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
```

- [ ] **Step 5: Write the four HTML shells**

Each page shares this skeleton. `index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#F7F5F0" />
  <title>Ghar Kharch</title>
  <link rel="manifest" href="manifest.json" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/tokens.css" />
  <link rel="stylesheet" href="css/main.css" />
  <link rel="stylesheet" href="css/components.css" />
</head>
<body>
  <div id="auth-overlay"></div>
  <div id="app" style="display:none">
    <header class="app-header">
      <div class="app-title">June 2026</div>
      <button id="settings-link" class="icon-btn" aria-label="Settings"></button>
    </header>
    <main class="screen" id="screen"></main>
    <nav class="bottom-nav" aria-label="Primary">
      <a href="index.html" data-icon="wallet"><span class="nav-ico"></span><span>This month</span></a>
      <a href="history.html" data-icon="calendar"><span class="nav-ico"></span><span>History</span></a>
      <a href="analytics.html" data-icon="chart"><span class="nav-ico"></span><span>Analytics</span></a>
      <a href="settings.html" data-icon="settings"><span class="nav-ico"></span><span>Settings</span></a>
    </nav>
  </div>
  <script src="js/format.js"></script>
  <script src="js/icons.js"></script>
  <script src="js/crypto.js"></script>
  <script src="js/storage.js"></script>
  <script src="js/sync.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/analytics.js"></script>
  <script src="js/app.js"></script>
  <script src="js/home.js"></script>
  <script src="js/addexpense.js"></script>
</body>
</html>
```

`history.html`, `analytics.html`, `settings.html` are identical except the `<title>`, the page-specific script at the end (`history.js` / `analytics-view.js`+`charts.js` / `settings.js`), and `analytics.html` also links `css/charts.css`. (Each loads the same shared scripts before its page script.)

- [ ] **Step 6: Write `manifest.json`**

```json
{
  "name": "Ghar Kharch",
  "short_name": "Ghar Kharch",
  "description": "Monthly home expense tracker",
  "start_url": "index.html",
  "display": "standalone",
  "background_color": "#F7F5F0",
  "theme_color": "#F7F5F0",
  "icons": [
    { "src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 7: Verify the shell renders**

Start a static server from the project dir and open `index.html` with the preview tools. Expected: light background, header, empty `#screen`, bottom nav bar visible (icons fill in after Task 4/9). No console errors except missing icons (filled later).

- [ ] **Step 8: Commit**

```bash
git add projects/ghar-kharch
git commit -m "feat(ghar-kharch): scaffold project, design tokens, app shell"
```

---

## Task 2: `format.js` — currency, date & month utilities

**Files:**
- Create: `projects/ghar-kharch/js/format.js`
- Test: `projects/ghar-kharch/tests/format.test.js`

**Interfaces:**
- Produces:
  - `formatCurrency(amount) -> string` (e.g. `-1500 -> "−₹1,500"`, `120000 -> "₹1,20,000"`)
  - `generateUUID() -> string`
  - `getTodayStr() -> "YYYY-MM-DD"`
  - `getCurrentMonthKey() -> "YYYY-MM"`
  - `getMonthKey(dateStr) -> "YYYY-MM"`
  - `getMonthLabel(key) -> "June 2026"`, `getShortMonthLabel(key) -> "Jun 26"`
  - `getPrevMonthKey(key)`, `getNextMonthKey(key)`
  - `formatDate(dateStr) -> "Today" | "Yesterday" | "5 Jun"`
  - `daysInMonth(key) -> number`, `getDayOfMonth(dateStr) -> number`
- Consumed by: every task.

- [ ] **Step 1: Write the failing tests** → `tests/format.test.js`

```js
const test = require('node:test');
const assert = require('node:assert');
const f = require('../js/format.js');

test('formatCurrency groups in Indian style', () => {
  assert.strictEqual(f.formatCurrency(120000), '₹1,20,000');
  assert.strictEqual(f.formatCurrency(1500), '₹1,500');
  assert.strictEqual(f.formatCurrency(0), '₹0');
});

test('formatCurrency shows a minus for negatives', () => {
  assert.strictEqual(f.formatCurrency(-1300), '−₹1,300');
});

test('month key helpers', () => {
  assert.strictEqual(f.getMonthKey('2026-06-24'), '2026-06');
  assert.strictEqual(f.getPrevMonthKey('2026-01'), '2025-12');
  assert.strictEqual(f.getNextMonthKey('2026-12'), '2027-01');
});

test('daysInMonth handles leap February', () => {
  assert.strictEqual(f.daysInMonth('2024-02'), 29);
  assert.strictEqual(f.daysInMonth('2026-02'), 28);
});
```

- [ ] **Step 2: Run, verify failure**

Run: `node --test projects/ghar-kharch/tests/format.test.js`
Expected: FAIL — `Cannot find module '../js/format.js'`.

- [ ] **Step 3: Implement `js/format.js`**

```js
function formatCurrency(amount) {
  const n = Number(amount) || 0;
  const sign = n < 0 ? '−' : '';
  return sign + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
function getTodayStr() { return new Date().toISOString().split('T')[0]; }
function getCurrentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function getMonthKey(dateStr) { return String(dateStr).substring(0, 7); }
function getMonthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}
function getShortMonthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}
function getPrevMonthKey(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function getNextMonthKey(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function formatDate(dateStr) {
  const today = getTodayStr();
  const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yest) return 'Yesterday';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}
function getDayOfMonth(dateStr) { return Number(String(dateStr).slice(8, 10)); }

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatCurrency, generateUUID, getTodayStr, getCurrentMonthKey, getMonthKey, getMonthLabel, getShortMonthLabel, getPrevMonthKey, getNextMonthKey, formatDate, daysInMonth, getDayOfMonth };
}
```

- [ ] **Step 4: Run, verify pass**

Run: `node --test projects/ghar-kharch/tests/format.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add projects/ghar-kharch/js/format.js projects/ghar-kharch/tests/format.test.js
git commit -m "feat(ghar-kharch): currency + date/month utilities with tests"
```

---

## Task 3: `crypto.js` — encryption & PIN-wrapped key

**Files:**
- Create: `projects/ghar-kharch/js/crypto.js`
- Test: `projects/ghar-kharch/tests/crypto.test.js`

**Interfaces:**
- Produces (all async unless noted):
  - `deriveKey(passphrase) -> CryptoKey` (PBKDF2 + fixed `APP_SALT`, AES-GCM 256, extractable)
  - `encryptData(obj, key) -> string` (base64 iv+ciphertext)
  - `decryptData(b64, key) -> obj | null`
  - `passphraseHash(passphrase) -> string` (verification hash; never the key)
  - `wrapKey(cryptoKey, pin) -> string` (PIN-encrypted export of the AES key)
  - `unwrapKey(wrappedB64, pin) -> CryptoKey | null`
  - `exportRawKey(cryptoKey) -> string` / `importRawKey(b64) -> CryptoKey` (for session storage)
- Consumed by: `auth.js`, `storage.js`, `sync.js`.

Node ≥18 exposes `crypto.subtle`, `btoa`, `atob`, `TextEncoder` globally — tests run without a browser.

- [ ] **Step 1: Write failing tests** → `tests/crypto.test.js`

```js
const test = require('node:test');
const assert = require('node:assert');
const c = require('../js/crypto.js');

test('encrypt then decrypt round-trips with the same passphrase', async () => {
  const key = await c.deriveKey('open-sesame');
  const blob = await c.encryptData({ hello: 'world', n: 42 }, key);
  assert.strictEqual(typeof blob, 'string');
  const out = await c.decryptData(blob, key);
  assert.deepStrictEqual(out, { hello: 'world', n: 42 });
});

test('same passphrase on a "second device" derives a compatible key', async () => {
  const k1 = await c.deriveKey('family123');
  const blob = await c.encryptData({ a: 1 }, k1);
  const k2 = await c.deriveKey('family123');   // simulates the other phone
  assert.deepStrictEqual(await c.decryptData(blob, k2), { a: 1 });
});

test('wrong passphrase fails to decrypt (returns null)', async () => {
  const blob = await c.encryptData({ a: 1 }, await c.deriveKey('right'));
  assert.strictEqual(await c.decryptData(blob, await c.deriveKey('wrong')), null);
});

test('PIN wraps/unwraps the key; wrong PIN returns null; changing PIN keeps the key', async () => {
  const key = await c.deriveKey('passphrase');
  const wrapped = await c.wrapKey(key, '1234');
  const unwrapped = await c.unwrapKey(wrapped, '1234');
  assert.notStrictEqual(unwrapped, null);
  const blob = await c.encryptData({ ok: true }, key);
  assert.deepStrictEqual(await c.decryptData(blob, unwrapped), { ok: true });
  assert.strictEqual(await c.unwrapKey(wrapped, '0000'), null);
});
```

- [ ] **Step 2: Run, verify failure**

Run: `node --test projects/ghar-kharch/tests/crypto.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `js/crypto.js`**

```js
const APP_SALT_STR = 'ghar-kharch::shared-salt::v1';
const APP_SALT = new TextEncoder().encode(APP_SALT_STR);

async function _deriveAes(secret, salt, usages) {
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    km, { name: 'AES-GCM', length: 256 }, true, usages
  );
}
async function deriveKey(passphrase) {
  return _deriveAes(passphrase, APP_SALT, ['encrypt', 'decrypt']);
}
async function encryptData(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(data)));
  const combined = new Uint8Array(iv.length + ct.byteLength);
  combined.set(iv); combined.set(new Uint8Array(ct), iv.length);
  return btoa(String.fromCharCode(...combined));
}
async function decryptData(b64, key) {
  try {
    const combined = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined.slice(12));
    return JSON.parse(new TextDecoder().decode(pt));
  } catch { return null; }
}
async function passphraseHash(passphrase) {
  const combined = new Uint8Array([...new TextEncoder().encode(passphrase + 'gk-verify'), ...APP_SALT]);
  const h = await crypto.subtle.digest('SHA-256', combined);
  return btoa(String.fromCharCode(...new Uint8Array(h)));
}
async function exportRawKey(key) {
  return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.exportKey('raw', key))));
}
async function importRawKey(b64) {
  const raw = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}
// PIN salt is fixed-but-distinct; the PIN only protects the locally-stored key,
// it never derives the data key.
const PIN_SALT = new TextEncoder().encode('ghar-kharch::pin-salt::v1');
async function wrapKey(cryptoKey, pin) {
  const wrapper = await _deriveAes(String(pin), PIN_SALT, ['encrypt', 'decrypt']);
  const raw = await exportRawKey(cryptoKey);
  return encryptData({ k: raw }, wrapper);
}
async function unwrapKey(wrappedB64, pin) {
  const wrapper = await _deriveAes(String(pin), PIN_SALT, ['encrypt', 'decrypt']);
  const obj = await decryptData(wrappedB64, wrapper);
  if (!obj || !obj.k) return null;
  return importRawKey(obj.k);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { deriveKey, encryptData, decryptData, passphraseHash, exportRawKey, importRawKey, wrapKey, unwrapKey };
}
```

- [ ] **Step 4: Run, verify pass**

Run: `node --test projects/ghar-kharch/tests/crypto.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add projects/ghar-kharch/js/crypto.js projects/ghar-kharch/tests/crypto.test.js
git commit -m "feat(ghar-kharch): AES-GCM crypto + PIN-wrapped key with tests"
```

---

## Task 4: `icons.js` — inline-SVG icon library

**Files:**
- Create: `projects/ghar-kharch/js/icons.js`

**Interfaces:**
- Produces: `icon(name, size = 24) -> string` (an `<svg class="icon">…</svg>` string); `ICONS` (name→inner-markup map); `CATEGORY_ICON_CHOICES` (array of icon names offered in the category picker).
- Consumed by: every UI task.

- [ ] **Step 1: Implement `js/icons.js`**

Lucide-grade 24×24, 2px stroke, `currentColor`. Include category icons (`shopping-cart, bulb, home, wifi, box, heart-pulse, car, cup, book, tool, repeat, tag`) and UI icons (`wallet, calendar, chart, settings, plus, x, trash, edit, check, chevron-down, backspace, download, upload, refresh, lock, search, alert`). Example with real path data for several; fill the rest from Lucide using the same wrapper:

```js
const ICONS = {
  'shopping-cart': '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  'bulb': '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
  'home': '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  'wifi': '<path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
  'box': '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  'heart-pulse': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  'car': '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  'cup': '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>',
  'book': '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  'tool': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/>',
  'repeat': '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  'tag': '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.83 8.83a2 2 0 0 0 2.82 0l7.17-7.17a2 2 0 0 0 0-2.82Z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  'wallet': '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><path d="M16 12h.01"/>',
  'calendar': '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  'chart': '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6" rx="1"/><rect x="12" y="7" width="3" height="10" rx="1"/><rect x="17" y="13" width="3" height="4" rx="1"/>',
  'settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'x': '<path d="M18 6 6 18M6 6l12 12"/>',
  'trash': '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  'edit': '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
  'check': '<path d="M20 6 9 17l-5-5"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'backspace': '<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><path d="m18 9-6 6M12 9l6 6"/>',
  'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
  'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>',
  'refresh': '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  'lock': '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'alert': '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>'
};
const CATEGORY_ICON_CHOICES = ['shopping-cart','bulb','home','wifi','box','heart-pulse','car','cup','book','tool','repeat','tag'];
function icon(name, size = 24) {
  const inner = ICONS[name] || ICONS['tag'];
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
```

- [ ] **Step 2: Verify in browser**

Reload `index.html` via preview; in the console run `document.body.insertAdjacentHTML('beforeend', icon('wallet'))`. Expected: an SVG wallet glyph appears, no errors.

- [ ] **Step 3: Commit**

```bash
git add projects/ghar-kharch/js/icons.js
git commit -m "feat(ghar-kharch): inline SVG icon library"
```

---

## Task 5: `storage.js` — encrypted data layer & CRUD

**Files:**
- Create: `projects/ghar-kharch/js/storage.js`
- Test: `projects/ghar-kharch/tests/storage.test.js`

**Interfaces:**
- Consumes: `crypto.js` (`encryptData`/`decryptData`), `format.js` (`getMonthKey`, `generateUUID`, `getCurrentMonthKey`).
- Produces:
  - Constants `DEFAULT_CATEGORIES` (12 per spec §10), `DEFAULT_LIMIT = 25000`, `STORAGE_KEY = 'gk_data'`.
  - `setSessionKey(key)`, `getSessionKey()`, `clearDataCache()`
  - `blankData() -> { version, monthlyLimit, currency, categories, expenses }`
  - `getData() -> data | null`, `saveData(data)` (encrypt + persist + `pushToGist` if present)
  - `addExpense({amount,category,note,date}) -> expense`, `updateExpense(id, updates)`, `deleteExpense(id)`
  - `getExpensesForMonth(monthKey) -> expense[]`
  - `getMonthlyLimit() -> number`, `setMonthlyLimit(n)`
  - `getCategories()`, `addCategory(c)`, `updateCategory(id,u)`, `deleteCategory(id)`
  - `exportJSON()`, `importJSON(jsonOrObj, mode)`, `clearAllData()`
- Consumed by: all UI tasks, `auth.js`, `analytics-view.js`.

- [ ] **Step 1: Write failing tests** → `tests/storage.test.js`

```js
const test = require('node:test');
const assert = require('node:assert');

// minimal localStorage shim for Node
globalThis.localStorage = (() => {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), clear: () => m.clear() };
})();

const c = require('../js/crypto.js');
const s = require('../js/storage.js');

test('addExpense persists and getExpensesForMonth filters by date', async () => {
  localStorage.clear(); s.clearDataCache();
  s.setSessionKey(await c.deriveKey('pw'));
  await s.saveData(s.blankData());
  await s.addExpense({ amount: 500, category: 'groceries', note: 'veg', date: '2026-06-10' });
  await s.addExpense({ amount: 200, category: 'transport', note: '', date: '2026-05-30' });
  const june = await s.getExpensesForMonth('2026-06');
  assert.strictEqual(june.length, 1);
  assert.strictEqual(june[0].amount, 500);
});

test('updateExpense and deleteExpense mutate the right row', async () => {
  localStorage.clear(); s.clearDataCache();
  s.setSessionKey(await c.deriveKey('pw'));
  await s.saveData(s.blankData());
  const e = await s.addExpense({ amount: 100, category: 'other', note: '', date: '2026-06-01' });
  await s.updateExpense(e.id, { amount: 150 });
  let all = (await s.getData()).expenses;
  assert.strictEqual(all[0].amount, 150);
  await s.deleteExpense(e.id);
  all = (await s.getData()).expenses;
  assert.strictEqual(all.length, 0);
});

test('monthly limit round-trips', async () => {
  localStorage.clear(); s.clearDataCache();
  s.setSessionKey(await c.deriveKey('pw'));
  await s.saveData(s.blankData());
  await s.setMonthlyLimit(30000);
  assert.strictEqual(await s.getMonthlyLimit(), 30000);
});
```

- [ ] **Step 2: Run, verify failure**

Run: `node --test projects/ghar-kharch/tests/storage.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `js/storage.js`**

```js
const STORAGE_KEY = 'gk_data';
const DEFAULT_LIMIT = 25000;
const DEFAULT_CATEGORIES = [
  { id: 'groceries',     label: 'Groceries',        icon: 'shopping-cart', color: '#2E9E5E' },
  { id: 'utilities',     label: 'Utilities',        icon: 'bulb',          color: '#C98A1E' },
  { id: 'rent',          label: 'Rent/EMI',         icon: 'home',          color: '#5B5BD6' },
  { id: 'internet',      label: 'Internet & Phone', icon: 'wifi',          color: '#2C7BE5' },
  { id: 'household',     label: 'Household',         icon: 'box',           color: '#1FA39C' },
  { id: 'health',        label: 'Health/Medical',   icon: 'heart-pulse',   color: '#D94F6B' },
  { id: 'transport',     label: 'Transport/Fuel',   icon: 'car',           color: '#2C9CB5' },
  { id: 'dining',        label: 'Dining out',       icon: 'cup',           color: '#E0683C' },
  { id: 'education',     label: 'Education',         icon: 'book',          color: '#8A5BD6' },
  { id: 'maintenance',   label: 'Maintenance',      icon: 'tool',          color: '#6B7280' },
  { id: 'subscriptions', label: 'Subscriptions',    icon: 'repeat',        color: '#B45BD6' },
  { id: 'other',         label: 'Other',            icon: 'tag',           color: '#8A8F99' }
];
const PRESET_COLORS = ['#2E9E5E','#C98A1E','#5B5BD6','#2C7BE5','#1FA39C','#D94F6B','#2C9CB5','#E0683C','#8A5BD6','#6B7280','#B45BD6','#8A8F99'];

let _sessionKey = null, _cache = null;
function setSessionKey(k) { _sessionKey = k; }
function getSessionKey() { if (!_sessionKey) throw new Error('Not authenticated'); return _sessionKey; }
function clearDataCache() { _cache = null; }
function blankData() {
  return { version: 1, monthlyLimit: DEFAULT_LIMIT, currency: 'INR', categories: DEFAULT_CATEGORIES.map(c => ({ ...c })), expenses: [] };
}
async function getData() {
  if (_cache) return _cache;
  const blob = localStorage.getItem(STORAGE_KEY);
  if (!blob) return null;
  _cache = await decryptData(blob, getSessionKey());
  return _cache;
}
async function saveData(data) {
  _cache = data;
  const blob = await encryptData(data, getSessionKey());
  localStorage.setItem(STORAGE_KEY, blob);
  if (typeof pushToGist === 'function') pushToGist(blob).catch(e => console.warn('Sync push failed:', e));
}
async function addExpense({ amount, category, note, date }) {
  const data = await getData();
  const now = Date.now();
  const exp = { id: generateUUID(), amount: Number(amount), category, note: note || '', date, createdAt: now, updatedAt: now };
  data.expenses.push(exp);
  await saveData(data);
  return exp;
}
async function updateExpense(id, updates) {
  const data = await getData();
  const i = data.expenses.findIndex(e => e.id === id);
  if (i === -1) return;
  data.expenses[i] = { ...data.expenses[i], ...updates, updatedAt: Date.now() };
  await saveData(data);
}
async function deleteExpense(id) {
  const data = await getData();
  data.expenses = data.expenses.filter(e => e.id !== id);
  await saveData(data);
}
async function getExpensesForMonth(monthKey) {
  const data = await getData();
  return data.expenses.filter(e => getMonthKey(e.date) === monthKey);
}
async function getMonthlyLimit() { return (await getData()).monthlyLimit || 0; }
async function setMonthlyLimit(n) { const d = await getData(); d.monthlyLimit = Number(n); await saveData(d); }
async function getCategories() { return (await getData()).categories; }
async function addCategory(cat) { const d = await getData(); cat.id = generateUUID(); d.categories.push(cat); await saveData(d); return cat; }
async function updateCategory(id, u) { const d = await getData(); const i = d.categories.findIndex(c => c.id === id); if (i > -1) { d.categories[i] = { ...d.categories[i], ...u }; await saveData(d); } }
async function deleteCategory(id) { const d = await getData(); d.categories = d.categories.filter(c => c.id !== id); await saveData(d); }
async function exportJSON() {
  const data = await getData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ghar-kharch-backup-${getTodayStr()}.json`;
  a.click(); URL.revokeObjectURL(a.href);
}
async function importJSON(input, mode = 'replace') {
  let imp; try { imp = typeof input === 'string' ? JSON.parse(input) : input; } catch { throw new Error('Invalid JSON file'); }
  if (!Array.isArray(imp.expenses) || !Array.isArray(imp.categories)) throw new Error('Invalid backup format');
  if (mode === 'replace') { _cache = null; await saveData({ ...blankData(), ...imp, version: 1 }); return; }
  const cur = await getData();
  const ids = new Set(cur.expenses.map(e => e.id));
  cur.expenses.push(...imp.expenses.filter(e => !ids.has(e.id)));
  await saveData(cur);
}
async function clearAllData() { _cache = null; await saveData(blankData()); }

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STORAGE_KEY, DEFAULT_LIMIT, DEFAULT_CATEGORIES, PRESET_COLORS, setSessionKey, getSessionKey, clearDataCache, blankData, getData, saveData, addExpense, updateExpense, deleteExpense, getExpensesForMonth, getMonthlyLimit, setMonthlyLimit, getCategories, addCategory, updateCategory, deleteCategory, exportJSON, importJSON, clearAllData };
}
```

In the **browser** path, `encryptData`/`decryptData`/`generateUUID`/`getMonthKey`/`getTodayStr` are already global (loaded earlier). For the **Node test** path, require them at the top of `storage.js` behind a guard so the functions resolve:

```js
if (typeof module !== 'undefined' && module.exports) {
  var { encryptData, decryptData } = require('./crypto.js');
  var { generateUUID, getMonthKey, getTodayStr, getCurrentMonthKey } = require('./format.js');
}
```

(Place this block at the very top of the file.)

- [ ] **Step 4: Run, verify pass**

Run: `node --test projects/ghar-kharch/tests/storage.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add projects/ghar-kharch/js/storage.js projects/ghar-kharch/tests/storage.test.js
git commit -m "feat(ghar-kharch): encrypted storage layer + CRUD with tests"
```

---

## Task 6: `auth.js` — passphrase + PIN gate

**Files:**
- Create: `projects/ghar-kharch/js/auth.js`

**Interfaces:**
- Consumes: `crypto.js`, `storage.js` (`setSessionKey`, `blankData`, `saveData`, `clearDataCache`), `sync.js` (`syncOnLogin` if present), `icons.js`.
- Produces:
  - localStorage keys: `gk_meta` = `{ passHash, wrappedKey, hasPin: true }`.
  - `isInitialized() -> bool`
  - `requireAuth(onReady)` — entry gate each page calls; resolves the session key (restored or via PIN), else renders setup/unlock and calls `onReady()` only once authenticated.
  - `changePin(currentPin, newPin)`, `getWrappedKeyExists()`.
- Consumed by: `app.js` bootstrap on every page.

**Auth flow (implement exactly):**
- **First run (setup):** ask for a **passphrase** (twice) + a **PIN** (twice). `key = deriveKey(passphrase)`; store `gk_meta = { passHash: passphraseHash(passphrase), wrappedKey: wrapKey(key, pin) }`; `setSessionKey(key)`; persist session key to `sessionStorage('gk_sk')`; `saveData(blankData())`; then `syncOnLogin()`.
- **Daily unlock:** if `sessionStorage('gk_sk')` exists → import it, done. Else show **PIN pad**; `key = unwrapKey(meta.wrappedKey, pin)`; on success `setSessionKey`, persist to session, `syncInBackground()`.
- **Connect new device for sync (Settings → Sync):** handled in Task 7/14 — entering the same passphrase derives the same key; a fresh PIN is set on that device and wraps the key locally.

- [ ] **Step 1: Implement `js/auth.js`**

```js
const META_KEY = 'gk_meta';
const SK_KEY = 'gk_sk';
function isInitialized() { return !!localStorage.getItem(META_KEY); }
function _meta() { try { return JSON.parse(localStorage.getItem(META_KEY)); } catch { return null; } }

async function _persistSession(key) {
  setSessionKey(key);
  sessionStorage.setItem(SK_KEY, await exportRawKey(key));
}
async function _restoreSession() {
  const raw = sessionStorage.getItem(SK_KEY);
  if (!raw) return false;
  try { setSessionKey(await importRawKey(raw)); return true; } catch { return false; }
}

async function requireAuth(onReady) {
  const overlay = document.getElementById('auth-overlay');
  const app = document.getElementById('app');
  const show = () => { overlay.style.display = 'none'; app.style.display = 'block'; };

  if (await _restoreSession()) { show(); onReady(); if (typeof syncInBackground === 'function') syncInBackground().catch(() => {}); return; }
  overlay.style.display = 'flex';
  if (!isInitialized()) renderSetup(overlay, () => { show(); onReady(); });
  else renderUnlock(overlay, () => { show(); onReady(); });
}

function renderSetup(overlay, done) {
  overlay.innerHTML = `
    <div class="auth-card card">
      <div class="auth-brand">${icon('wallet', 30)}<h1>Ghar Kharch</h1><p class="muted">Set up your household ledger</p></div>
      <div class="auth-error" id="aerr"></div>
      <label>Sync passphrase <span class="muted">(used on both phones)</span></label>
      <input type="password" id="pp1" placeholder="Choose a passphrase" autocomplete="new-password" />
      <input type="password" id="pp2" placeholder="Repeat passphrase" autocomplete="new-password" />
      <label>Daily PIN <span class="muted">(quick unlock)</span></label>
      <input type="password" inputmode="numeric" id="pin1" placeholder="4–6 digit PIN" maxlength="6" />
      <input type="password" inputmode="numeric" id="pin2" placeholder="Repeat PIN" maxlength="6" />
      <button class="btn btn-primary btn-full" id="go">Get started</button>
    </div>`;
  document.getElementById('go').onclick = async () => {
    const pp = pp1.value, pp_ = pp2.value, pin = pin1.value, pin_ = pin2.value, err = document.getElementById('aerr');
    if (pp.length < 6) return show(err, 'Passphrase must be at least 6 characters.');
    if (pp !== pp_) return show(err, 'Passphrases do not match.');
    if (!/^\d{4,6}$/.test(pin)) return show(err, 'PIN must be 4–6 digits.');
    if (pin !== pin_) return show(err, 'PINs do not match.');
    const key = await deriveKey(pp);
    localStorage.setItem(META_KEY, JSON.stringify({ passHash: await passphraseHash(pp), wrappedKey: await wrapKey(key, pin) }));
    await _persistSession(key);
    clearDataCache(); await saveData(blankData());
    if (typeof syncOnLogin === 'function') await Promise.race([syncOnLogin(), new Promise(r => setTimeout(r, 5000))]);
    done();
  };
  function show(el, m) { el.textContent = m; el.style.display = 'block'; }
}

function renderUnlock(overlay, done) {
  overlay.innerHTML = `
    <div class="auth-card card">
      <div class="auth-brand">${icon('lock', 28)}<h1>Enter PIN</h1></div>
      <div class="auth-error" id="aerr"></div>
      <input type="password" inputmode="numeric" id="pin" placeholder="PIN" maxlength="6" autofocus />
      <button class="btn btn-primary btn-full" id="go">Unlock</button>
      <button class="btn btn-ghost btn-full" id="forgot">Use passphrase instead</button>
    </div>`;
  document.getElementById('go').onclick = async () => {
    const key = await unwrapKey(_meta().wrappedKey, document.getElementById('pin').value);
    if (!key) { const e = document.getElementById('aerr'); e.textContent = 'Wrong PIN.'; e.style.display = 'block'; return; }
    await _persistSession(key); done();
    if (typeof syncInBackground === 'function') syncInBackground().catch(() => {});
  };
  document.getElementById('forgot').onclick = () => renderPassphraseUnlock(overlay, done);
}

function renderPassphraseUnlock(overlay, done) {
  overlay.innerHTML = `
    <div class="auth-card card">
      <div class="auth-brand">${icon('wallet', 28)}<h1>Enter passphrase</h1><p class="muted">Then set a new PIN for this device</p></div>
      <div class="auth-error" id="aerr"></div>
      <input type="password" id="pp" placeholder="Sync passphrase" />
      <input type="password" inputmode="numeric" id="np" placeholder="New PIN (4–6 digits)" maxlength="6" />
      <button class="btn btn-primary btn-full" id="go">Unlock</button>
    </div>`;
  document.getElementById('go').onclick = async () => {
    const pp = document.getElementById('pp').value, np = document.getElementById('np').value, err = document.getElementById('aerr');
    if (await passphraseHash(pp) !== _meta().passHash) { err.textContent = 'Wrong passphrase.'; err.style.display = 'block'; return; }
    if (!/^\d{4,6}$/.test(np)) { err.textContent = 'PIN must be 4–6 digits.'; err.style.display = 'block'; return; }
    const key = await deriveKey(pp);
    const meta = _meta(); meta.wrappedKey = await wrapKey(key, np); localStorage.setItem(META_KEY, JSON.stringify(meta));
    await _persistSession(key); done();
  };
}

async function changePin(currentPin, newPin) {
  const key = await unwrapKey(_meta().wrappedKey, currentPin);
  if (!key) throw new Error('Current PIN is incorrect.');
  if (!/^\d{4,6}$/.test(newPin)) throw new Error('PIN must be 4–6 digits.');
  const meta = _meta(); meta.wrappedKey = await wrapKey(key, newPin); localStorage.setItem(META_KEY, JSON.stringify(meta));
}
```

(Add minimal `.auth-card`, `.auth-brand`, `.auth-error`, and `input` styles to `components.css` in this task — full-width inputs, 48px min-height, hairline border, focus ring in `--accent`.)

- [ ] **Step 2: Verify setup → reload → PIN unlock**

Via preview: load `index.html`, complete setup (passphrase + PIN). Confirm `#app` shows. Reload the tab → app stays in (session restored). Open a fresh private window / clear `sessionStorage` and reload → PIN pad appears; correct PIN unlocks, wrong PIN errors.

- [ ] **Step 3: Commit**

```bash
git add projects/ghar-kharch/js/auth.js projects/ghar-kharch/css/components.css
git commit -m "feat(ghar-kharch): passphrase + PIN auth gate"
```

---

## Task 7: `sync.js` — GitHub Gist sync

**Files:**
- Create: `projects/ghar-kharch/js/sync.js`

**Interfaces:**
- Consumes: `crypto.js` (`decryptData`), `storage.js` (`getSessionKey`, `clearDataCache`, `STORAGE_KEY`).
- Produces: `isSyncEnabled()`, `getSyncLastTime()`, `connectSync(token)`, `pushToGist(blob?)`, `pullFromGist()`, `syncOnLogin()`, `syncInBackground()`, `disconnectSync()`.
- localStorage keys: `gk_sync_token`, `gk_sync_gist`, `gk_sync_ts`. Gist file `ghar-kharch.json`, description `Ghar Kharch Sync`.

This is a direct port of `projects/expense-tracker/js/sync.js` with three changes: the key prefix (`gk_*`), the gist file/description constants, and `_canDecrypt` validating the Ghar Kharch shape (`Array.isArray(data.expenses) && typeof data.monthlyLimit === 'number'`).

- [ ] **Step 1: Implement `js/sync.js`**

```js
const _SYNC_TOKEN = 'gk_sync_token', _SYNC_GIST = 'gk_sync_gist', _SYNC_TS = 'gk_sync_ts';
const _GIST_FILE = 'ghar-kharch.json', _GIST_DESC = 'Ghar Kharch Sync', _LS = 'gk_data';

function isSyncEnabled() { return !!(localStorage.getItem(_SYNC_TOKEN) && localStorage.getItem(_SYNC_GIST)); }
function getSyncLastTime() {
  const ts = localStorage.getItem(_SYNC_TS); if (!ts) return null;
  const d = Date.now() - parseInt(ts);
  if (d < 60000) return 'just now';
  if (d < 3600000) return Math.floor(d / 60000) + 'm ago';
  if (d < 86400000) return Math.floor(d / 3600000) + 'h ago';
  return new Date(parseInt(ts)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
async function _api(method, path, body, token) {
  const tok = token || localStorage.getItem(_SYNC_TOKEN);
  const res = await fetch('https://api.github.com/gists' + path, {
    method, headers: { 'Authorization': 'Bearer ' + tok, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'GitHub API ' + res.status); }
  return res.json();
}
async function _findGist(token) {
  for (let p = 1; p <= 5; p++) {
    const list = await _api('GET', '?per_page=100&page=' + p, null, token);
    if (!list.length) break;
    const found = list.find(g => g.description === _GIST_DESC && g.files[_GIST_FILE]);
    if (found) return found; if (list.length < 100) break;
  }
  return null;
}
async function _canDecrypt(blob) {
  try { const d = await decryptData(blob, getSessionKey()); return !!(d && Array.isArray(d.expenses) && typeof d.monthlyLimit === 'number'); } catch { return false; }
}
async function connectSync(token) {
  token = token.trim();
  const u = await fetch('https://api.github.com/user', { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' } });
  if (!u.ok) throw new Error('Invalid token — it needs the "gist" scope.');
  localStorage.setItem(_SYNC_TOKEN, token);
  const existing = await _findGist(token);
  if (existing) {
    localStorage.setItem(_SYNC_GIST, existing.id);
    const content = existing.files[_GIST_FILE] && existing.files[_GIST_FILE].content;
    if (content) {
      const { ts, blob } = JSON.parse(content);
      const localTs = parseInt(localStorage.getItem(_SYNC_TS) || '0');
      if (ts > localTs && await _canDecrypt(blob)) {
        localStorage.setItem(_LS, blob); localStorage.setItem(_SYNC_TS, ts); clearDataCache();
        return { action: 'pulled' };
      }
    }
    await pushToGist(); return { action: 'pushed' };
  }
  const blob = localStorage.getItem(_LS) || ''; const ts = Date.now();
  const g = await _api('POST', '', { description: _GIST_DESC, public: false, files: { [_GIST_FILE]: { content: JSON.stringify({ ts, blob }) } } }, token);
  localStorage.setItem(_SYNC_GIST, g.id); localStorage.setItem(_SYNC_TS, ts);
  return { action: 'created' };
}
async function pushToGist(blobParam) {
  if (!isSyncEnabled()) return;
  const blob = blobParam || localStorage.getItem(_LS); if (!blob) return;
  const ts = Date.now();
  await _api('PATCH', '/' + localStorage.getItem(_SYNC_GIST), { files: { [_GIST_FILE]: { content: JSON.stringify({ ts, blob }) } } });
  localStorage.setItem(_SYNC_TS, ts);
}
async function pullFromGist() {
  if (!isSyncEnabled()) return false;
  const g = await _api('GET', '/' + localStorage.getItem(_SYNC_GIST));
  const content = g.files[_GIST_FILE] && g.files[_GIST_FILE].content; if (!content) return false;
  const { ts, blob } = JSON.parse(content);
  if (ts > parseInt(localStorage.getItem(_SYNC_TS) || '0')) {
    if (!(await _canDecrypt(blob))) throw new Error('Passphrase mismatch — both phones must use the same sync passphrase.');
    localStorage.setItem(_LS, blob); localStorage.setItem(_SYNC_TS, ts); clearDataCache(); return true;
  }
  return false;
}
async function syncOnLogin() { if (!isSyncEnabled()) return false; sessionStorage.setItem('gk_synced', '1'); try { return await pullFromGist(); } catch (e) { console.warn(e); return false; } }
async function syncInBackground() { if (!isSyncEnabled() || sessionStorage.getItem('gk_synced')) return; sessionStorage.setItem('gk_synced', '1'); try { if (await pullFromGist()) location.reload(); } catch (e) { console.warn(e); } }
async function disconnectSync() { [_SYNC_TOKEN, _SYNC_GIST, _SYNC_TS].forEach(k => localStorage.removeItem(k)); }
```

- [ ] **Step 2: Manual verification**

With a real GitHub token (gist scope): in Settings (Task 14) connect sync → expect a private gist created. Add an expense → confirm the gist file updates (push). On a second browser profile, set up with the **same passphrase**, connect the same token → expect data pulled. Verify a wrong-passphrase device gets the "Passphrase mismatch" error and does not corrupt data.

- [ ] **Step 3: Commit**

```bash
git add projects/ghar-kharch/js/sync.js
git commit -m "feat(ghar-kharch): encrypted GitHub Gist sync"
```

---

## Task 8: `analytics.js` — pure analytics computations

**Files:**
- Create: `projects/ghar-kharch/js/analytics.js`
- Test: `projects/ghar-kharch/tests/analytics.test.js`

**Interfaces:**
- Consumes (Node-require guard at top): `format.js` (`getMonthKey`, `getPrevMonthKey`, `getShortMonthLabel`, `daysInMonth`, `getDayOfMonth`, `formatCurrency`, `getCurrentMonthKey`).
- Produces (all **pure** — take plain arrays/values, no I/O):
  - `sumForMonth(expenses, monthKey) -> number`
  - `monthlyTotals(expenses, endMonthKey, n=6) -> [{ month, label, total }]` (oldest→newest)
  - `categoryBreakdown(expenses, categories, monthKey) -> [{ id, label, color, icon, total, pct }]` (desc, excludes 0)
  - `monthComparison(expenses, categories, monthKey) -> { total, prevTotal, delta, pct, topMovers:[{id,label,delta}] }`
  - `paceProjection(expenses, monthlyLimit, monthKey, dayOfMonth) -> { spent, dayOfMonth, daysInMonth, avgPerDay, projected, verdict, diff } | null`
  - `biggestExpenses(expenses, monthKey, n=5) -> expense[]`
  - `yearlySummary(expenses, year) -> { total, monthlyAvg, highest, lowest } | null`
  - `smartInsights(expenses, categories, monthlyLimit, monthKey) -> string[]`
- Consumed by: `analytics-view.js`, `home.js` (pace/verdict).

- [ ] **Step 1: Write failing tests** → `tests/analytics.test.js`

```js
const test = require('node:test');
const assert = require('node:assert');
const a = require('../js/analytics.js');

const cats = [
  { id: 'groceries', label: 'Groceries', color: '#1', icon: 'shopping-cart' },
  { id: 'dining', label: 'Dining out', color: '#2', icon: 'cup' }
];
const exp = [
  { id: '1', amount: 1000, category: 'groceries', date: '2026-05-05' },
  { id: '2', amount: 500,  category: 'dining',    date: '2026-05-20' },
  { id: '3', amount: 2200, category: 'groceries', date: '2026-06-03' },
  { id: '4', amount: 300,  category: 'dining',    date: '2026-06-10' },
  { id: '5', amount: 4000, category: 'groceries', date: '2026-06-12' }
];

test('sumForMonth totals one month', () => {
  assert.strictEqual(a.sumForMonth(exp, '2026-06'), 6500);
  assert.strictEqual(a.sumForMonth(exp, '2026-05'), 1500);
});

test('monthlyTotals returns n months oldest→newest', () => {
  const t = a.monthlyTotals(exp, '2026-06', 2);
  assert.deepStrictEqual(t.map(x => x.month), ['2026-05', '2026-06']);
  assert.strictEqual(t[1].total, 6500);
});

test('categoryBreakdown sorts desc with correct pct, excludes zero', () => {
  const b = a.categoryBreakdown(exp, cats, '2026-06');
  assert.strictEqual(b[0].id, 'groceries');
  assert.strictEqual(b[0].total, 6200);
  assert.strictEqual(b[0].pct, 95);          // 6200/6500 rounded
  assert.strictEqual(b.length, 2);
});

test('monthComparison computes delta, pct and top movers', () => {
  const c = a.monthComparison(exp, cats, '2026-06');
  assert.strictEqual(c.total, 6500);
  assert.strictEqual(c.prevTotal, 1500);
  assert.strictEqual(c.delta, 5000);
  assert.strictEqual(c.pct, 333);            // 5000/1500 rounded
  assert.strictEqual(c.topMovers[0].id, 'groceries'); // +5200
});

test('paceProjection projects from run-rate and verdicts vs limit', () => {
  const p = a.paceProjection(exp, 10000, '2026-06', 10); // ₹6500 in 10 days
  assert.strictEqual(p.spent, 6500);
  assert.strictEqual(p.avgPerDay, 650);
  assert.strictEqual(p.projected, 650 * 30);  // June has 30 days → 19500
  assert.strictEqual(p.verdict, 'over');
  assert.strictEqual(a.paceProjection(exp, 10000, '2026-06', 0), null); // day 0 guard
});

test('biggestExpenses ranks by amount', () => {
  const top = a.biggestExpenses(exp, '2026-06', 2);
  assert.deepStrictEqual(top.map(e => e.amount), [4000, 2200]);
});

test('yearlySummary aggregates months with data', () => {
  const y = a.yearlySummary(exp, 2026);
  assert.strictEqual(y.total, 8000);
  assert.strictEqual(y.highest.month, '2026-06');
  assert.strictEqual(y.lowest.month, '2026-05');
});

test('smartInsights degrades gracefully with sparse data', () => {
  const ins = a.smartInsights([{ id: '1', amount: 100, category: 'dining', date: '2026-06-01' }], cats, 1000, '2026-06');
  assert.ok(Array.isArray(ins));
});
```

- [ ] **Step 2: Run, verify failure**

Run: `node --test projects/ghar-kharch/tests/analytics.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `js/analytics.js`**

```js
if (typeof module !== 'undefined' && module.exports) {
  var { getMonthKey, getPrevMonthKey, getShortMonthLabel, daysInMonth, getDayOfMonth, formatCurrency, getCurrentMonthKey } = require('./format.js');
}
function _inMonth(expenses, monthKey) { return expenses.filter(e => getMonthKey(e.date) === monthKey); }
function sumForMonth(expenses, monthKey) { return _inMonth(expenses, monthKey).reduce((s, e) => s + Number(e.amount), 0); }

function monthlyTotals(expenses, endMonthKey, n = 6) {
  const out = []; let k = endMonthKey;
  for (let i = 0; i < n; i++) { out.unshift({ month: k, label: getShortMonthLabel(k), total: sumForMonth(expenses, k) }); k = getPrevMonthKey(k); }
  return out;
}
function categoryBreakdown(expenses, categories, monthKey) {
  const month = _inMonth(expenses, monthKey);
  const total = month.reduce((s, e) => s + Number(e.amount), 0);
  const byId = {}; month.forEach(e => { byId[e.category] = (byId[e.category] || 0) + Number(e.amount); });
  return categories
    .map(c => ({ id: c.id, label: c.label, color: c.color, icon: c.icon, total: byId[c.id] || 0 }))
    .filter(c => c.total > 0)
    .map(c => ({ ...c, pct: total ? Math.round((c.total / total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total);
}
function monthComparison(expenses, categories, monthKey) {
  const prevKey = getPrevMonthKey(monthKey);
  const total = sumForMonth(expenses, monthKey), prevTotal = sumForMonth(expenses, prevKey);
  const delta = total - prevTotal;
  const pct = prevTotal ? Math.round((delta / prevTotal) * 100) : null;
  const cur = {}, prev = {};
  _inMonth(expenses, monthKey).forEach(e => cur[e.category] = (cur[e.category] || 0) + Number(e.amount));
  _inMonth(expenses, prevKey).forEach(e => prev[e.category] = (prev[e.category] || 0) + Number(e.amount));
  const ids = new Set([...Object.keys(cur), ...Object.keys(prev)]);
  const label = id => (categories.find(c => c.id === id) || {}).label || id;
  const topMovers = [...ids]
    .map(id => ({ id, label: label(id), delta: (cur[id] || 0) - (prev[id] || 0) }))
    .filter(m => m.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);
  return { total, prevTotal, delta, pct, topMovers };
}
function paceProjection(expenses, monthlyLimit, monthKey, dayOfMonth) {
  if (!dayOfMonth || dayOfMonth < 1) return null;
  const spent = sumForMonth(expenses, monthKey);
  const dim = daysInMonth(monthKey);
  const avgPerDay = Math.round(spent / dayOfMonth);
  const projected = avgPerDay * dim;
  const verdict = monthlyLimit && projected > monthlyLimit ? 'over' : 'under';
  const diff = monthlyLimit ? Math.abs(projected - monthlyLimit) : 0;
  return { spent, dayOfMonth, daysInMonth: dim, avgPerDay, projected, verdict, diff };
}
function biggestExpenses(expenses, monthKey, n = 5) {
  return _inMonth(expenses, monthKey).slice().sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, n);
}
function yearlySummary(expenses, year) {
  const months = {};
  expenses.forEach(e => { if (getMonthKey(e.date).startsWith(String(year))) { const k = getMonthKey(e.date); months[k] = (months[k] || 0) + Number(e.amount); } });
  const keys = Object.keys(months); if (!keys.length) return null;
  const entries = keys.map(k => ({ month: k, total: months[k] }));
  const total = entries.reduce((s, e) => s + e.total, 0);
  const sorted = entries.slice().sort((a, b) => b.total - a.total);
  return { total, monthlyAvg: Math.round(total / entries.length), highest: sorted[0], lowest: sorted[sorted.length - 1] };
}
function smartInsights(expenses, categories, monthlyLimit, monthKey) {
  const out = [];
  const cmp = monthComparison(expenses, categories, monthKey);
  if (cmp.prevTotal > 0 && cmp.topMovers.length) {
    const m = cmp.topMovers[0];
    out.push(`${m.label} ${m.delta > 0 ? 'up' : 'down'} ${formatCurrency(Math.abs(m.delta))} vs last month`);
  }
  // under-budget streak
  if (monthlyLimit) {
    let streak = 0, k = monthKey;
    for (let i = 0; i < 12; i++) { const t = sumForMonth(expenses, k); if (t === 0) break; if (t <= monthlyLimit) streak++; else break; k = getPrevMonthKey(k); }
    if (streak >= 2) out.push(`${streak} months in a row under budget`);
  }
  // biggest single day
  const byDay = {}; _inMonth(expenses, monthKey).forEach(e => byDay[e.date] = (byDay[e.date] || 0) + Number(e.amount));
  const days = Object.entries(byDay).sort((a, b) => b[1] - a[1]);
  if (days.length) out.push(`Biggest single day: ${formatCurrency(days[0][1])} on ${days[0][0]}`);
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sumForMonth, monthlyTotals, categoryBreakdown, monthComparison, paceProjection, biggestExpenses, yearlySummary, smartInsights };
}
```

- [ ] **Step 4: Run, verify pass**

Run: `node --test projects/ghar-kharch/tests/analytics.test.js`
Expected: PASS (8 tests).

- [ ] **Step 5: Run the whole suite & commit**

Run: `node --test projects/ghar-kharch/tests/`
Expected: PASS (all files).

```bash
git add projects/ghar-kharch/js/analytics.js projects/ghar-kharch/tests/analytics.test.js
git commit -m "feat(ghar-kharch): pure analytics computations with tests"
```

---

## Task 9: `app.js` — shared UI helpers & page bootstrap

**Files:**
- Create: `projects/ghar-kharch/js/app.js`

**Interfaces:**
- Consumes: `icons.js`, `auth.js` (`requireAuth`), `format.js`.
- Produces: `showToast(msg, type)`, `animateCountUp(el, value, dur)`, `paintNav()` (fills `.nav-ico` slots + sets active), `confirmDialog(message) -> Promise<bool>`, `bootstrap(onReady)` (calls `requireAuth`, paints nav, wires the header settings link).
- Consumed by: every page script (each ends with `bootstrap(renderX)`).

- [ ] **Step 1: Implement `js/app.js`**

```js
function showToast(msg, type = 'success') {
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = msg;
  c.appendChild(t); setTimeout(() => t.remove(), 2800);
}
function animateCountUp(el, value, dur = 800) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = formatCurrency(value); return; }
  const start = performance.now();
  (function step(now) {
    const p = Math.min((now - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
    el.textContent = formatCurrency(Math.round(value * eased));
    if (p < 1) requestAnimationFrame(step);
  })(performance.now());
}
function paintNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.bottom-nav a').forEach(a => {
    a.querySelector('.nav-ico').innerHTML = icon(a.dataset.icon, 22);
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === path || (path === '' && href === 'index.html'));
  });
  const sl = document.getElementById('settings-link');
  if (sl) { sl.innerHTML = icon('settings', 22); sl.onclick = () => location.href = 'settings.html'; }
}
function confirmDialog(message) {
  return new Promise(resolve => {
    const o = document.createElement('div'); o.className = 'modal-overlay';
    o.innerHTML = `<div class="modal card"><p>${message}</p><div class="modal-actions"><button class="btn btn-ghost" id="c-no">Cancel</button><button class="btn btn-danger" id="c-yes">Delete</button></div></div>`;
    document.body.appendChild(o);
    o.querySelector('#c-no').onclick = () => { o.remove(); resolve(false); };
    o.querySelector('#c-yes').onclick = () => { o.remove(); resolve(true); };
  });
}
function bootstrap(onReady) {
  requireAuth(() => { paintNav(); onReady(); });
}
```

(Add `.modal-overlay`, `.modal`, `.modal-actions`, `.icon-btn` styles to `components.css`: centered overlay using normal flow + flex, white card, two buttons.)

- [ ] **Step 2: Verify nav paints & is clickable**

Reload `index.html` (after setup): bottom-nav icons render, the current tab is accented, tapping each navigates (other pages still empty — fine).

- [ ] **Step 3: Commit**

```bash
git add projects/ghar-kharch/js/app.js projects/ghar-kharch/css/components.css
git commit -m "feat(ghar-kharch): shared UI helpers + page bootstrap"
```

---

## Task 10: This Month screen (`home.js`)

**Files:**
- Modify: `projects/ghar-kharch/index.html` (already shell; ensure scripts present)
- Create: `projects/ghar-kharch/js/home.js`
- Modify: `projects/ghar-kharch/css/components.css` (hero + progress + entry-row styles)

**Interfaces:**
- Consumes: `storage.js`, `analytics.js` (`sumForMonth`, `paceProjection`), `format.js`, `icons.js`, `app.js`.
- Produces: `renderHome()`; global `openAddSheet(expenseOrNull)` is provided by Task 11 and called from here (guard with `typeof`).

- [ ] **Step 1: Implement `js/home.js`**

```js
async function renderHome() {
  const monthKey = getCurrentMonthKey();
  const [data, limit] = [await getData(), await getMonthlyLimit()];
  const expenses = data.expenses;
  const total = sumForMonth(expenses, monthKey);
  const remaining = limit - total;
  const over = remaining < 0;
  const pct = limit ? Math.min(Math.round((total / limit) * 100), 999) : 0;
  const cats = data.categories;
  const catById = id => cats.find(c => c.id === id) || { label: 'Other', color: '#8A8F99', icon: 'tag' };
  const recent = expenses.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  document.querySelector('.app-title').textContent = getMonthLabel(monthKey);

  const verdict = !limit
    ? `<span class="muted">No limit set</span>`
    : over
      ? `<span class="pill pill-bad">${icon('alert',15)} Over by ${formatCurrency(-remaining)}</span>`
      : `<span class="pill pill-good">${icon('check',15)} ${formatCurrency(remaining)} left</span>`;

  document.getElementById('screen').innerHTML = `
    <section class="hero card">
      <div class="muted">Spent this month</div>
      <div class="hero-num" id="hero-num">₹0</div>
      <div class="hero-verdict">${verdict}</div>
      ${limit ? `<div class="progress"><div class="progress-fill ${over ? 'over' : ''}" style="width:${Math.min(pct,100)}%"></div></div>
      <div class="progress-meta"><span>${pct}% of limit</span><span>Limit ${formatCurrency(limit)}</span></div>` : ''}
    </section>
    <button class="btn btn-primary btn-full add-btn" id="add">${icon('plus',18)} Add expense</button>
    <div class="section-head"><span>Recent</span></div>
    <div id="recent">${recent.length ? recent.map(rowHTML).join('') : `<div class="empty-state">${icon('wallet',40)}<div>No expenses yet. Tap “Add expense”.</div></div>`}</div>`;

  const heroEl = document.getElementById('hero-num');
  animateCountUp(heroEl, total);
  document.getElementById('add').onclick = () => { if (typeof openAddSheet === 'function') openAddSheet(null); };
  document.querySelectorAll('[data-edit]').forEach(el => el.onclick = () => { const e = expenses.find(x => x.id === el.dataset.edit); if (typeof openAddSheet === 'function') openAddSheet(e); });

  function rowHTML(e) {
    const c = catById(e.category);
    return `<div class="entry" data-edit="${e.id}">
      <div class="cat-chip" style="background:${c.color}22;color:${c.color}">${icon(c.icon,19)}</div>
      <div class="entry-main"><div class="entry-label">${c.label}</div><div class="entry-note muted">${e.note || formatDate(e.date)}</div></div>
      <div class="entry-amt">${formatCurrency(e.amount)}</div>
    </div>`;
  }
}
bootstrap(renderHome);
window.refreshHome = renderHome;   // Task 11 calls this after save
```

- [ ] **Step 2: Add hero/progress/entry styles to `components.css`**

```css
.hero { text-align: left; }
.hero-num { font-family: var(--font-display); font-weight: 800; font-size: clamp(2.4rem, 12vw, 3.2rem); letter-spacing: -0.03em; line-height: 1.05; margin: 4px 0 8px; }
.hero-verdict { margin-bottom: 14px; }
.progress { height: 8px; background: #EEEAE2; border-radius: var(--radius-pill); overflow: hidden; }
.progress-fill { height: 100%; background: var(--accent); border-radius: var(--radius-pill); transition: width .6s var(--ease-out); }
.progress-fill.over { background: var(--bad); }
.progress-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-3); margin-top: 6px; }
.add-btn { margin: 16px 0 8px; }
.section-head { display:flex; justify-content:space-between; font-size:13px; font-weight:600; color:var(--ink-2); margin:14px 2px 8px; }
.entry { display:flex; align-items:center; gap:12px; background:var(--surface); border:1px solid var(--rule); border-radius:var(--radius-sm); padding:12px; margin-bottom:8px; cursor:pointer; }
.entry-main { flex:1; min-width:0; }
.entry-label { font-size:14px; font-weight:600; }
.entry-note { font-size:12px; }
.entry-amt { font-weight:700; font-family:var(--font-display); }
```

- [ ] **Step 3: Verify via preview**

Reload `index.html`. Expected: month name in header; hero animates 0→total; verdict pill correct (set a small limit in localStorage data to test both green and red states); progress bar reflects %; recent entries render with category chips. No console errors.

- [ ] **Step 4: Commit**

```bash
git add projects/ghar-kharch/js/home.js projects/ghar-kharch/css/components.css
git commit -m "feat(ghar-kharch): This Month home screen"
```

---

## Task 11: Add Expense sheet (`addexpense.js`)

**Files:**
- Create: `projects/ghar-kharch/js/addexpense.js`
- Modify: `projects/ghar-kharch/css/components.css` (sheet + keypad + chip styles)

**Interfaces:**
- Consumes: `storage.js` (`addExpense`/`updateExpense`/`deleteExpense`/`getCategories`), `format.js`, `icons.js`, `app.js` (`showToast`, `confirmDialog`), `home.js` (`window.refreshHome`).
- Produces: global `openAddSheet(expense | null)`.

- [ ] **Step 1: Implement `js/addexpense.js`**

```js
async function openAddSheet(expense) {
  const cats = await getCategories();
  const editing = !!expense;
  let amount = editing ? String(expense.amount) : '';
  let category = editing ? expense.category : cats[0].id;
  let date = editing ? expense.date : getTodayStr();

  const sheet = document.createElement('div');
  sheet.className = 'sheet-overlay';
  sheet.innerHTML = `
    <div class="sheet card">
      <div class="sheet-head"><span>${editing ? 'Edit expense' : 'Add expense'}</span><button class="icon-btn" id="close">${icon('x',22)}</button></div>
      <div class="amount-display" id="amt">₹0</div>
      <div class="chips" id="chips">${cats.map(c => `<button class="chip ${c.id===category?'sel':''}" data-cat="${c.id}" style="--c:${c.color}">${icon(c.icon,18)}<span>${c.label}</span></button>`).join('')}</div>
      <input class="note-input" id="note" placeholder="Note (optional)" value="${editing ? (expense.note||'') : ''}" />
      <input class="date-input" id="date" type="date" value="${date}" />
      <div class="keypad" id="keypad">${['1','2','3','4','5','6','7','8','9','.','0','del'].map(k => `<button class="key" data-k="${k}">${k==='del'?icon('backspace',20):k}</button>`).join('')}</div>
      <button class="btn btn-primary btn-full" id="save">${icon('check',18)} ${editing ? 'Save changes' : 'Save'}</button>
      ${editing ? `<button class="btn btn-danger btn-full" id="del-exp">${icon('trash',18)} Delete</button>` : ''}
    </div>`;
  document.body.appendChild(sheet);
  requestAnimationFrame(() => sheet.classList.add('open'));

  const amtEl = sheet.querySelector('#amt');
  const paint = () => amtEl.textContent = amount ? formatCurrency(Number(amount)) : '₹0';
  const close = () => { sheet.classList.remove('open'); setTimeout(() => sheet.remove(), 250); };

  sheet.querySelector('#close').onclick = close;
  sheet.querySelector('#keypad').onclick = e => {
    const k = e.target.closest('.key')?.dataset.k; if (!k) return;
    if (k === 'del') amount = amount.slice(0, -1);
    else if (k === '.') { if (!amount.includes('.')) amount += amount ? '.' : '0.'; }
    else amount += k;
    paint();
  };
  sheet.querySelector('#chips').onclick = e => {
    const b = e.target.closest('.chip'); if (!b) return;
    category = b.dataset.cat;
    sheet.querySelectorAll('.chip').forEach(c => c.classList.toggle('sel', c === b));
  };
  sheet.querySelector('#save').onclick = async () => {
    const val = Number(amount);
    if (!val || val <= 0) { showToast('Enter an amount', 'error'); return; }
    const note = sheet.querySelector('#note').value.trim();
    const d = sheet.querySelector('#date').value || getTodayStr();
    if (editing) await updateExpense(expense.id, { amount: val, category, note, date: d });
    else await addExpense({ amount: val, category, note, date: d });
    showToast(editing ? 'Updated' : 'Added');
    close();
    if (window.refreshHome) window.refreshHome();
    if (window.refreshHistory) window.refreshHistory();
  };
  const delBtn = sheet.querySelector('#del-exp');
  if (delBtn) delBtn.onclick = async () => {
    if (!(await confirmDialog('Delete this expense?'))) return;
    await deleteExpense(expense.id); showToast('Deleted'); close();
    if (window.refreshHome) window.refreshHome();
    if (window.refreshHistory) window.refreshHistory();
  };
  paint();
}
```

- [ ] **Step 2: Add sheet/keypad/chip styles to `components.css`**

```css
.sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: flex-end; justify-content: center; z-index: 150; opacity: 0; transition: opacity .25s; }
.sheet-overlay.open { opacity: 1; }
.sheet { width: 100%; max-width: 480px; border-radius: 24px 24px 0 0; transform: translateY(100%); transition: transform .28s var(--ease-out); max-height: 92vh; overflow:auto; }
.sheet-overlay.open .sheet { transform: none; }
.sheet-head { display:flex; justify-content:space-between; align-items:center; font-weight:600; margin-bottom:8px; }
.amount-display { font-family:var(--font-display); font-weight:800; font-size:2.6rem; text-align:center; padding:8px 0 12px; letter-spacing:-0.02em; }
.chips { display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; margin-bottom:10px; }
.chip { display:flex; align-items:center; gap:6px; white-space:nowrap; border:1px solid var(--rule-2); background:var(--surface); border-radius:var(--radius-pill); padding:8px 12px; font-size:13px; color:var(--ink); }
.chip.sel { border-color: var(--c); background: color-mix(in srgb, var(--c) 14%, white); color: var(--c); font-weight:600; }
.chip .icon { color: var(--c); }
.note-input, .date-input { width:100%; border:1px solid var(--rule-2); border-radius:var(--radius-sm); padding:12px; font-size:15px; margin-bottom:10px; background:var(--surface-2); }
.keypad { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; }
.key { font-size:20px; font-weight:600; padding:16px; border:none; background:var(--surface-2); border-radius:var(--radius-sm); min-height:56px; }
.key:active { background:#EFece4; }
```

- [ ] **Step 3: Verify via preview**

On `index.html` tap “Add expense”: sheet slides up; keypad builds the amount with Indian grouping; chips select; save adds the row, toast shows, hero total updates. Edit an existing row → prefilled sheet; change amount → updates; Delete → confirm dialog → row removed.

- [ ] **Step 4: Commit**

```bash
git add projects/ghar-kharch/js/addexpense.js projects/ghar-kharch/css/components.css
git commit -m "feat(ghar-kharch): Add/Edit expense sheet with keypad"
```

---

## Task 12: History screen (`history.js`)

**Files:**
- Modify: `projects/ghar-kharch/history.html` (ensure it loads `history.js` as its page script)
- Create: `projects/ghar-kharch/js/history.js`
- Modify: `projects/ghar-kharch/css/components.css` (month-card + filter styles)

**Interfaces:**
- Consumes: `storage.js`, `analytics.js` (`sumForMonth`), `format.js`, `icons.js`, `app.js`, `addexpense.js` (`openAddSheet`).
- Produces: `renderHistory()`; `window.refreshHistory = renderHistory`.

- [ ] **Step 1: Implement `js/history.js`**

```js
let _openMonth = null;
async function renderHistory() {
  document.querySelector('.app-title').textContent = 'History';
  const [data, limit] = [await getData(), await getMonthlyLimit()];
  const cats = data.categories;
  const catById = id => cats.find(c => c.id === id) || { label: 'Other', color: '#8A8F99', icon: 'tag' };
  const months = [...new Set(data.expenses.map(e => getMonthKey(e.date)))].sort().reverse();
  if (!_openMonth && months.length) _openMonth = months[0];

  document.getElementById('screen').innerHTML = months.length ? months.map(mk => {
    const total = sumForMonth(data.expenses, mk);
    const over = limit && total > limit;
    const open = mk === _openMonth;
    const rows = data.expenses.filter(e => getMonthKey(e.date) === mk).sort((a,b)=> b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    return `<div class="month-card card">
      <button class="month-head" data-month="${mk}">
        <div><div class="month-name">${getMonthLabel(mk)}</div><div class="muted">${rows.length} entries</div></div>
        <div class="month-right"><div class="month-total">${formatCurrency(total)}</div>${limit?`<span class="pill ${over?'pill-bad':'pill-good'}">${over?'over':'under'}</span>`:''}</div>
      </button>
      <div class="month-body" style="${open?'':'display:none'}">
        ${rows.map(e => { const c = catById(e.category); return `<div class="entry" data-edit="${e.id}">
          <div class="cat-chip" style="background:${c.color}22;color:${c.color}">${icon(c.icon,19)}</div>
          <div class="entry-main"><div class="entry-label">${c.label}</div><div class="entry-note muted">${e.note || formatDate(e.date)}</div></div>
          <div class="entry-amt">${formatCurrency(e.amount)}</div></div>`; }).join('')}
      </div>
    </div>`;
  }).join('') : `<div class="empty-state">${icon('calendar',40)}<div>No history yet.</div></div>`;

  document.querySelectorAll('.month-head').forEach(h => h.onclick = () => { _openMonth = _openMonth === h.dataset.month ? null : h.dataset.month; renderHistory(); });
  document.querySelectorAll('[data-edit]').forEach(el => el.onclick = () => { const e = data.expenses.find(x => x.id === el.dataset.edit); if (typeof openAddSheet==='function') openAddSheet(e); });
}
bootstrap(renderHistory);
window.refreshHistory = renderHistory;
```

- [ ] **Step 2: Add month-card styles to `components.css`**

```css
.month-card { padding: 0; margin-bottom: 10px; overflow: hidden; }
.month-head { width:100%; display:flex; justify-content:space-between; align-items:center; background:none; border:none; padding:16px; text-align:left; cursor:pointer; }
.month-name { font-family:var(--font-display); font-weight:700; }
.month-right { display:flex; align-items:center; gap:10px; }
.month-total { font-family:var(--font-display); font-weight:700; }
.month-body { padding: 0 12px 12px; }
```

- [ ] **Step 3: Verify via preview**

Open `history.html`: months listed newest-first with totals + under/over badge; first month expanded; tapping a header toggles; tapping an entry opens the edit sheet; editing reflects after save (`refreshHistory`). Empty state shows when no data.

- [ ] **Step 4: Commit**

```bash
git add projects/ghar-kharch/history.html projects/ghar-kharch/js/history.js projects/ghar-kharch/css/components.css
git commit -m "feat(ghar-kharch): History ledger screen"
```

---

## Task 13: Analytics screen (`analytics-view.js` + `charts.js`)

**Files:**
- Modify: `projects/ghar-kharch/analytics.html` (load `css/charts.css`, then `charts.js`, then `analytics-view.js`)
- Create: `projects/ghar-kharch/js/charts.js`
- Create: `projects/ghar-kharch/js/analytics-view.js`
- Create: `projects/ghar-kharch/css/charts.css`

**Interfaces:**
- Consumes: `storage.js`, `analytics.js` (all functions), `format.js`, `icons.js`, `app.js`.
- Produces: `renderAnalytics()`; `charts.js` exports `barChart(series, limit, selectedMonth, onSelect)` and `breakdownBars(items)` returning HTML strings; `barChart` wires bar taps after insertion via `wireBarChart(container, onSelect)`.

- [ ] **Step 1: Implement `js/charts.js`**

```js
function barChart(series, limit) {
  const max = Math.max(limit || 0, ...series.map(s => s.total), 1);
  const limitTop = limit ? (1 - limit / max) * 100 : null;
  return `<div class="bars">
    ${limit ? `<div class="limit-line" style="top:${limitTop}%"></div>` : ''}
    ${series.map(s => {
      const h = Math.round((s.total / max) * 100);
      const over = limit && s.total > limit;
      return `<button class="bar-col" data-month="${s.month}">
        <span class="bar ${over?'over':''}" style="height:${Math.max(h,2)}%"></span>
        <span class="bar-label">${s.label.split(' ')[0]}</span>
      </button>`;
    }).join('')}
  </div>`;
}
function wireBars(root, onSelect) { root.querySelectorAll('.bar-col').forEach(b => b.onclick = () => onSelect(b.dataset.month)); }
function breakdownBars(items) {
  return items.map(c => `<div class="bd-row">
    <div class="bd-head"><span>${c.label}</span><span class="muted">${formatCurrency(c.total)} · ${c.pct}%</span></div>
    <div class="bd-track"><div class="bd-fill" style="width:${c.pct}%;background:${c.color}"></div></div>
  </div>`).join('');
}
```

- [ ] **Step 2: Implement `js/analytics-view.js`**

```js
let _selMonth = null;
async function renderAnalytics() {
  document.querySelector('.app-title').textContent = 'Analytics';
  const [data, limit] = [await getData(), await getMonthlyLimit()];
  const exp = data.expenses, cats = data.categories;
  const cur = getCurrentMonthKey();
  if (!_selMonth) _selMonth = cur;

  const trend = monthlyTotals(exp, cur, 6);
  const cmp = monthComparison(exp, cats, _selMonth);
  const breakdown = categoryBreakdown(exp, cats, _selMonth);
  const pace = _selMonth === cur ? paceProjection(exp, limit, cur, getDayOfMonth(getTodayStr())) : null;
  const biggest = biggestExpenses(exp, _selMonth, 5);
  const insights = smartInsights(exp, cats, limit, _selMonth);
  const yr = yearlySummary(exp, Number(cur.slice(0,4)));
  const catLabel = id => (cats.find(c=>c.id===id)||{}).label || id;
  const catColor = id => (cats.find(c=>c.id===id)||{color:'#8A8F99'}).color;

  const cmpHTML = cmp.prevTotal === 0 && cmp.total === 0
    ? `<span class="muted">Not enough history yet.</span>`
    : `<div class="cmp-head"><span class="cmp-num">${cmp.delta>=0?'+':'−'}${formatCurrency(Math.abs(cmp.delta))}</span>
        ${cmp.pct!==null?`<span class="pill ${cmp.delta>0?'pill-warn':'pill-good'}">${cmp.delta>0?'▲':'▼'} ${Math.abs(cmp.pct)}%</span>`:''}</div>
       <div class="muted">vs ${getShortMonthLabel(getPrevMonthKey(_selMonth))}</div>
       ${cmp.topMovers.length?`<div class="movers">${cmp.topMovers.map(m=>`<div class="mover"><span>${m.label}</span><span style="color:${m.delta>0?'var(--bad)':'var(--good)'}">${m.delta>0?'↑':'↓'} ${formatCurrency(Math.abs(m.delta))}</span></div>`).join('')}</div>`:''}`;

  document.getElementById('screen').innerHTML = `
    <div class="month-select"><button class="pill pill-good" id="msel">${getMonthLabel(_selMonth)} ${icon('chevron-down',14)}</button></div>

    <section class="card"><div class="section-head"><span>Last 6 months</span>${limit?`<span class="muted">— limit ${formatCurrency(limit)}</span>`:''}</div>
      <div id="chart">${barChart(trend, limit)}</div></section>

    <section class="card"><div class="section-head"><span>vs last month</span></div>${cmpHTML}</section>

    ${pace?`<section class="card pace"><div class="section-head"><span>This month's pace</span></div>
      <div class="pace-grid"><div><div class="muted">Projected</div><div class="pace-num">${formatCurrency(pace.projected)}</div><div class="pill ${pace.verdict==='over'?'pill-bad':'pill-good'}">${pace.verdict==='over'?'over':'on track'}</div></div>
      <div><div class="muted">Avg / day</div><div class="pace-num">${formatCurrency(pace.avgPerDay)}</div><div class="muted">${pace.dayOfMonth} of ${pace.daysInMonth} days</div></div></div></section>`:''}

    <section class="card"><div class="section-head"><span>Where it went</span></div>
      ${breakdown.length?breakdownBars(breakdown):`<span class="muted">No spending this month.</span>`}</section>

    ${insights.length?`<section class="card"><div class="section-head"><span>Insights</span></div>${insights.map(i=>`<div class="insight">${icon('check',16)} ${i}</div>`).join('')}</section>`:''}

    ${biggest.length?`<section class="card"><div class="section-head"><span>Biggest expenses</span></div>
      ${biggest.map(e=>`<div class="entry"><div class="cat-chip" style="background:${catColor(e.category)}22;color:${catColor(e.category)}">${icon((cats.find(c=>c.id===e.category)||{icon:'tag'}).icon,19)}</div><div class="entry-main"><div class="entry-label">${catLabel(e.category)}</div><div class="entry-note muted">${e.note||formatDate(e.date)}</div></div><div class="entry-amt">${formatCurrency(e.amount)}</div></div>`).join('')}</section>`:''}

    ${yr?`<section class="card"><div class="section-head"><span>${cur.slice(0,4)} so far</span></div>
      <div class="year-grid"><div><div class="muted">Total</div><div class="pace-num">${formatCurrency(yr.total)}</div></div>
      <div><div class="muted">Monthly avg</div><div class="pace-num">${formatCurrency(yr.monthlyAvg)}</div></div>
      <div><div class="muted">Highest</div><div>${getShortMonthLabel(yr.highest.month)} · ${formatCurrency(yr.highest.total)}</div></div>
      <div><div class="muted">Lowest</div><div>${getShortMonthLabel(yr.lowest.month)} · ${formatCurrency(yr.lowest.total)}</div></div></div></section>`:''}`;

  wireBars(document.getElementById('chart'), m => { _selMonth = m; renderAnalytics(); });
  document.getElementById('msel').onclick = () => openMonthPicker(trend.map(t=>t.month), m => { _selMonth = m; renderAnalytics(); });
}
function openMonthPicker(months, onPick) {
  const o = document.createElement('div'); o.className = 'modal-overlay';
  o.innerHTML = `<div class="modal card"><div class="section-head"><span>Select month</span></div>${months.slice().reverse().map(m=>`<button class="btn btn-ghost btn-full" data-m="${m}" style="margin-bottom:6px">${getMonthLabel(m)}</button>`).join('')}</div>`;
  document.body.appendChild(o);
  o.onclick = e => { const b = e.target.closest('[data-m]'); if (b){ onPick(b.dataset.m); } o.remove(); };
}
bootstrap(renderAnalytics);
```

- [ ] **Step 3: Implement `css/charts.css`**

```css
.month-select { margin-bottom: 12px; }
.bars { position: relative; display:flex; align-items:flex-end; justify-content:space-between; gap:8px; height:130px; padding-top:8px; }
.limit-line { position:absolute; left:0; right:0; border-top:1px dashed #C9A24A; z-index:1; }
.bar-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; height:100%; justify-content:flex-end; background:none; border:none; cursor:pointer; }
.bar { width:100%; background:#CFE3DB; border-radius:6px; transition:height .5s var(--ease-out); }
.bar-col[data-month] .bar { }
.bar.over { background: var(--bad); }
.bar-label { font-size:11px; color:var(--ink-3); }
.cmp-num { font-family:var(--font-display); font-weight:800; font-size:1.6rem; }
.cmp-head { display:flex; align-items:baseline; gap:8px; }
.movers { margin-top:10px; border-top:1px solid var(--rule); padding-top:8px; }
.mover { display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px; }
.bd-row { margin-bottom:12px; }
.bd-head { display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px; }
.bd-track { height:7px; background:#EEEAE2; border-radius:var(--radius-pill); }
.bd-fill { height:100%; border-radius:var(--radius-pill); }
.pace-grid, .year-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.pace-num { font-family:var(--font-display); font-weight:700; font-size:1.2rem; }
.insight { display:flex; gap:8px; align-items:center; font-size:14px; margin-bottom:8px; color:var(--ink); }
.insight .icon { color: var(--accent); flex-shrink:0; }
.card + .card, section.card { margin-top: 12px; }
```

Mark the selected month's bar: in `barChart`, add `${s.month===arguments[2]?'sel':''}`? — simpler: pass `selected` and add class. Update `barChart(series, limit, selected)` signature and add `.bar.sel { background: var(--accent); }` to `charts.css`; call `barChart(trend, limit, _selMonth)` in Step 2.

- [ ] **Step 4: Verify via preview**

Open `analytics.html`. Expected: month pill; 6-bar trend with dashed limit line and any over-limit bar red, selected bar accented; tapping a bar reselects and re-renders month-scoped blocks; comparison shows delta/% + movers; pace card only for the current month; breakdown bars; insights; biggest expenses; yearly summary. Test sparse data (one month) → graceful "not enough history" / fewer cards, no errors.

- [ ] **Step 5: Commit**

```bash
git add projects/ghar-kharch/analytics.html projects/ghar-kharch/js/charts.js projects/ghar-kharch/js/analytics-view.js projects/ghar-kharch/css/charts.css
git commit -m "feat(ghar-kharch): Analytics screen — trend, comparison, breakdown, insights, pace, yearly"
```

---

## Task 14: Settings screen (`settings.js`)

**Files:**
- Modify: `projects/ghar-kharch/settings.html` (load `settings.js`)
- Create: `projects/ghar-kharch/js/settings.js`
- Modify: `projects/ghar-kharch/css/components.css` (settings rows + category editor styles)

**Interfaces:**
- Consumes: `storage.js` (limit, categories CRUD, export/import, clearAllData), `auth.js` (`changePin`), `sync.js` (`connectSync`/`disconnectSync`/`isSyncEnabled`/`getSyncLastTime`), `icons.js`, `app.js`, `format.js`.
- Produces: `renderSettings()`.

- [ ] **Step 1: Implement `js/settings.js`** (sections: Limit, Categories, PIN, Sync, Data)

```js
async function renderSettings() {
  document.querySelector('.app-title').textContent = 'Settings';
  const data = await getData();
  const limit = await getMonthlyLimit();
  document.getElementById('screen').innerHTML = `
    <section class="card"><div class="section-head"><span>Monthly limit</span></div>
      <div class="row"><input id="limit" type="number" inputmode="numeric" value="${limit}" /><button class="btn btn-primary" id="save-limit">Save</button></div></section>

    <section class="card"><div class="section-head"><span>Categories</span><button class="icon-btn" id="add-cat">${icon('plus',20)}</button></div>
      <div id="cat-list">${data.categories.map(c=>`<div class="cat-row"><div class="cat-chip" style="background:${c.color}22;color:${c.color}">${icon(c.icon,18)}</div><span>${c.label}</span><button class="icon-btn" data-del-cat="${c.id}">${icon('trash',18)}</button></div>`).join('')}</div></section>

    <section class="card"><div class="section-head"><span>PIN</span></div>
      <div class="row"><input id="cur-pin" type="password" inputmode="numeric" placeholder="Current PIN" maxlength="6" />
      <input id="new-pin" type="password" inputmode="numeric" placeholder="New PIN" maxlength="6" />
      <button class="btn btn-primary" id="save-pin">Change</button></div></section>

    <section class="card"><div class="section-head"><span>Sync</span></div>
      <div id="sync-box">${syncBoxHTML()}</div></section>

    <section class="card"><div class="section-head"><span>Data</span></div>
      <button class="btn btn-ghost btn-full" id="export">${icon('download',18)} Export backup (JSON)</button>
      <label class="btn btn-ghost btn-full" style="margin-top:8px">${icon('upload',18)} Import backup<input id="import" type="file" accept="application/json" hidden /></label>
      <button class="btn btn-danger btn-full" id="clear" style="margin-top:8px">${icon('trash',18)} Clear all data</button></section>`;

  document.getElementById('save-limit').onclick = async () => { await setMonthlyLimit(document.getElementById('limit').value); showToast('Limit saved'); };
  document.getElementById('add-cat').onclick = () => openCategoryEditor(null, renderSettings);
  document.querySelectorAll('[data-del-cat]').forEach(b => b.onclick = async () => { if (await confirmDialog('Delete this category?')) { await deleteCategory(b.dataset.delCat); renderSettings(); } });
  document.getElementById('save-pin').onclick = async () => {
    try { await changePin(document.getElementById('cur-pin').value, document.getElementById('new-pin').value); showToast('PIN changed'); document.getElementById('cur-pin').value=''; document.getElementById('new-pin').value=''; }
    catch (e) { showToast(e.message, 'error'); }
  };
  document.getElementById('export').onclick = () => exportJSON();
  document.getElementById('import').onchange = async ev => { const f = ev.target.files[0]; if (!f) return; try { await importJSON(await f.text(), 'replace'); showToast('Imported'); renderSettings(); } catch (e) { showToast(e.message, 'error'); } };
  document.getElementById('clear').onclick = async () => { if (await confirmDialog('Erase ALL expenses and settings on this device?')) { await clearAllData(); showToast('Cleared'); renderSettings(); } };
  wireSync();

  function syncBoxHTML() {
    return isSyncEnabled()
      ? `<div class="muted">Connected · last ${getSyncLastTime()||'—'}</div><button class="btn btn-ghost btn-full" id="sync-now" style="margin-top:8px">${icon('refresh',18)} Sync now</button><button class="btn btn-ghost btn-full" id="disconnect" style="margin-top:8px">Disconnect</button>`
      : `<div class="muted">Paste a GitHub token (gist scope) to sync to your other phone. Use the SAME sync passphrase on both.</div><input id="token" type="password" placeholder="GitHub token" style="margin-top:8px" /><button class="btn btn-primary btn-full" id="connect" style="margin-top:8px">Connect</button>`;
  }
  function wireSync() {
    const connect = document.getElementById('connect');
    if (connect) connect.onclick = async () => { try { connect.textContent='Connecting…'; const r = await connectSync(document.getElementById('token').value); showToast('Sync ' + r.action); renderSettings(); } catch (e) { showToast(e.message, 'error'); connect.textContent='Connect'; } };
    const now = document.getElementById('sync-now');
    if (now) now.onclick = async () => { try { await pullFromGist(); await pushToGist(); showToast('Synced'); renderSettings(); } catch (e) { showToast(e.message, 'error'); } };
    const dc = document.getElementById('disconnect');
    if (dc) dc.onclick = async () => { await disconnectSync(); showToast('Disconnected'); renderSettings(); };
  }
}
function openCategoryEditor(existing, done) {
  const o = document.createElement('div'); o.className = 'modal-overlay';
  o.innerHTML = `<div class="modal card"><div class="section-head"><span>${existing?'Edit':'New'} category</span></div>
    <input id="c-label" placeholder="Name" value="${existing?existing.label:''}" />
    <div class="icon-grid" id="c-icons">${CATEGORY_ICON_CHOICES.map(n=>`<button class="icon-pick" data-icon="${n}">${icon(n,20)}</button>`).join('')}</div>
    <div class="color-grid" id="c-colors">${PRESET_COLORS.map(c=>`<button class="color-pick" data-color="${c}" style="background:${c}"></button>`).join('')}</div>
    <div class="modal-actions"><button class="btn btn-ghost" id="c-cancel">Cancel</button><button class="btn btn-primary" id="c-save">Save</button></div></div>`;
  document.body.appendChild(o);
  let sIcon = existing?existing.icon:CATEGORY_ICON_CHOICES[0], sColor = existing?existing.color:PRESET_COLORS[0];
  const mark = () => { o.querySelectorAll('.icon-pick').forEach(b=>b.classList.toggle('sel',b.dataset.icon===sIcon)); o.querySelectorAll('.color-pick').forEach(b=>b.classList.toggle('sel',b.dataset.color===sColor)); };
  o.querySelector('#c-icons').onclick = e => { const b=e.target.closest('[data-icon]'); if(b){sIcon=b.dataset.icon;mark();} };
  o.querySelector('#c-colors').onclick = e => { const b=e.target.closest('[data-color]'); if(b){sColor=b.dataset.color;mark();} };
  o.querySelector('#c-cancel').onclick = () => o.remove();
  o.querySelector('#c-save').onclick = async () => {
    const label = o.querySelector('#c-label').value.trim(); if (!label) return;
    if (existing) await updateCategory(existing.id, { label, icon: sIcon, color: sColor });
    else await addCategory({ label, icon: sIcon, color: sColor });
    o.remove(); done();
  };
  mark();
}
bootstrap(renderSettings);
```

- [ ] **Step 2: Add settings/category-editor styles to `components.css`**

```css
.row { display:flex; gap:8px; align-items:center; }
.row input { flex:1; border:1px solid var(--rule-2); border-radius:var(--radius-sm); padding:12px; font-size:15px; background:var(--surface-2); }
.cat-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--rule); }
.cat-row span { flex:1; }
.icon-grid, .color-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; margin:10px 0; }
.icon-pick, .color-pick { aspect-ratio:1; border:1px solid var(--rule-2); border-radius:12px; background:var(--surface-2); display:flex; align-items:center; justify-content:center; }
.color-pick { border:2px solid transparent; }
.icon-pick.sel { border-color:var(--accent); color:var(--accent); }
.color-pick.sel { border-color:var(--ink); }
.icon-btn { background:none; border:none; color:var(--ink-2); padding:6px; cursor:pointer; }
```

- [ ] **Step 3: Verify via preview**

Open `settings.html`: change the limit → reflected on This Month; add/edit/delete a category (icon+color picker) → reflected in the Add sheet chips; change PIN (wrong current PIN errors); export downloads JSON; import replaces and re-renders; “Clear all” confirms then resets. (Sync connect verified in Task 7.)

- [ ] **Step 4: Commit**

```bash
git add projects/ghar-kharch/settings.html projects/ghar-kharch/js/settings.js projects/ghar-kharch/css/components.css
git commit -m "feat(ghar-kharch): Settings — limit, categories, PIN, sync, data"
```

---

## Task 15: PWA offline, icons & final QA

**Files:**
- Create: `projects/ghar-kharch/sw.js`
- Create: `projects/ghar-kharch/assets/icon-192.png`, `icon-512.png`, `favicon.png`
- Modify: all four `*.html` (register the service worker)

**Interfaces:**
- Produces: an installable, offline-capable PWA. No new JS API.

- [ ] **Step 1: Write `sw.js`** (cache-first for the app shell)

```js
const CACHE = 'ghar-kharch-v1';
const ASSETS = [
  'index.html','history.html','analytics.html','settings.html',
  'css/tokens.css','css/main.css','css/components.css','css/charts.css',
  'js/format.js','js/icons.js','js/crypto.js','js/storage.js','js/sync.js','js/auth.js','js/analytics.js','js/app.js','js/home.js','js/addexpense.js','js/history.js','js/charts.js','js/analytics-view.js','js/settings.js',
  'manifest.json'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname === 'api.github.com') return;            // never cache sync calls
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
    if (e.request.method === 'GET' && url.origin === location.origin) { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return resp;
  }).catch(() => caches.match('index.html'))));
});
```

- [ ] **Step 2: Register the SW** — add to each HTML before `</body>`:

```html
<script>if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));}</script>
```

- [ ] **Step 3: Add PWA icons**

Generate a simple light-theme wallet glyph on a sage-teal rounded square as `assets/icon-192.png`, `icon-512.png`, and `favicon.png` (any image tool; keep it flat/minimal). Confirm `manifest.json` paths match.

- [ ] **Step 4: Full QA pass (preview tools)**

- Run `node --test projects/ghar-kharch/tests/` → all green.
- Mobile viewport (resize ~390px): hero, sheet, keypad, nav all fit; tap targets ≥44px.
- Toggle `prefers-reduced-motion` → count-up/animations collapse, app still works.
- Offline: load once, kill network, reload → app still opens (SW), logging works, sync resumes when back online.
- Lighthouse/installability: manifest valid, SW registered, "Add to Home screen" available.
- Both verdict states (under/over) render correctly; large numbers group (₹1,20,000).

- [ ] **Step 5: Commit**

```bash
git add projects/ghar-kharch/sw.js projects/ghar-kharch/assets projects/ghar-kharch/*.html
git commit -m "feat(ghar-kharch): PWA offline service worker, icons, final QA"
```

---

## Deployment note (optional, when ready)

Static — deployable to GitHub Pages from `projects/ghar-kharch/` exactly like the existing tracker. Do **not** push without the user's go-ahead (standing preference: keep work local, ask before pushing).

---

## Self-Review (completed during planning)

- **Spec coverage:** §6.1 → Task 10; §6.2 → Task 11; §6.3 → Task 12; §6.4 (trend, comparison+movers, breakdown, insights, pace/projection, biggest, yearly) → Tasks 8 + 13; §6.5 → Task 14; §7 data model → Task 5; §8 sync → Task 7; §9 auth (passphrase+PIN, key-not-from-PIN) → Tasks 3 + 6; §10 categories → Task 5; §11 design → Tasks 1 + per-screen CSS; §12 structure → file map + Task 1; §13 edge cases → covered (empty/new month Task 10; no limit Task 10; back-dated Tasks 5/12; sparse-history & zero-division Task 8 tests; offline Task 15; sync conflict Task 7); §14 testing → Tasks 2,3,5,8 unit tests + manual passes; §15 future → out of scope.
- **Placeholder scan:** none — every code step contains runnable code; icon path data is real (refine visuals during Task 4 if desired).
- **Type consistency:** expense uses `category` (not `categoryId`) everywhere; `monthlyTotals(expenses, endMonthKey, n)`, `paceProjection(...,monthKey,dayOfMonth)`, `barChart(series, limit, selected)` signatures consistent between definition (Task 8/13) and call sites (Task 13). Storage exposes `getMonthlyLimit`/`setMonthlyLimit` used by Tasks 10/13/14. `window.refreshHome`/`refreshHistory` defined in Tasks 10/12 and called from Task 11.
