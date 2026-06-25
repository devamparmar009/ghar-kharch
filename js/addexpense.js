async function openAddSheet(expense) {
  const cats = await getCategories();
  const editing = !!expense;
  let amount = editing ? String(expense.amount) : '';
  let category = editing ? expense.category : cats[0].id;
  let date = editing ? expense.date : getTodayStr();

  const sheet = document.createElement('div');
  sheet.className = 'sheet-overlay';
  sheet.innerHTML = `
    <div class="sheet card">
      <div class="sheet-head"><span>${editing ? 'Edit expense' : 'Add expense'}</span><button class="icon-btn" id="close">${icon('x',22)}</button></div>
      <div class="amount-display" id="amt">₹0</div>
      <div class="chips" id="chips">${cats.map(c => `<button class="chip ${c.id===category?'sel':''}" data-cat="${c.id}" style="--c:${c.color}">${icon(c.icon,18)}<span>${esc(c.label)}</span></button>`).join('')}</div>
      <input class="note-input" id="note" placeholder="Note (optional)" value="${esc(editing ? (expense.note||'') : '')}" />
      <input class="date-input" id="date" type="date" value="${date}" />
      <div class="keypad" id="keypad">${['1','2','3','4','5','6','7','8','9','.','0','del'].map(k => `<button class="key" data-k="${k}">${k==='del'?icon('backspace',20):k}</button>`).join('')}</div>
      <button class="btn btn-primary btn-full" id="save">${icon('check',18)} ${editing ? 'Save changes' : 'Save'}</button>
      ${editing ? `<button class="btn btn-danger btn-full" id="del-exp">${icon('trash',18)} Delete</button>` : ''}
    </div>`;
  document.body.appendChild(sheet);
  requestAnimationFrame(() => sheet.classList.add('open'));

  const amtEl = sheet.querySelector('#amt');
  const paint = () => amtEl.textContent = amount ? formatCurrency(Number(amount)) : '₹0';
  const close = () => { sheet.classList.remove('open'); setTimeout(() => sheet.remove(), 250); };

  sheet.querySelector('#close').onclick = close;
  sheet.addEventListener('click', e => { if (e.target === sheet) close(); });
  sheet.querySelector('#keypad').onclick = e => {
    const k = e.target.closest('.key')?.dataset.k; if (!k) return;
    if (k === 'del') amount = amount.slice(0, -1);
    else if (k === '.') { if (!amount.includes('.')) amount += amount ? '.' : '0.'; }
    else amount += k;
    paint();
  };
  sheet.querySelector('#chips').onclick = e => {
    const b = e.target.closest('.chip'); if (!b) return;
    category = b.dataset.cat;
    sheet.querySelectorAll('.chip').forEach(c => c.classList.toggle('sel', c === b));
  };
  sheet.querySelector('#save').onclick = async () => {
    const val = Number(amount);
    if (!val || val <= 0) { showToast('Enter an amount', 'error'); return; }
    const note = sheet.querySelector('#note').value.trim();
    const d = sheet.querySelector('#date').value || getTodayStr();
    if (editing) await updateExpense(expense.id, { amount: val, category, note, date: d });
    else await addExpense({ amount: val, category, note, date: d });
    showToast(editing ? 'Updated' : 'Added');
    close();
    if (window.refreshHome) window.refreshHome();
    if (window.refreshHistory) window.refreshHistory();
  };
  const delBtn = sheet.querySelector('#del-exp');
  if (delBtn) delBtn.onclick = async () => {
    if (!(await confirmDialog('Delete this expense?'))) return;
    await deleteExpense(expense.id); showToast('Deleted'); close();
    if (window.refreshHome) window.refreshHome();
    if (window.refreshHistory) window.refreshHistory();
  };
  paint();
}
