const _SYNC_TOKEN = 'gk_sync_token', _SYNC_GIST = 'gk_sync_gist', _SYNC_TS = 'gk_sync_ts';
const _GIST_FILE = 'ghar-kharch.json', _GIST_DESC = 'Ghar Kharch Sync', _LS = 'gk_data';

function isSyncEnabled() { return !!(localStorage.getItem(_SYNC_TOKEN) && localStorage.getItem(_SYNC_GIST)); }
function getSyncLastTime() {
  const ts = localStorage.getItem(_SYNC_TS); if (!ts) return null;
  const d = Date.now() - parseInt(ts);
  if (d < 60000) return 'just now';
  if (d < 3600000) return Math.floor(d / 60000) + 'm ago';
  if (d < 86400000) return Math.floor(d / 3600000) + 'h ago';
  return new Date(parseInt(ts)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
async function _api(method, path, body, token) {
  const tok = token || localStorage.getItem(_SYNC_TOKEN);
  const res = await fetch('https://api.github.com/gists' + path, {
    method, headers: { 'Authorization': 'Bearer ' + tok, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'GitHub API ' + res.status); }
  return res.json();
}
async function _findGist(token) {
  for (let p = 1; p <= 5; p++) {
    const list = await _api('GET', '?per_page=100&page=' + p, null, token);
    if (!list.length) break;
    const found = list.find(g => g.description === _GIST_DESC && g.files[_GIST_FILE]);
    if (found) return found; if (list.length < 100) break;
  }
  return null;
}
async function _canDecrypt(blob) {
  try { const d = await decryptData(blob, getSessionKey()); return !!(d && Array.isArray(d.expenses) && typeof d.monthlyLimit === 'number'); } catch { return false; }
}
async function connectSync(token) {
  token = token.trim();
  const u = await fetch('https://api.github.com/user', { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' } });
  if (!u.ok) throw new Error('Invalid token — it needs the "gist" scope.');
  localStorage.setItem(_SYNC_TOKEN, token);
  const existing = await _findGist(token);
  if (existing) {
    localStorage.setItem(_SYNC_GIST, existing.id);
    const content = existing.files[_GIST_FILE] && existing.files[_GIST_FILE].content;
    if (content) {
      const { ts, blob } = JSON.parse(content);
      const localTs = parseInt(localStorage.getItem(_SYNC_TS) || '0');
      if (ts > localTs) {
        if (await _canDecrypt(blob)) {
          localStorage.setItem(_LS, blob); localStorage.setItem(_SYNC_TS, ts); clearDataCache();
          return { action: 'pulled' };
        }
        throw new Error('Passphrase mismatch — both phones must use the same sync passphrase.');
      }
    }
    await pushToGist(); return { action: 'pushed' };
  }
  const blob = localStorage.getItem(_LS) || ''; const ts = Date.now();
  const g = await _api('POST', '', { description: _GIST_DESC, public: false, files: { [_GIST_FILE]: { content: JSON.stringify({ ts, blob }) } } }, token);
  localStorage.setItem(_SYNC_GIST, g.id); localStorage.setItem(_SYNC_TS, ts);
  return { action: 'created' };
}
async function pushToGist(blobParam) {
  if (!isSyncEnabled()) return;
  const blob = blobParam || localStorage.getItem(_LS); if (!blob) return;
  const ts = Date.now();
  await _api('PATCH', '/' + localStorage.getItem(_SYNC_GIST), { files: { [_GIST_FILE]: { content: JSON.stringify({ ts, blob }) } } });
  localStorage.setItem(_SYNC_TS, ts);
}
async function pullFromGist() {
  if (!isSyncEnabled()) return false;
  const g = await _api('GET', '/' + localStorage.getItem(_SYNC_GIST));
  const content = g.files[_GIST_FILE] && g.files[_GIST_FILE].content; if (!content) return false;
  const { ts, blob } = JSON.parse(content);
  if (ts > parseInt(localStorage.getItem(_SYNC_TS) || '0')) {
    if (!(await _canDecrypt(blob))) throw new Error('Passphrase mismatch — both phones must use the same sync passphrase.');
    localStorage.setItem(_LS, blob); localStorage.setItem(_SYNC_TS, ts); clearDataCache(); return true;
  }
  return false;
}
async function syncOnLogin() { if (!isSyncEnabled()) return false; sessionStorage.setItem('gk_synced', '1'); try { return await pullFromGist(); } catch (e) { console.warn(e); return false; } }
async function syncInBackground() { if (!isSyncEnabled() || sessionStorage.getItem('gk_synced')) return; sessionStorage.setItem('gk_synced', '1'); try { if (await pullFromGist()) location.reload(); } catch (e) { console.warn(e); } }
async function disconnectSync() { [_SYNC_TOKEN, _SYNC_GIST, _SYNC_TS].forEach(k => localStorage.removeItem(k)); }
