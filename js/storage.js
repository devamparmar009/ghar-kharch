if (typeof module !== 'undefined' && module.exports) {
  var { encryptData, decryptData } = require('./crypto.js');
  var { generateUUID, getMonthKey, getTodayStr, getCurrentMonthKey } = require('./format.js');
}

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
async function getMonthlyLimit() { const d = await getData(); return d ? (d.monthlyLimit || 0) : DEFAULT_LIMIT; }
async function setMonthlyLimit(n) { const d = await getData(); d.monthlyLimit = Number(n); await saveData(d); }
async function getCategories() { return (await getData()).categories; }
async function addCategory(cat) { const d = await getData(); const newCat = { ...cat, id: generateUUID() }; d.categories.push(newCat); await saveData(d); return newCat; }
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
  const catIds = new Set(cur.categories.map(c => c.id));
  cur.categories.push(...imp.categories.filter(c => !catIds.has(c.id)));
  await saveData(cur);
}
async function clearAllData() { _cache = null; await saveData(blankData()); }

function mergeData(local, remote) {
  if (!local) return remote;
  if (!remote) return local;
  const stamp = e => (e.updatedAt || e.createdAt || 0);
  const byId = {};
  (remote.expenses || []).forEach(e => { byId[e.id] = e; });
  (local.expenses || []).forEach(e => { const ex = byId[e.id]; if (!ex || stamp(e) >= stamp(ex)) byId[e.id] = e; });
  const catById = {};
  (remote.categories || []).forEach(c => { catById[c.id] = c; });
  (local.categories || []).forEach(c => { catById[c.id] = c; });
  // Keep the saving device's settings (monthlyLimit/currency/version); union the arrays.
  // NOTE: union merge — a deletion may not propagate if the other device still holds the item (acceptable for a single-logger household per spec §8).
  return { ...remote, ...local, expenses: Object.values(byId), categories: Object.values(catById) };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STORAGE_KEY, DEFAULT_LIMIT, DEFAULT_CATEGORIES, PRESET_COLORS, setSessionKey, getSessionKey, clearDataCache, blankData, getData, saveData, addExpense, updateExpense, deleteExpense, getExpensesForMonth, getMonthlyLimit, setMonthlyLimit, getCategories, addCategory, updateCategory, deleteCategory, exportJSON, importJSON, clearAllData, mergeData };
}
