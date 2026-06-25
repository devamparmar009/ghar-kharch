/* analytics-view.js — Analytics screen orchestrator */

let _selMonth = null;

async function renderAnalytics() {
  document.querySelector('.app-title').textContent = 'Analytics';
  const [data, limit] = [await getData(), await getMonthlyLimit()];
  const exp = data.expenses, cats = data.categories;
  const cur = getCurrentMonthKey();
  if (!_selMonth) _selMonth = cur;

  const trend = monthlyTotals(exp, cur, 6);
  const cmp = monthComparison(exp, cats, _selMonth);
  const breakdown = categoryBreakdown(exp, cats, _selMonth);
  const pace = _selMonth === cur ? paceProjection(exp, limit, cur, getDayOfMonth(getTodayStr())) : null;
  const biggest = biggestExpenses(exp, _selMonth, 5);
  const insights = smartInsights(exp, cats, limit, _selMonth);
  const yr = yearlySummary(exp, Number(cur.slice(0, 4)));
  const catLabel = id => (cats.find(c => c.id === id) || {}).label || id;
  const catColor = id => (cats.find(c => c.id === id) || { color: '#8A8F99' }).color;
  const catIcon = id => (cats.find(c => c.id === id) || { icon: 'tag' }).icon;

  const cmpHTML = cmp.prevTotal === 0 && cmp.total === 0
    ? `<span class="muted">Not enough history yet.</span>`
    : `<div class="cmp-head"><span class="cmp-num">${cmp.delta >= 0 ? '+' : '−'}${formatCurrency(Math.abs(cmp.delta))}</span>
        ${cmp.pct !== null ? `<span class="pill ${cmp.delta > 0 ? 'pill-warn' : 'pill-good'}">${cmp.delta > 0 ? '▲' : '▼'} ${Math.abs(cmp.pct)}%</span>` : ''}</div>
       <div class="muted">vs ${getShortMonthLabel(getPrevMonthKey(_selMonth))}</div>
       ${cmp.topMovers.length ? `<div class="movers">${cmp.topMovers.map(m => `<div class="mover"><span>${esc(m.label)}</span><span style="color:${m.delta > 0 ? 'var(--bad)' : 'var(--good)'}">${m.delta > 0 ? '↑' : '↓'} ${formatCurrency(Math.abs(m.delta))}</span></div>`).join('')}</div>` : ''}`;

  document.getElementById('screen').innerHTML = `
    <div class="month-select"><button class="pill pill-good" id="msel">${getMonthLabel(_selMonth)} ${icon('chevron-down', 14)}</button></div>

    <section class="card"><div class="section-head"><span>Last 6 months</span>${limit ? `<span class="muted">— limit ${formatCurrency(limit)}</span>` : ''}</div>
      <div id="chart">${barChart(trend, limit, _selMonth)}</div></section>

    <section class="card"><div class="section-head"><span>vs last month</span></div>${cmpHTML}</section>

    ${pace ? `<section class="card pace"><div class="section-head"><span>This month's pace</span></div>
      <div class="pace-grid"><div><div class="muted">Projected</div><div class="pace-num">${formatCurrency(pace.projected)}</div><div class="pill ${pace.verdict === 'over' ? 'pill-bad' : 'pill-good'}">${pace.verdict === 'over' ? 'over' : 'on track'}</div></div>
      <div><div class="muted">Avg / day</div><div class="pace-num">${formatCurrency(pace.avgPerDay)}</div><div class="muted">${pace.dayOfMonth} of ${pace.daysInMonth} days</div></div></div></section>` : ''}

    <section class="card"><div class="section-head"><span>Where it went</span></div>
      ${breakdown.length ? breakdownBars(breakdown) : `<span class="muted">No spending this month.</span>`}</section>

    ${insights.length ? `<section class="card"><div class="section-head"><span>Insights</span></div>${insights.map(i => `<div class="insight">${icon('check', 16)} ${esc(i)}</div>`).join('')}</section>` : ''}

    ${biggest.length ? `<section class="card"><div class="section-head"><span>Biggest expenses</span></div>
      ${biggest.map(e => `<div class="entry"><div class="cat-chip" style="background:${catColor(e.category)}22;color:${catColor(e.category)}">${icon(catIcon(e.category), 19)}</div><div class="entry-main"><div class="entry-label">${esc(catLabel(e.category))}</div><div class="entry-note muted">${esc(e.note) || formatDate(e.date)}</div></div><div class="entry-amt">${formatCurrency(e.amount)}</div></div>`).join('')}</section>` : ''}

    ${yr ? `<section class="card"><div class="section-head"><span>${cur.slice(0, 4)} so far</span></div>
      <div class="year-grid"><div><div class="muted">Total</div><div class="pace-num">${formatCurrency(yr.total)}</div></div>
      <div><div class="muted">Monthly avg</div><div class="pace-num">${formatCurrency(yr.monthlyAvg)}</div></div>
      <div><div class="muted">Highest</div><div>${getShortMonthLabel(yr.highest.month)} · ${formatCurrency(yr.highest.total)}</div></div>
      <div><div class="muted">Lowest</div><div>${getShortMonthLabel(yr.lowest.month)} · ${formatCurrency(yr.lowest.total)}</div></div></div></section>` : ''}`;

  wireBars(document.getElementById('chart'), m => { _selMonth = m; renderAnalytics(); });
  document.getElementById('msel').onclick = () => openMonthPicker(trend.map(t => t.month), m => { _selMonth = m; renderAnalytics(); });
}

function openMonthPicker(months, onPick) {
  const o = document.createElement('div'); o.className = 'modal-overlay';
  o.innerHTML = `<div class="modal card"><div class="section-head"><span>Select month</span></div>${months.slice().reverse().map(m => `<button class="btn btn-ghost btn-full" data-m="${m}" style="margin-bottom:6px">${getMonthLabel(m)}</button>`).join('')}</div>`;
  document.body.appendChild(o);
  o.onclick = e => { const b = e.target.closest('[data-m]'); if (b) { onPick(b.dataset.m); } o.remove(); };
}

bootstrap(renderAnalytics);
