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

test('label + day helpers', () => {
  assert.strictEqual(f.getMonthLabel('2026-06'), 'June 2026');
  assert.strictEqual(f.getShortMonthLabel('2026-06'), 'Jun 26');
  assert.strictEqual(f.getDayOfMonth('2026-06-24'), 24);
  assert.strictEqual(f.formatDate(f.getTodayStr()), 'Today');
  assert.match(f.getCurrentMonthKey(), /^\d{4}-\d{2}$/);
  assert.strictEqual(f.generateUUID().length, 36);
});

test('esc escapes HTML-significant characters', () => {
  assert.strictEqual(f.esc('<img src=x onerror=1>'), '&lt;img src=x onerror=1&gt;');
  assert.strictEqual(f.esc('a & "b"'), 'a &amp; &quot;b&quot;');
  assert.strictEqual(f.esc(null), '');
});
