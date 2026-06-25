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
