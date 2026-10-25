# Ghar Kharch

A simple monthly home expense tracker. Log what you spend each day, set one monthly limit, and see at a glance how much is left, or how much you went over.

**Use it now:** https://devamparmar009.github.io/ghar-kharch/

## What it does

- **This month:** total spent, "₹4,200 left" or "Over by ₹1,300", and a progress bar toward your limit.
- **Add expense:** big on-screen keypad, one-tap categories, optional note, and a date you can change for past expenses. Tap any entry to edit or delete it.
- **History:** every month with its total, and all the entries in it.
- **Analytics:** last 6 months against your limit, this month vs last month, spending pace and month-end projection, category breakdown, biggest expenses and a yearly summary.
- **Settings:** monthly limit, your own categories (name, icon, colour), and backup.

Amounts are in Indian Rupees with Indian digit grouping (₹1,20,000).

## Your data stays on your device

There is no account, no login, no server and no cloud. Everything you enter is saved only in your browser on your own device, and your expenses are never sent anywhere.

Because of that, **back up now and then**: open **Settings → Export backup (JSON)** and keep the file somewhere safe. To restore it, or to move to a new phone, use **Settings → Import backup**. Clearing your browser's site data, or uninstalling the browser, deletes what is stored in it.

## How to use it

**On a phone (recommended)**
1. Open https://devamparmar009.github.io/ghar-kharch/
2. In the browser menu, tap **Add to Home screen** (Chrome) or **Share → Add to Home Screen** (Safari).
3. Open it from the home screen like any app. After the first visit it also works offline.

**On a computer, from a download**
1. On this page click **Code → Download ZIP** and unzip it.
2. Open `index.html` in Chrome, Edge or Firefox.

Data is kept per browser, so use the same browser each time. The font loads from Google Fonts when you are online and falls back to a system font when you are not.

## For developers

Plain HTML, CSS and JavaScript: no framework, no build step and no dependencies. It is a PWA (`manifest.json` + `sw.js`) and the charts are hand-drawn SVG.

```
index.html, history.html, analytics.html, settings.html   the four screens
js/storage.js     data layer (localStorage, export/import)
js/analytics.js   pure functions behind the Analytics screen
js/format.js      ₹ formatting, dates and months
js/*.js           one file per screen, plus icons, charts and shared UI helpers
css/              design tokens, layout, components, charts
tests/            unit tests
```

Run the tests (Node 18 or newer):

```bash
node --test tests/*.test.js
```
