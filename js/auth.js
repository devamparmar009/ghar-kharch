const META_KEY = 'gk_meta';
const SK_KEY = 'gk_sk';
function isInitialized() { return !!localStorage.getItem(META_KEY); }
function _meta() { try { return JSON.parse(localStorage.getItem(META_KEY)); } catch { return null; } }

async function _persistSession(key) {
  setSessionKey(key);
  sessionStorage.setItem(SK_KEY, await exportRawKey(key));
}
async function _restoreSession() {
  const raw = sessionStorage.getItem(SK_KEY);
  if (!raw) return false;
  try { setSessionKey(await importRawKey(raw)); return true; } catch { return false; }
}

async function requireAuth(onReady) {
  const overlay = document.getElementById('auth-overlay');
  const app = document.getElementById('app');
  const show = () => { overlay.style.display = 'none'; app.style.display = 'block'; };

  if (await _restoreSession()) { show(); onReady(); if (typeof syncInBackground === 'function') syncInBackground().catch(() => {}); return; }
  overlay.style.display = 'flex';
  if (!isInitialized()) renderSetup(overlay, () => { show(); onReady(); });
  else renderUnlock(overlay, () => { show(); onReady(); });
}

function renderSetup(overlay, done) {
  overlay.innerHTML = `
    <div class="auth-card card">
      <div class="auth-brand">${icon('wallet', 30)}<h1>Ghar Kharch</h1><p class="muted">Set up your household ledger</p></div>
      <div class="auth-error" id="aerr"></div>
      <label>Sync passphrase <span class="muted">(used on both phones)</span></label>
      <input type="password" id="pp1" placeholder="Choose a passphrase" autocomplete="new-password" />
      <input type="password" id="pp2" placeholder="Repeat passphrase" autocomplete="new-password" />
      <label>Daily PIN <span class="muted">(quick unlock)</span></label>
      <input type="password" inputmode="numeric" id="pin1" placeholder="4–6 digit PIN" maxlength="6" />
      <input type="password" inputmode="numeric" id="pin2" placeholder="Repeat PIN" maxlength="6" />
      <button class="btn btn-primary btn-full" id="go">Get started</button>
    </div>`;
  document.getElementById('go').onclick = async () => {
    const pp = pp1.value, pp_ = pp2.value, pin = pin1.value, pin_ = pin2.value, err = document.getElementById('aerr');
    if (pp.length < 6) return show(err, 'Passphrase must be at least 6 characters.');
    if (pp !== pp_) return show(err, 'Passphrases do not match.');
    if (!/^\d{4,6}$/.test(pin)) return show(err, 'PIN must be 4–6 digits.');
    if (pin !== pin_) return show(err, 'PINs do not match.');
    const key = await deriveKey(pp);
    localStorage.setItem(META_KEY, JSON.stringify({ passHash: await passphraseHash(pp), wrappedKey: await wrapKey(key, pin) }));
    await _persistSession(key);
    clearDataCache(); await saveData(blankData());
    if (typeof syncOnLogin === 'function') await Promise.race([syncOnLogin(), new Promise(r => setTimeout(r, 5000))]);
    done();
  };
  function show(el, m) { el.textContent = m; el.style.display = 'block'; }
}

function renderUnlock(overlay, done) {
  overlay.innerHTML = `
    <div class="auth-card card">
      <div class="auth-brand">${icon('lock', 28)}<h1>Enter PIN</h1></div>
      <div class="auth-error" id="aerr"></div>
      <input type="password" inputmode="numeric" id="pin" placeholder="PIN" maxlength="6" autofocus />
      <button class="btn btn-primary btn-full" id="go">Unlock</button>
      <button class="btn btn-ghost btn-full" id="forgot">Use passphrase instead</button>
    </div>`;
  document.getElementById('go').onclick = async () => {
    const key = await unwrapKey(_meta().wrappedKey, document.getElementById('pin').value);
    if (!key) { const e = document.getElementById('aerr'); e.textContent = 'Wrong PIN.'; e.style.display = 'block'; return; }
    await _persistSession(key); done();
    if (typeof syncInBackground === 'function') syncInBackground().catch(() => {});
  };
  document.getElementById('forgot').onclick = () => renderPassphraseUnlock(overlay, done);
}

function renderPassphraseUnlock(overlay, done) {
  overlay.innerHTML = `
    <div class="auth-card card">
      <div class="auth-brand">${icon('wallet', 28)}<h1>Enter passphrase</h1><p class="muted">Then set a new PIN for this device</p></div>
      <div class="auth-error" id="aerr"></div>
      <input type="password" id="pp" placeholder="Sync passphrase" />
      <input type="password" inputmode="numeric" id="np" placeholder="New PIN (4–6 digits)" maxlength="6" />
      <button class="btn btn-primary btn-full" id="go">Unlock</button>
    </div>`;
  document.getElementById('go').onclick = async () => {
    const pp = document.getElementById('pp').value, np = document.getElementById('np').value, err = document.getElementById('aerr');
    if (await passphraseHash(pp) !== _meta().passHash) { err.textContent = 'Wrong passphrase.'; err.style.display = 'block'; return; }
    if (!/^\d{4,6}$/.test(np)) { err.textContent = 'PIN must be 4–6 digits.'; err.style.display = 'block'; return; }
    const key = await deriveKey(pp);
    const meta = _meta(); meta.wrappedKey = await wrapKey(key, np); localStorage.setItem(META_KEY, JSON.stringify(meta));
    await _persistSession(key); done();
  };
}

async function changePin(currentPin, newPin) {
  const key = await unwrapKey(_meta().wrappedKey, currentPin);
  if (!key) throw new Error('Current PIN is incorrect.');
  if (!/^\d{4,6}$/.test(newPin)) throw new Error('PIN must be 4–6 digits.');
  const meta = _meta(); meta.wrappedKey = await wrapKey(key, newPin); localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function getWrappedKeyExists() { const m = _meta(); return !!(m && m.wrappedKey); }
