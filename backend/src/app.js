const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const env = require('./config/env');
const passport = require('./config/passport');
const routes = require('./routes');
const { isAllowedOrigin } = require('./lib/origin');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
// Behind the Next.js proxy on a private network: honor its X-Forwarded-* so secure cookies and
// client IPs work, without letting clients spoof them from the public internet.
app.set('trust proxy', 'loopback, linklocal, uniquelocal');

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (origin, done) => done(null, !origin || isAllowedOrigin(origin)), credentials: true }));

app.use(
  '/api/',
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    skip: (req) =>
      !env.isProduction ||
      req.path === '/health' ||
      req.path.startsWith('/payments/webhook/') ||
      req.path === '/telegram/webhook',
    message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  })
);

// Sessions only hold the short-lived PKCE state for the X and Telegram OAuth flows.
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    // 'auto': Secure over HTTPS (per X-Forwarded-Proto), still works over plain-HTTP LAN/dev origins.
    // 'lax' so the cookie is sent on the top-level redirect back from the provider.
    cookie: { secure: 'auto', sameSite: 'lax', httpOnly: true, maxAge: 10 * 60 * 1000 },
  })
);
app.use(passport.initialize());

// Calls from the CHTH hub are signed over the raw body, so they're read as text, before JSON.
const internal = require('./controllers/internal.controller');
const { requireHub } = require('./services/hub.service');
app.get('/api/internal/stats', requireHub, internal.stats);
app.post('/api/internal/orders/status', express.text({ type: '*/*', limit: '16kb' }), requireHub, internal.setOrderStatus);
const announcement = require('./controllers/announcement.controller');
app.post('/api/internal/announcement', express.text({ type: '*/*', limit: '16kb' }), requireHub, announcement.set);
app.get('/api/announcement', announcement.get);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (!env.isProduction) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

app.use('/api', routes);
app.use('/api', notFound);
// Serves previously uploaded product images referenced as `/uploads/...`.
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

app.use(errorHandler);

module.exports = app;
