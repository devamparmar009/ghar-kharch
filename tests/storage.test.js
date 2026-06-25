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
