let _openMonth = null;
async function renderHistory() {
  document.querySelector('.app-title').textContent = 'History';
  const [data, limit] = [await getData(), await getMonthlyLimit()];
  const cats = data.categories;
  const catById = id => cats.find(c => c.id === id) || { label: 'Other', color: '#8A8F99', icon: 'tag' };
  const months = [...new Set(data.expenses.map(e => getMonthKey(e.date)))].sort().reverse();
  if (!_openMonth && months.length) _openMonth = months[0];
  if (_openMonth && !months.includes(_openMonth)) _openMonth = months[0] || null;

  document.getElementById('screen').innerHTML = months.length ? months.map(mk => {
    const total = sumForMonth(data.expenses, mk);
    const over = limit && total > limit;
    const open = mk === _openMonth;
    const rows = data.expenses.filter(e => getMonthKey(e.date) === mk).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    return `<div class="month-card card">
      <button class="month-head" data-month="${mk}">
        <div><div class="month-name">${getMonthLabel(mk)}</div><div class="muted">${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}</div></div>
        <div class="month-right"><div class="month-total">${formatCurrency(total)}</div>${limit ? `<span class="pill ${over ? 'pill-bad' : 'pill-good'}">${over ? 'over' : 'under'}</span>` : ''}</div>
      </button>
      <div class="month-body" style="${open ? '' : 'display:none'}">
        ${rows.map(e => { const c = catById(e.category); return `<div class="entry" data-edit="${esc(e.id)}">
          <div class="cat-chip" style="background:${c.color}22;color:${c.color}">${icon(c.icon, 19)}</div>
          <div class="entry-main"><div class="entry-label">${esc(c.label)}</div><div class="entry-note muted">${e.note ? esc(e.note) : formatDate(e.date)}</div></div>
          <div class="entry-amt">${formatCurrency(e.amount)}</div></div>`; }).join('')}
      </div>
    </div>`;
  }).join('') : `<div class="empty-state">${icon('calendar', 40)}<div>No history yet.</div></div>`;

  document.querySelectorAll('.month-head').forEach(h => h.onclick = () => { _openMonth = _openMonth === h.dataset.month ? null : h.dataset.month; renderHistory(); });
  document.querySelectorAll('[data-edit]').forEach(el => el.onclick = () => { const e = data.expenses.find(x => x.id === el.dataset.edit); if (typeof openAddSheet === 'function') openAddSheet(e); });
}
bootstrap(renderHistory);
window.refreshHistory = renderHistory;
