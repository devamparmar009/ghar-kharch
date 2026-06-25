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
  assert.strictEqual(y.monthlyAvg, 4000);
});

test('smartInsights degrades gracefully with sparse data', () => {
  const ins = a.smartInsights([{ id: '1', amount: 100, category: 'dining', date: '2026-06-01' }], cats, 1000, '2026-06');
  assert.ok(Array.isArray(ins));
  assert.ok(ins.length > 0);
  assert.ok(ins.some(s => s.includes('Biggest single day')));
});
