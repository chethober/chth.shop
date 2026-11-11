// The hub's calls into the shop: only requests signed with HUB_SECRET get through, and the
// raw body is what's verified. Runs without a database.
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

process.env.HUB_SECRET = 's'.repeat(32);
const { requireHub } = require('../src/services/hub.service');

function server() {
  const app = express();
  app.get('/api/internal/stats', requireHub, (req, res) => res.json({ ok: true }));
  app.post('/api/internal/orders/status', express.text({ type: '*/*' }), requireHub, (req, res) => res.json({ ok: true, body: req.hubBody }));
  return new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
}

test('only signed hub requests reach /api/internal', async () => {
  const { signedHeaders } = await import('../src/chth-kit/hub.mjs');
  const s = await server();
  const base = `http://127.0.0.1:${s.address().port}`;
  try {
    const statsUrl = `${base}/api/internal/stats`;
    assert.equal((await fetch(statsUrl)).status, 403);
    const good = await signedHeaders({ source: 'hub', secret: 's'.repeat(32), method: 'GET', url: statsUrl });
    assert.equal((await fetch(statsUrl, { headers: good })).status, 200);
    const wrong = await signedHeaders({ source: 'hub', secret: 'x'.repeat(32), method: 'GET', url: statsUrl });
    assert.equal((await fetch(statsUrl, { headers: wrong })).status, 403);

    const actionUrl = `${base}/api/internal/orders/status`;
    const body = JSON.stringify({ id: 'o1', status: 'SHIPPED' });
    const headers = await signedHeaders({ source: 'hub', secret: 's'.repeat(32), url: actionUrl, body });
    const res = await fetch(actionUrl, { method: 'POST', headers, body });
    assert.deepEqual(await res.json(), { ok: true, body: { id: 'o1', status: 'SHIPPED' } });
    const tampered = await fetch(actionUrl, { method: 'POST', headers, body: body.replace('SHIPPED', 'CANCELLED') });
    assert.equal(tampered.status, 403);
  } finally {
    s.close();
  }
});

test('the banner follows the CHTH kit rules', () => {
  const { parseAnnouncement } = require('../src/lib/announcement');
  assert.deepEqual(parseAnnouncement({ text: ' ' }), { ok: true, announcement: null });
  assert.equal(parseAnnouncement({ text: 'x'.repeat(201) }).ok, false);
  assert.equal(parseAnnouncement({ text: 'Hi', url: 'javascript:alert(1)' }).ok, false);
  assert.deepEqual(parseAnnouncement({ text: ' Sale ', url: 'https://chth.shop' }), { ok: true, announcement: { text: 'Sale', url: 'https://chth.shop' } });
});
