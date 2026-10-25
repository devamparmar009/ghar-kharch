if (typeof module !== 'undefined' && module.exports) {
  var { generateUUID, getMonthKey, getTodayStr, getCurrentMonthKey } = require('./format.js');
}

// Plain JSON in this browser's localStorage. A new key, so data left by the old
// encrypted version under 'gk_data' is never read or overwritten.
const STORAGE_KEY = 'ghar-kharch-data';
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

let _cache = null;
function clearDataCache() { _cache = null; }
function blankData() {
  return { version: 1, monthlyLimit: DEFAULT_LIMIT, currency: 'INR', categories: DEFAULT_CATEGORIES.map(c => ({ ...c })), expenses: [] };
}
async function getData() {
  if (_cache) return _cache;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { await saveData(blankData()); return _cache; }
  _cache = JSON.parse(raw);
  return _cache;
}
async function saveData(data) {
  _cache = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
  const i = data.expenses.findIndex(e => e.id === id);
  if (i === -1) return;
  data.expenses.splice(i, 1);
  await saveData(data);
}
async function getExpensesForMonth(monthKey) {
  const data = await getData();
  return data.expenses.filter(e => !e.deleted && getMonthKey(e.date) === monthKey);
}
async function getMonthlyLimit() { const d = await getData(); return d.monthlyLimit || 0; }
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STORAGE_KEY, DEFAULT_LIMIT, DEFAULT_CATEGORIES, PRESET_COLORS, clearDataCache, blankData, getData, saveData, addExpense, updateExpense, deleteExpense, getExpensesForMonth, getMonthlyLimit, setMonthlyLimit, getCategories, addCategory, updateCategory, deleteCategory, exportJSON, importJSON, clearAllData };
}
