/* charts.js — DOM-string helpers for the Analytics screen */

function barChart(series, limit, selected) {
  const max = Math.max(limit || 0, ...series.map(s => s.total), 1);
  const limitTop = limit ? (1 - limit / max) * 100 : null;
  return `<div class="bars">
    ${limit ? `<div class="limit-line" style="top:${limitTop}%"></div>` : ''}
    ${series.map(s => {
      const h = Math.round((s.total / max) * 100);
      const cls = ['bar', limit && s.total > limit ? 'over' : '', s.month === selected ? 'sel' : ''].filter(Boolean).join(' ');
      return `<button class="bar-col" data-month="${s.month}">
        <span class="${cls}" style="height:${Math.max(h, 2)}%"></span>
        <span class="bar-label">${s.label.split(' ')[0]}</span>
      </button>`;
    }).join('')}
  </div>`;
}

function wireBars(root, onSelect) {
  root.querySelectorAll('.bar-col').forEach(b => b.onclick = () => onSelect(b.dataset.month));
}

function breakdownBars(items) {
  return items.map(c => `<div class="bd-row">
    <div class="bd-head"><span>${esc(c.label)}</span><span class="muted">${formatCurrency(c.total)} · ${c.pct}%</span></div>
    <div class="bd-track"><div class="bd-fill" style="width:${c.pct}%;background:${c.color}"></div></div>
  </div>`).join('');
}
