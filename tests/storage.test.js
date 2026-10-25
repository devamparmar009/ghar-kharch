const test = require('node:test');
const assert = require('node:assert');

// minimal localStorage shim for Node
globalThis.localStorage = (() => {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), clear: () => m.clear() };
})();

const s = require('../js/storage.js');

test('addExpense persists and getExpensesForMonth filters by date', async () => {
  localStorage.clear(); s.clearDataCache();
  await s.saveData(s.blankData());
  await s.addExpense({ amount: 500, category: 'groceries', note: 'veg', date: '2026-06-10' });
  await s.addExpense({ amount: 200, category: 'transport', note: '', date: '2026-05-30' });
  const june = await s.getExpensesForMonth('2026-06');
  assert.strictEqual(june.length, 1);
  assert.strictEqual(june[0].amount, 500);
});

test('updateExpense and deleteExpense mutate the right row', async () => {
  localStorage.clear(); s.clearDataCache();
  await s.saveData(s.blankData());
  const e = await s.addExpense({ amount: 100, category: 'other', note: '', date: '2026-06-01' });
  await s.updateExpense(e.id, { amount: 150 });
  let all = (await s.getData()).expenses;
  assert.strictEqual(all[0].amount, 150);
  await s.deleteExpense(e.id);
  all = (await s.getData()).expenses;
  assert.strictEqual(all.length, 0);
  const month = await s.getExpensesForMonth('2026-06');
  assert.strictEqual(month.length, 0);
});

test('monthly limit round-trips', async () => {
  localStorage.clear(); s.clearDataCache();
  await s.saveData(s.blankData());
  await s.setMonthlyLimit(30000);
  assert.strictEqual(await s.getMonthlyLimit(), 30000);
});

test('getMonthlyLimit returns DEFAULT_LIMIT on an uninitialized store', async () => {
  localStorage.clear(); s.clearDataCache();
  assert.strictEqual(await s.getMonthlyLimit(), s.DEFAULT_LIMIT);
});

test('data is stored as plain JSON under its own key, leaving old data untouched', async () => {
  localStorage.clear(); s.clearDataCache();
  localStorage.setItem('gk_data', 'old-encrypted-blob');
  await s.addExpense({ amount: 42, category: 'other', note: 'tea', date: '2026-06-02' });
  const stored = JSON.parse(localStorage.getItem(s.STORAGE_KEY));
  assert.strictEqual(stored.expenses[0].note, 'tea');
  assert.strictEqual(localStorage.getItem('gk_data'), 'old-encrypted-blob');
});

test('importJSON merge mode merges new categories and expenses by id', async () => {
  localStorage.clear(); s.clearDataCache();
  await s.saveData(s.blankData());
  await s.importJSON({ expenses: [{ id: 'e9', amount: 99, category: 'other', note: '', date: '2026-06-01' }], categories: [{ id: 'custom1', label: 'Custom', icon: 'tag', color: '#000' }] }, 'merge');
  const data = await s.getData();
  assert.ok(data.categories.some(x => x.id === 'custom1'));
  assert.ok(data.expenses.some(x => x.id === 'e9'));
});
