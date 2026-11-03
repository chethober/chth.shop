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

// Sessions only hold short-lived OAuth state.
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: env.isProduction, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
  })
);
app.use(passport.initialize());

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
