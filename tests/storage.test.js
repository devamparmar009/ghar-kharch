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
  // soft-delete: record stays as tombstone, not returned by getExpensesForMonth
  assert.strictEqual(all.length, 1);
  assert.strictEqual(all[0].deleted, true);
  const month = await s.getExpensesForMonth('2026-06');
  assert.strictEqual(month.length, 0);
});

test('monthly limit round-trips', async () => {
  localStorage.clear(); s.clearDataCache();
  s.setSessionKey(await c.deriveKey('pw'));
  await s.saveData(s.blankData());
  await s.setMonthlyLimit(30000);
  assert.strictEqual(await s.getMonthlyLimit(), 30000);
});

test('getMonthlyLimit returns DEFAULT_LIMIT on an uninitialized store', async () => {
  localStorage.clear(); s.clearDataCache();
  assert.strictEqual(await s.getMonthlyLimit(), s.DEFAULT_LIMIT);
});

test('mergeData unions expenses/categories by id, prefers newer updatedAt, keeps local settings', () => {
  const local = { version:1, monthlyLimit:30000, currency:'INR', categories:[{id:'a'},{id:'groceries'}], expenses:[{id:'1',amount:100,updatedAt:200},{id:'2',amount:50,updatedAt:100}] };
  const remote = { version:1, monthlyLimit:25000, currency:'INR', categories:[{id:'b'},{id:'groceries'}], expenses:[{id:'1',amount:999,updatedAt:100},{id:'3',amount:70,updatedAt:50}] };
  const m = s.mergeData(local, remote);
  assert.strictEqual(m.expenses.find(e=>e.id==='1').amount, 100);      // local newer wins
  assert.deepStrictEqual(m.expenses.map(e=>e.id).sort(), ['1','2','3']); // union
  assert.deepStrictEqual([...new Set(m.categories.map(c=>c.id))].sort(), ['a','b','groceries']);
  assert.strictEqual(m.monthlyLimit, 30000);                            // local settings kept
});

test('mergeData propagates tombstone: delete on one device wins via updatedAt', () => {
  // mom deletes expense '1' (tombstone at T=500); laptop still has original (T=100)
  const mom   = { version:1, monthlyLimit:25000, currency:'INR', categories:[], expenses:[{id:'1',amount:100,deleted:true,updatedAt:500}] };
  const laptop = { version:1, monthlyLimit:25000, currency:'INR', categories:[], expenses:[{id:'1',amount:100,updatedAt:100}] };
  const merged = s.mergeData(mom, laptop);   // mom is local, laptop is remote
  const e = merged.expenses.find(x => x.id === '1');
  assert.strictEqual(e.deleted, true);       // tombstone survives the merge
});

test('importJSON merge mode merges new categories and expenses by id', async () => {
  localStorage.clear(); s.clearDataCache();
  s.setSessionKey(await c.deriveKey('pw'));
  await s.saveData(s.blankData());
  await s.importJSON({ expenses: [{ id: 'e9', amount: 99, category: 'other', note: '', date: '2026-06-01' }], categories: [{ id: 'custom1', label: 'Custom', icon: 'tag', color: '#000' }] }, 'merge');
  const data = await s.getData();
  assert.ok(data.categories.some(x => x.id === 'custom1'));
  assert.ok(data.expenses.some(x => x.id === 'e9'));
});
