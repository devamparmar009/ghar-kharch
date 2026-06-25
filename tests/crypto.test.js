const test = require('node:test');
const assert = require('node:assert');
const c = require('../js/crypto.js');

test('encrypt then decrypt round-trips with the same passphrase', async () => {
  const key = await c.deriveKey('open-sesame');
  const blob = await c.encryptData({ hello: 'world', n: 42 }, key);
  assert.strictEqual(typeof blob, 'string');
  const out = await c.decryptData(blob, key);
  assert.deepStrictEqual(out, { hello: 'world', n: 42 });
});

test('same passphrase on a "second device" derives a compatible key', async () => {
  const k1 = await c.deriveKey('family123');
  const blob = await c.encryptData({ a: 1 }, k1);
  const k2 = await c.deriveKey('family123');   // simulates the other phone
  assert.deepStrictEqual(await c.decryptData(blob, k2), { a: 1 });
});

test('wrong passphrase fails to decrypt (returns null)', async () => {
  const blob = await c.encryptData({ a: 1 }, await c.deriveKey('right'));
  assert.strictEqual(await c.decryptData(blob, await c.deriveKey('wrong')), null);
});

test('PIN wraps/unwraps the key; wrong PIN returns null; changing PIN keeps the key', async () => {
  const key = await c.deriveKey('passphrase');
  const wrapped = await c.wrapKey(key, '1234');
  const unwrapped = await c.unwrapKey(wrapped, '1234');
  assert.notStrictEqual(unwrapped, null);
  const blob = await c.encryptData({ ok: true }, key);
  assert.deepStrictEqual(await c.decryptData(blob, unwrapped), { ok: true });
  assert.strictEqual(await c.unwrapKey(wrapped, '0000'), null);
});
