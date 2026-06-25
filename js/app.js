function showToast(msg, type = 'success') {
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div'); t.className = `toast ${type}`; t.textContent = msg;
  c.appendChild(t); setTimeout(() => t.remove(), 2800);
}
function animateCountUp(el, value, dur = 800) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = formatCurrency(value); return; }
  const start = performance.now();
  (function step(now) {
    const p = Math.min((now - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
    el.textContent = formatCurrency(Math.round(value * eased));
    if (p < 1) requestAnimationFrame(step);
  })(performance.now());
}
function paintNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.bottom-nav a').forEach(a => {
    a.querySelector('.nav-ico').innerHTML = icon(a.dataset.icon, 22);
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === path || (path === '' && href === 'index.html'));
  });
  const sl = document.getElementById('settings-link');
  if (sl) { sl.innerHTML = icon('settings', 22); sl.onclick = () => location.href = 'settings.html'; }
}
function confirmDialog(message) {
  return new Promise(resolve => {
    const o = document.createElement('div'); o.className = 'modal-overlay';
    o.innerHTML = `<div class="modal card"><p>${message}</p><div class="modal-actions"><button class="btn btn-ghost" id="c-no">Cancel</button><button class="btn btn-danger" id="c-yes">Delete</button></div></div>`;
    document.body.appendChild(o);
    o.querySelector('#c-no').onclick = () => { o.remove(); resolve(false); };
    o.querySelector('#c-yes').onclick = () => { o.remove(); resolve(true); };
  });
}
function bootstrap(onReady) {
  requireAuth(() => { paintNav(); onReady(); });
}
