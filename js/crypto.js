const APP_SALT_STR = 'ghar-kharch::shared-salt::v1';
const APP_SALT = new TextEncoder().encode(APP_SALT_STR);

function _u8ToB64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}

async function _deriveAes(secret, salt, usages) {
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' },
    km, { name: 'AES-GCM', length: 256 }, true, usages
  );
}
async function deriveKey(passphrase) {
  return _deriveAes(passphrase, APP_SALT, ['encrypt', 'decrypt']);
}
async function encryptData(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(data)));
  const combined = new Uint8Array(iv.length + ct.byteLength);
  combined.set(iv); combined.set(new Uint8Array(ct), iv.length);
  return _u8ToB64(combined);
}
async function decryptData(b64, key) {
  try {
    const combined = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined.slice(12));
    return JSON.parse(new TextDecoder().decode(pt));
  } catch { return null; }
}
async function passphraseHash(passphrase) {
  const combined = new Uint8Array([...new TextEncoder().encode(passphrase + 'gk-verify'), ...APP_SALT]);
  const h = await crypto.subtle.digest('SHA-256', combined);
  return _u8ToB64(new Uint8Array(h));
}
async function exportRawKey(key) {
  return _u8ToB64(new Uint8Array(await crypto.subtle.exportKey('raw', key)));
}
async function importRawKey(b64) {
  const raw = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}
// PIN salt is fixed-but-distinct; the PIN only protects the locally-stored key,
// it never derives the data key.
const PIN_SALT = new TextEncoder().encode('ghar-kharch::pin-salt::v1');
async function wrapKey(cryptoKey, pin) {
  const wrapper = await _deriveAes(String(pin), PIN_SALT, ['encrypt', 'decrypt']);
  const raw = await exportRawKey(cryptoKey);
  return encryptData({ k: raw }, wrapper);
}
async function unwrapKey(wrappedB64, pin) {
  const wrapper = await _deriveAes(String(pin), PIN_SALT, ['encrypt', 'decrypt']);
  const obj = await decryptData(wrappedB64, wrapper);
  if (!obj || !obj.k) return null;
  return importRawKey(obj.k);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { deriveKey, encryptData, decryptData, passphraseHash, exportRawKey, importRawKey, wrapKey, unwrapKey };
}
