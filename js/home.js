async function renderHome() {
  const monthKey = getCurrentMonthKey();
  const [data, limit] = [await getData(), await getMonthlyLimit()];
  const expenses = data.expenses;
  const total = sumForMonth(expenses, monthKey);
  const remaining = limit - total;
  const over = remaining < 0;
  const pct = limit ? Math.min(Math.round((total / limit) * 100), 999) : 0;
  const cats = data.categories;
  const catById = id => cats.find(c => c.id === id) || { label: 'Other', color: '#8A8F99', icon: 'tag' };
  const recent = expenses.filter(x => x.date && getMonthKey(x.date) === monthKey).sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  document.querySelector('.app-title').textContent = getMonthLabel(monthKey);

  const verdict = !limit
    ? `<span class="muted">No limit set</span>`
    : over
      ? `<span class="pill pill-bad">${icon('alert',15)} Over by ${formatCurrency(-remaining)}</span>`
      : `<span class="pill pill-good">${icon('check',15)} ${formatCurrency(remaining)} left</span>`;

  document.getElementById('screen').innerHTML = `
    <section class="hero card">
      <div class="muted">Spent this month</div>
      <div class="hero-num" id="hero-num">₹0</div>
      <div class="hero-verdict">${verdict}</div>
      ${limit ? `<div class="progress"><div class="progress-fill ${over ? 'over' : ''}" style="width:${Math.min(pct,100)}%"></div></div>
      <div class="progress-meta"><span>${pct}% of limit</span><span>Limit ${formatCurrency(limit)}</span></div>` : ''}
    </section>
    <button class="btn btn-primary btn-full add-btn" id="add">${icon('plus',18)} Add expense</button>
    <div class="section-head"><span>Recent</span></div>
    <div id="recent">${recent.length ? recent.map(rowHTML).join('') : `<div class="empty-state">${icon('wallet',40)}<div>No expenses yet. Tap "Add expense".</div></div>`}</div>`;

  const heroEl = document.getElementById('hero-num');
  animateCountUp(heroEl, total);
  document.getElementById('add').onclick = () => { if (typeof openAddSheet === 'function') openAddSheet(null); };
  document.querySelectorAll('[data-edit]').forEach(el => el.onclick = () => { const e = expenses.find(x => x.id === el.dataset.edit); if (typeof openAddSheet === 'function') openAddSheet(e); });

  function rowHTML(e) {
    const c = catById(e.category);
    return `<div class="entry" data-edit="${esc(e.id)}">
      <div class="cat-chip" style="background:${c.color}22;color:${c.color}">${icon(c.icon,19)}</div>
      <div class="entry-main"><div class="entry-label">${esc(c.label)}</div><div class="entry-note muted">${e.note ? esc(e.note) : formatDate(e.date)}</div></div>
      <div class="entry-amt">${formatCurrency(e.amount)}</div>
    </div>`;
  }
}
bootstrap(renderHome);
window.refreshHome = renderHome;   // Task 11 calls this after save
