async function renderSettings() {
  document.querySelector('.app-title').textContent = 'Settings';
  const data = await getData();
  const limit = await getMonthlyLimit();
  document.getElementById('screen').innerHTML = `
    <section class="card"><div class="section-head"><span>Monthly limit</span></div>
      <div class="row"><input id="limit" type="number" inputmode="numeric" value="${limit}" /><button class="btn btn-primary" id="save-limit">Save</button></div></section>

    <section class="card"><div class="section-head"><span>Categories</span><button class="icon-btn" id="add-cat">${icon('plus',20)}</button></div>
      <div id="cat-list">${data.categories.map(c=>`<div class="cat-row"><div class="cat-chip" style="background:${c.color}22;color:${c.color}">${icon(c.icon,18)}</div><span>${esc(c.label)}</span><button class="icon-btn" data-del-cat="${c.id}">${icon('trash',18)}</button></div>`).join('')}</div></section>

    <section class="card"><div class="section-head"><span>PIN</span></div>
      <div class="row"><input id="cur-pin" type="password" inputmode="numeric" placeholder="Current PIN" maxlength="6" />
      <input id="new-pin" type="password" inputmode="numeric" placeholder="New PIN" maxlength="6" />
      <button class="btn btn-primary" id="save-pin">Change</button></div></section>

    <section class="card"><div class="section-head"><span>Sync</span></div>
      <div id="sync-box">${syncBoxHTML()}</div></section>

    <section class="card"><div class="section-head"><span>Data</span></div>
      <button class="btn btn-ghost btn-full" id="export">${icon('download',18)} Export backup (JSON)</button>
      <label class="btn btn-ghost btn-full" style="margin-top:8px">${icon('upload',18)} Import backup<input id="import" type="file" accept="application/json" hidden /></label>
      <button class="btn btn-danger btn-full" id="clear" style="margin-top:8px">${icon('trash',18)} Clear all data</button></section>`;

  document.getElementById('save-limit').onclick = async () => { await setMonthlyLimit(document.getElementById('limit').value); showToast('Limit saved'); };
  document.getElementById('add-cat').onclick = () => openCategoryEditor(null, renderSettings);
  document.querySelectorAll('[data-del-cat]').forEach(b => b.onclick = async () => { if (await confirmDialog('Delete this category?')) { await deleteCategory(b.dataset.delCat); renderSettings(); } });
  document.getElementById('save-pin').onclick = async () => {
    try { await changePin(document.getElementById('cur-pin').value, document.getElementById('new-pin').value); showToast('PIN changed'); document.getElementById('cur-pin').value=''; document.getElementById('new-pin').value=''; }
    catch (e) { showToast(e.message, 'error'); }
  };
  document.getElementById('export').onclick = () => exportJSON();
  document.getElementById('import').onchange = async ev => { const f = ev.target.files[0]; if (!f) return; try { await importJSON(await f.text(), 'replace'); showToast('Imported'); renderSettings(); } catch (e) { showToast(e.message, 'error'); } };
  document.getElementById('clear').onclick = async () => { if (await confirmDialog('Erase ALL expenses and settings on this device?')) { await clearAllData(); showToast('Cleared'); renderSettings(); } };
  wireSync();

  function syncBoxHTML() {
    return isSyncEnabled()
      ? `<div class="muted">Connected · last ${getSyncLastTime()||'—'}</div><button class="btn btn-ghost btn-full" id="sync-now" style="margin-top:8px">${icon('refresh',18)} Sync now</button><button class="btn btn-ghost btn-full" id="disconnect" style="margin-top:8px">Disconnect</button>`
      : `<div class="muted">Paste a GitHub token (gist scope) to sync to your other phone. Use the SAME sync passphrase on both.</div><input id="token" type="password" placeholder="GitHub token" style="margin-top:8px" /><button class="btn btn-primary btn-full" id="connect" style="margin-top:8px">Connect</button>`;
  }
  function wireSync() {
    const connect = document.getElementById('connect');
    if (connect) connect.onclick = async () => { try { connect.textContent='Connecting…'; const r = await connectSync(document.getElementById('token').value); showToast('Sync ' + r.action); renderSettings(); } catch (e) { showToast(e.message, 'error'); connect.textContent='Connect'; } };
    const now = document.getElementById('sync-now');
    if (now) now.onclick = async () => { try { await pullFromGist(); await pushToGist(); showToast('Synced'); renderSettings(); } catch (e) { showToast(e.message, 'error'); } };
    const dc = document.getElementById('disconnect');
    if (dc) dc.onclick = async () => { await disconnectSync(); showToast('Disconnected'); renderSettings(); };
  }
}
function openCategoryEditor(existing, done) {
  const o = document.createElement('div'); o.className = 'modal-overlay';
  o.innerHTML = `<div class="modal card"><div class="section-head"><span>${existing?'Edit':'New'} category</span></div>
    <input id="c-label" placeholder="Name" value="${esc(existing ? existing.label : '')}" />
    <div class="icon-grid" id="c-icons">${CATEGORY_ICON_CHOICES.map(n=>`<button class="icon-pick" data-icon="${n}">${icon(n,20)}</button>`).join('')}</div>
    <div class="color-grid" id="c-colors">${PRESET_COLORS.map(c=>`<button class="color-pick" data-color="${c}" style="background:${c}"></button>`).join('')}</div>
    <div class="modal-actions"><button class="btn btn-ghost" id="c-cancel">Cancel</button><button class="btn btn-primary" id="c-save">Save</button></div></div>`;
  document.body.appendChild(o);
  let sIcon = existing?existing.icon:CATEGORY_ICON_CHOICES[0], sColor = existing?existing.color:PRESET_COLORS[0];
  const mark = () => { o.querySelectorAll('.icon-pick').forEach(b=>b.classList.toggle('sel',b.dataset.icon===sIcon)); o.querySelectorAll('.color-pick').forEach(b=>b.classList.toggle('sel',b.dataset.color===sColor)); };
  o.querySelector('#c-icons').onclick = e => { const b=e.target.closest('[data-icon]'); if(b){sIcon=b.dataset.icon;mark();} };
  o.querySelector('#c-colors').onclick = e => { const b=e.target.closest('[data-color]'); if(b){sColor=b.dataset.color;mark();} };
  o.querySelector('#c-cancel').onclick = () => o.remove();
  o.querySelector('#c-save').onclick = async () => {
    const label = o.querySelector('#c-label').value.trim(); if (!label) return;
    if (existing) await updateCategory(existing.id, { label, icon: sIcon, color: sColor });
    else await addCategory({ label, icon: sIcon, color: sColor });
    o.remove(); done();
  };
  mark();
}
bootstrap(renderSettings);
