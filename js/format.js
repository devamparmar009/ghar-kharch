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
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function getMonthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}
function getShortMonthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return `${SHORT_MONTHS[m - 1]} ${String(y).slice(2)}`;
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
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yest = y.toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yest) return 'Yesterday';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}
function getDayOfMonth(dateStr) { return Number(String(dateStr).slice(8, 10)); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatCurrency, generateUUID, getTodayStr, getCurrentMonthKey, getMonthKey, getMonthLabel, getShortMonthLabel, getPrevMonthKey, getNextMonthKey, formatDate, daysInMonth, getDayOfMonth, esc };
}
