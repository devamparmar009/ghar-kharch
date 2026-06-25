# Ghar Kharch — Design System

_Source of truth for all visual decisions. Tokens are in `css/tokens.css`._

---

## Direction

**Aesthetic:** Light, minimal, warm. Not clinical white — a warm off-white base with soft, earthy undertones. The UI should feel like a well-kept notebook: calm, readable, and trustworthy.

**Mood:** Domestic and grounded. This app lives on a family phone. It should feel approachable to non-technical users while looking polished enough that a design-savvy person appreciates the craft.

**Anti-patterns:** No dark mode (out of scope), no glassmorphism, no heavy gradients, no emoji (inline SVG icons only), no neon or oversaturated color.

---

## Color

| Token | Value | Role |
|---|---|---|
| `--bg` | `#F7F5F0` | App background — warm off-white |
| `--surface` | `#FFFFFF` | Cards, sheets, nav bar |
| `--surface-2` | `#FBFAF6` | Subtle secondary surface |
| `--ink` | `#1A1A17` | Primary text |
| `--ink-2` | `#6B6A63` | Secondary / muted text |
| `--ink-3` | `#9A988F` | Placeholders, inactive nav icons |
| `--rule` | `rgba(0,0,0,0.06)` | Dividers, card borders |
| `--rule-2` | `rgba(0,0,0,0.10)` | Stronger borders |
| `--accent` | `#2F9E83` | Sage-teal — primary action, active nav |
| `--accent-ink` | `#FFFFFF` | Text on accent surfaces |
| `--accent-50` | `#E6F4EE` | Accent tint for backgrounds |
| `--accent-700` | `#1B7A5E` | Accent pressed/dark state |
| `--good` / `--good-bg` | `#1B7A5E` / `#E6F4EE` | Positive amounts, under-budget |
| `--bad` / `--bad-bg` | `#C0492F` / `#FBEAE5` | Negative, over-budget, danger |
| `--warn` / `--warn-bg` | `#854F0B` / `#FAEEDA` | Warnings, near-limit |

**Philosophy:** Accent is used sparingly — only for the primary CTA and the active nav tab. Everything else is ink on surface.

---

## Elevation

**Soft elevation, not glass.** Cards use `box-shadow: var(--shadow-sm)` — a faint shadow, not a blur-backed glass panel. This keeps the page readable against the warm background.

| Token | Value |
|---|---|
| `--shadow` | `0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)` |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` |

---

## Typography

| Token | Value | Usage |
|---|---|---|
| `--font-display` | `"Sora", system-ui, sans-serif` | Headings, totals, large numbers |
| `--font-body` | `"Inter", system-ui, -apple-system, sans-serif` | All body copy, labels, buttons |

**Scale (informal):**
- Hero total: 36–40px, Sora 700
- Section heading: 18–20px, Sora 700
- App title bar: 18px, Sora 700
- Body / label: 15–16px, Inter 400/500
- Caption / nav label: 11–13px, Inter 500/600

**Letter-spacing:** `-0.02em` on all display sizes.

---

## Shape

| Token | Value | Usage |
|---|---|---|
| `--radius` | `20px` | Full cards, modals, sheets |
| `--radius-sm` | `14px` | Buttons, smaller cards |
| `--radius-pill` | `999px` | Pills, chips, toasts |

Category chips use a fixed `12px` radius (defined inline in components).

---

## Spacing

| Token | px |
|---|---|
| `--space-1` | 4 |
| `--space-2` | 8 |
| `--space-3` | 12 |
| `--space-4` | 16 |
| `--space-5` | 20 |
| `--space-6` | 24 |
| `--space-8` | 32 |

---

## Iconography

**Rule: no emoji. Inline SVG only.**

Icons are 22×22px in the bottom nav, 18×18px in buttons, 19×19px in category chips, 40×40px in empty states.

Icons are loaded by `js/icons.js` (Task 4/9), which replaces `data-icon` attributes on `.nav-ico` spans with the correct SVG. Until that task runs, nav icons appear blank — that is expected.

---

## Navigation

Four-tab bottom navigation, fixed at the bottom of the viewport:

| Tab | `data-icon` | Route |
|---|---|---|
| This Month | `wallet` | `index.html` |
| History | `calendar` | `history.html` |
| Analytics | `chart` | `analytics.html` |
| Settings | `settings` | `settings.html` |

Active tab: `color: var(--accent); font-weight: 600`. Inactive: `color: var(--ink-3)`.

The nav is the same markup block on all four pages. The active `<a>` gets class `active` set by each page's JS on load.

---

## Page Skeleton

Every page shares:

```
#auth-overlay   — shown (display:flex) when PIN required; hidden otherwise
#app            — shown (display:block) when authenticated
  .app-header   — title + icon-btn shortcut
  main.screen   — page-specific content injected here
  nav.bottom-nav
```

`#app` starts as `display:none`; `js/auth.js` flips it to `display:block` after PIN verification.

---

## Animation

- **Easing:** `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` — spring-like deceleration.
- **Toast entry:** `toastIn` keyframe (opacity + translateY over 0.25s).
- **Accessibility:** `@media (prefers-reduced-motion: reduce)` collapses all durations to `0.01ms`.
- Motion is functional, not decorative — no entrance animations for page loads.

---

_Token source of truth: `css/tokens.css`_
