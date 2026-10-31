// The CHTH hub (the owner's private admin bot). The shop reports new orders (so the admin bot
// can show them with Confirm / Shipped / Cancel buttons), sign-ups and server errors, and
// answers two signed calls from the hub under /api/internal:
//   GET  /api/internal/stats          counts, revenue and the open orders
//   POST /api/internal/orders/status  { id, status }: an order button pressed in the bot
// Requests in both directions are signed with HUB_SECRET (see src/chth-kit/hub.mjs). Without
// HUB_URL and HUB_SECRET nothing is sent and /api/internal refuses every call.

const env = require('../config/env');

// The kit is an ES module; load it once, lazily.
let kit;
const loadKit = () => (kit ??= import('../chth-kit/hub.mjs'));

const enabled = () => Boolean(env.hub.url && env.hub.secret);

/** Sends one event without waiting for the hub. Never throws. */
function track(type, data = {}, user) {
  if (!enabled()) return;
  loadKit()
    .then(({ createReporter }) => createReporter({ url: env.hub.url, secret: env.hub.secret, source: 'shop' }).track(type, data, user))
    .catch((error) => console.warn('chth hub: report failed', error.message));
}

/** Express middleware: lets through only requests the hub signed. Needs the raw body (express.text). */
async function requireHub(req, res, next) {
  try {
    if (!env.hub.secret) return res.status(403).json({ ok: false, error: 'forbidden' });
    const { verifySigned } = await loadKit();
    const body = typeof req.body === 'string' ? req.body : '';
    const request = new Request(`http://shop${req.originalUrl}`, {
      method: req.method,
      headers: Object.entries(req.headers).filter(([, v]) => typeof v === 'string'),
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
    });
    const ok = await verifySigned(request, (source) => (source === 'hub' ? env.hub.secret : null));
    if (!ok) return res.status(403).json({ ok: false, error: 'forbidden' });
    req.hubBody = body ? JSON.parse(body) : {};
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { track, requireHub, enabled };
