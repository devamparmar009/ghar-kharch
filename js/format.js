function formatCurrency(amount) {
  const n = Number(amount) || 0;
  const sign = n < 0 ? '−' : '';
  return sign + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
function getTodayStr() { return new Date().toISOString().split('T')[0]; }
function getCurrentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function getMonthKey(dateStr) { return String(dateStr).substring(0, 7); }
function getMonthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}
function getShortMonthLabel(key) {
  const [y, m] = key.split('-');
  return new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}
function getPrevMonthKey(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function getNextMonthKey(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function formatDate(dateStr) {
  const today = getTodayStr();
  const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yest) return 'Yesterday';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}
function getDayOfMonth(dateStr) { return Number(String(dateStr).slice(8, 10)); }

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatCurrency, generateUUID, getTodayStr, getCurrentMonthKey, getMonthKey, getMonthLabel, getShortMonthLabel, getPrevMonthKey, getNextMonthKey, formatDate, daysInMonth, getDayOfMonth };
}
